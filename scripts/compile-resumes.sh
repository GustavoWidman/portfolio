#!/usr/bin/env bash
set -euo pipefail

if ! command -v typst >/dev/null 2>&1; then
  echo "typst is required to compile resumes" >&2
  exit 1
fi

font_path="${TYPST_FONT_PATH:-}"
if [[ -z "$font_path" ]]; then
  if [[ -n "${COREFONTS_PATH:-}" ]]; then
    font_path="${COREFONTS_PATH}/share/fonts/truetype"
  elif command -v nix >/dev/null 2>&1; then
    corefonts_store="$(NIXPKGS_ALLOW_UNFREE=1 nix build --impure --no-link --print-out-paths nixpkgs#corefonts)"
    font_path="${corefonts_store}/share/fonts/truetype"
  else
    echo "set TYPST_FONT_PATH to a directory containing Times New Roman" >&2
    exit 1
  fi
fi

compile() {
  local source="$1"
  local target="$2"
  typst compile --font-path "$font_path" "$source" "$target"
}

compile typst/resume-en.typ public/resume-en.pdf
compile typst/resume-pt.typ public/resume-pt.pdf
compile typst/resume-google-gce-en.typ public/resume-google-gce-en.pdf
compile typst/resume-sangoma-en.typ public/resume-sangoma-en.pdf
