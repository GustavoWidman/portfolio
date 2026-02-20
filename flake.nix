{
  inputs = {
    bun2nix = {
      url = "github:baileyluTCD/bun2nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      nixpkgs,
      bun2nix,
      flake-utils,
      self,
      ...
    }:
    let
      commitHash = if self ? rev then self.rev else "dirty";
    in
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        packages.default = bun2nix.packages.${system}.default.mkDerivation {
          packageJson = ./package.json; # inherit `name` and `version` from package.json
          src = ./.;

          dontPatchShebangs = true;
          bunDeps = bun2nix.packages.${system}.default.fetchBunDeps {
            bunNix = ./.bun.nix;
          };
          buildPhase = ''
            export NEXT_TELEMETRY_DISABLED=1
            export SOURCE_COMMIT="${commitHash}"

            bun run build
          '';

          installPhase = ''
            mkdir -p $out
            mv .next/standalone $out/share
            mv .next/static $out/share/.next/static
            mv public $out/share/public

            rm -rf $out/share/.next/cache
            ln -s /var/cache/portfolio $out/share/.next/cache

            mkdir -p $out/bin
            cat > $out/bin/portfolio << EOF
            #!/bin/sh

            export NEXT_TELEMETRY_DISABLED=1
            export NODE_ENV=production
            export SOURCE_COMMIT="${commitHash}"

            cd $out/share
            exec ${pkgs.bun}/bin/bun $out/share/server.js
            EOF
            chmod +x $out/bin/portfolio
          '';

          meta = with pkgs.lib; {
            description = "Gustavo Widman's personal portfolio website";
            license = licenses.mit;
            platforms = platforms.unix;
          };
        };
      }
    )
    // {
      nixosModules.default =
        {
          config,
          lib,
          pkgs,
          ...
        }:
        with lib;
        let
          cfg = config.services.portfolio;
        in
        {
          options.services.portfolio = {
            enable = lib.mkEnableOption "Enable portfolio service";

            package = lib.mkOption {
              type = lib.types.package;
              default = self.packages.${pkgs.system}.default;
              description = "portfolio package to use";
            };

            port = mkOption {
              type = types.port;
              default = 3000;
              description = "Port number for the Next.js server to listen on";
            };

            host = mkOption {
              type = types.str;
              default = "127.0.0.1";
              description = "Host address for the Next.js server to bind to";
            };
          };

          config = lib.mkIf cfg.enable {
            systemd.services.portfolio = {
              description = "portfolio service";
              wantedBy = [ "multi-user.target" ];
              after = [ "network.target" ];

              serviceConfig = {
                Type = "simple";
                ExecStart = "${cfg.package}/bin/portfolio";
                Restart = "on-failure";
                RestartSec = 5;
                Environment = [
                  "PORT=${toString cfg.port}"
                  "HOSTNAME=${cfg.host}"
                ];

                DynamicUser = true;
                CacheDirectory = "portfolio";

                ProtectKernelTunables = true;
                ProtectKernelModules = true;
                ProtectKernelLogs = true;
                ProtectControlGroups = true;
                ProtectClock = true;
                ProtectHostname = true;

                RestrictAddressFamilies = [
                  "AF_INET"
                  "AF_INET6"
                  "AF_UNIX"
                ];
                CapabilityBoundingSet = "";
                SystemCallFilter = [ "@system-service" ];
                SystemCallArchitectures = "native";
                SystemCallErrorNumber = "EPERM";
                RestrictNamespaces = true;
                RestrictRealtime = true;
                RestrictSUIDSGID = true;
                LockPersonality = true;

                NoNewPrivileges = true;
                PrivateTmp = true;
                ProtectSystem = "strict";
                ProtectHome = true;
              };
            };
          };
        };
    };
}
