# CVE-2026-111497: nixpkgs may lag the patched upstream release.
# Keep the build tool and standalone server on the same patched runtime.
pkgs:
if pkgs.lib.versionAtLeast pkgs.bun.version "1.4.4" then
  pkgs.bun
else
  pkgs.bun.overrideAttrs (finalAttrs: previousAttrs: {
    version = "1.4.4";
    src = finalAttrs.passthru.sources.${pkgs.stdenvNoCC.hostPlatform.system};
    passthru = previousAttrs.passthru // {
      sources = {
        "aarch64-linux" = pkgs.fetchurl {
          url = "https://github.com/oven-sh/bun/releases/download/bun-v${finalAttrs.version}/bun-linux-aarch64.zip";
          hash = "sha256-uqa7NvUdblhWHgK76oJQOKnfRU9nPW13bou/hvjHhQ4=";
        };
        "x86_64-linux" = pkgs.fetchurl {
          url = "https://github.com/oven-sh/bun/releases/download/bun-v${finalAttrs.version}/bun-linux-x64-baseline.zip";
          hash = "sha256-4ERutVmVdy65iUvrrppr42jZhai5Jx7hJEhvmUbu3XY=";
        };
        "aarch64-darwin" = pkgs.fetchurl {
          url = "https://github.com/oven-sh/bun/releases/download/bun-v${finalAttrs.version}/bun-darwin-aarch64.zip";
          hash = "sha256-wkDX8My5DCY6hJ/NsJt+5iYw2SE0jtaq/ahrnVd7xRA=";
        };
        "x86_64-darwin" = pkgs.fetchurl {
          url = "https://github.com/oven-sh/bun/releases/download/bun-v${finalAttrs.version}/bun-darwin-x64-baseline.zip";
          hash = "sha256-1KFVrfv9CRVes7oFyeOlRPOSl9emhhbTx3WfZ6tcR9w=";
        };
      };
    };
  })
