---
title: automating terraria fishing with rust and memory manipulation
date: 2026-02-12
excerpt: how i went from failing with ocr to writing a performant cheat in rust using assembly pattern scanning and jit hooking.
tags: [rust, reverse-engineering, systems-programming, game-hacking]
---

# automating terraria fishing (because i hate it)

one of my favorite games, automated. i've been playing terraria again with a friend for the past two weeks, and we decided fishing sounded fun. except i hate fishing. i hate the staring, i hate the clicking, i hate the rng.

so naturally, i spent 20x the time it would take to catch the fish manually to write a program that does it for me.

## attempt 1: the computer vision failure

my first thought was "keep it simple". python + opencv + tesseract ocr. just take a screenshot of the game, look for the text that appears above your head when you catch something, and click.

![image of my old python ocr setup](./imgs/ocr-debug.png)

it seemed reasonable until i realized terraria's font (`Andy-Bold`) was designed by a chaotic entity specifically to break optical character recognition. the kerning is weird, the outlines are thick, and the game renders text with a slight wobble.

on top of that, performance was garbage. by the time python processed the frame, recognized the text "Honeyfin", and decided to click, the fish was already gone. i missed over half the spawns due to input lag and ocr processing time.

back to square one.

## attempt 2: reading memory

i pivoted. what if i just... read the fish id directly from ram? no visual processing, no latency. just raw data.

i cracked open **dnspy**, a .net debugger and assembly editor, and started poking around the terraria binary. since terraria is written in c# (xna/monogame), it runs on the .net clr. this makes it both easier and harder to reverse engineer.

easier because the metadata is preserved (function names, variable names). harder because .net uses a fragmented heap and a garbage collector, so objects move around in memory constantly.

i found the holy grail in `Terraria.Projectile.FishingCheck_RollItemDrop`:

![decompiled C# code of FishingCheck_RollItemDrop showing the fisher.rolledItemDrop variable](./imgs/dnspy-code.png)

this function sets `fisher.rolledItemDrop` to the integer id of the fish you just hooked. if i could read that integer, i'd know exactly what was on the line before the game even rendered the text.

### the jit problem

here's the catch: i can't just find a static pointer to `rolledItemDrop`. 
1. **aslr (address space layout randomization)**: the operating system randomizes the memory locations of the program segments every time you run it.
2. **jit (just-in-time) compilation**: .net compiles the intermediate language (il) to native machine code *at runtime*. the code literally doesn't exist at a fixed location until the function is called.

building a pointer chain in cheat engine took me 3+ hours and it broke the moment i restarted the game. i needed a dynamic approach.

### pattern scanning in the heap

instead of hardcoding addresses, i wrote a scanner in rust that searches the process memory for a specific byte signature—the "fingerprint" of the compiled function.

i disassembled `Terraria.Projectile.FishingCheck` to find a stable anchor point.

![disassembled code of FishingCheck showing the creation of FishingContext and the pointer to _context](./imgs/disassembly.png)

i noticed that the code loads the `FishingContext` from a static field `Projectile._context`. the assembly looks something like this:

```assembly
...
55          push ebp
8B EC       mov  ebp, esp
57                    push edi
56                    push esi
50                    push eax
8B F9                 mov  edi, ecx
;     FishingContext context = Projectile._context;
8B 35 ?? ?? ?? ??  mov esi, ds:[addr]  ; <-- the jackpot
;     if (!this.TryBuildFishingContext(context))
8B CF                 mov  ecx, edi
8B D6                 mov  edx, esi
...
```

in rust, i replicated this signature scan. once my scanner finds those bytes, it extracts the `addr` (the `?? ?? ?? ??` part).

```rust
// scanner.rs snippet
let instruction_addr = reader
    .pattern_scan(0x10000000, 0x40000000, &pattern)?;

// read the offset from the mov instruction
let static_addr = reader.read_memory(instruction_addr + 10)?;
```

reading `static_addr` gives us a pointer to the `FishingContext` object on the heap. from there, it's just pointer arithmetic. i reverse-engineered the struct layout and found that `rolledItemDrop` lives at offset `0x68`.

so the final chain is:
`FishingCheck()` signature -> extract `_context` static addr -> read heap ptr -> add `0x68` -> `rolledItemDrop`.

## the "internal" cheat technicality

i ran into a funny bug immediately. i'd catch a bass (id 2290), reel it in, cast again... and the scanner would instantly scream "BASS DETECTED" again.

why? because `rolledItemDrop` is just a memory address. nothing clears it. it still holds `2290` from the last catch. since i'm polling memory externally, i can't hook the "on catch" event to know when a *new* fish appears vs the *old* one still sitting there.

this forced me to upgrade from a read-only passive bot to an active memory manipulator.

```rust
fn zero_memory(&self) -> Result<()> {
    self.reader.write_memory(self.ptr, &0i32)?;
    debug!("zeroed fish memory at 0x{:X}", self.ptr);
    Ok(())
}
```

now, immediately after a successful catch and reel-in, the bot forcibly writes `0` to that memory address. detection reset. problem solved.

## performance obsessed

initially, scanning 1gb of memory sequentially took a few seconds. unacceptable. i swapped the standard iterator for `rayon`, rust's data parallelism library.

```rust
// from sequential scan to parallel joy
memory_pages.par_iter().find_any(|page| scan_page(page, pattern))
```

profiling with `samply` showed the hot loop was allocation-free. scanning dropped from seconds to **milliseconds**. once the pointer is found, the polling loop runs in **microseconds**.

![screenshot of the final rust app running with trace logging enabled showing the scan finding the pattern and following the pointer](./imgs/final-run.png)

## conclusion

it works. it's overkill. it's slightly unethical. but it's the clearest example i have of systems-level thinking: profiling real data, understanding memory layouts, and disciplined unsafe rust patterns.

plus, i never have to fish for crates manually again ;)

check out the code on github: [terraria-autofish](https://github.com/r3dlust/terraria-autofish)
