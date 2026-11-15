{
  description = "Gustavo Widman's portfolio and blog: a static site and the Caddy and upstreamer configs that serve it";

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
      self,
      nixpkgs,
      bun2nix,
      flake-utils,
      ...
    }:
    let
      # Reference time of the build (unix seconds): the commit time of the flake source.
      # Release epochs of scheduled posts are computed against it, never the wall clock.
      buildTime = toString self.lastModified;

      # Commit shown in the footer and the console: the flake's revision. A dirty tree builds
      # from its parent commit, which is also what a local build reports (`jj log -r @-`).
      commit = self.rev or (if self ? dirtyRev then nixpkgs.lib.removeSuffix "-dirty" self.dirtyRev else null);

      # How a Caddy site block serves the site: `import <snippet> <root> <main|blog>`.
      caddyImport = package: kind: "import ${package}/caddy/portfolio.caddy ${package} ${kind}";

      # nixpkgs no longer evaluates for x86_64-darwin.
      systems = [
        "aarch64-darwin"
        "aarch64-linux"
        "x86_64-linux"
      ];
    in
    flake-utils.lib.eachSystem systems (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [
            self.overlays.default
            bun2nix.overlays.default
          ];
        };
        inherit (pkgs) lib;
      in
      {
        packages.bun = pkgs.bun;

        # The static site: `dist/` of `astro build`. Bun and sharp are only used here.
        packages.default = pkgs.bun2nix.mkDerivation {
          packageJson = ./package.json;
          src = lib.fileset.toSource {
            root = ./.;
            fileset = lib.fileset.unions [
              ./package.json
              ./bun.lock
              ./astro.config.ts
              ./tsconfig.json
              ./src
              ./blog
              ./public
              ./scripts
            ];
          };

          bunDeps = pkgs.bun2nix.fetchBunDeps { bunNix = ./.bun.nix; };
          # Dependencies ship prebuilt binaries; the only lifecycle script is the root
          # postinstall, which regenerates `.bun.nix`.
          dontRunLifecycleScripts = true;

          env = {
            ASTRO_TELEMETRY_DISABLED = "1";
            PORTFOLIO_BUILD_TIME = buildTime;
          }
          // lib.optionalAttrs (commit != null) { PORTFOLIO_COMMIT = commit; }
          // lib.optionalAttrs pkgs.stdenv.hostPlatform.isLinux {
            # Prebuilt native modules (sharp, resvg) link libstdc++ and libgcc_s.
            LD_LIBRARY_PATH = lib.makeLibraryPath [ pkgs.stdenv.cc.cc.lib ];
          };

          # The upstreamer fragments name files by absolute path, so they are generated for
          # the store path the site is installed to.
          buildPhase = ''
            runHook preBuild
            PORTFOLIO_SERVE_ROOT=$out bun --bun run build
            runHook postBuild
          '';

          doCheck = true;
          checkPhase = ''
            runHook preCheck
            bun run check:headings
            bun run check:meta
            bun run check:dates
            bun run check:replays
            runHook postCheck
          '';

          installPhase = ''
            runHook preInstall
            mkdir -p $out
            cp -r dist/. $out/
            runHook postInstall
          '';

          dontFixup = true;

          passthru = { inherit buildTime commit; };

          meta = {
            description = "Gustavo Widman's portfolio and blog (static files, Caddy snippet, upstreamer fragments)";
            homepage = "https://guswid.com";
            license = lib.licenses.mit;
            platforms = lib.platforms.unix;
          };
        };

        # Parses and provisions the generated Caddy snippet the way the NixOS module
        # imports it, for both host kinds.
        checks.caddy-config =
          let
            site = self.packages.${system}.default;
            caddyfile = pkgs.writeText "Caddyfile" ''
              {
                admin off
                auto_https off
                persist_config off
              }
              http://guswid.com {
                ${caddyImport site "main"}
              }
              http://blog.guswid.com {
                ${caddyImport site "blog"}
              }
            '';
          in
          pkgs.runCommand "portfolio-caddy-config" { nativeBuildInputs = [ pkgs.caddy ]; } ''
            export HOME=$TMPDIR XDG_DATA_HOME=$TMPDIR XDG_CONFIG_HOME=$TMPDIR
            caddy validate --adapter caddyfile --config ${caddyfile}
            touch $out
          '';
      }
    )
    // {
      overlays.default = final: prev: { bun = import ./nix/bun.nix prev; };

      nixosModules.default =
        {
          config,
          lib,
          pkgs,
          ...
        }:
        let
          cfg = config.services.portfolio;
          removed = option: [
            "services"
            "portfolio"
            option
          ];
          removedReason = ''
            The portfolio is static files served by Caddy; there is no application server.
            Drop the reverse_proxy virtual hosts and list the hosts in
            services.portfolio.domains and services.portfolio.blogDomains.
          '';
          vhost = kind: {
            extraConfig = ''
              ${cfg.virtualHostConfig}
              ${caddyImport cfg.package kind}
            '';
          };
        in
        {
          imports = [
            (lib.mkRemovedOptionModule (removed "port") removedReason)
            (lib.mkRemovedOptionModule (removed "host") removedReason)
          ];

          options.services.portfolio = {
            enable = lib.mkEnableOption "the portfolio and blog virtual hosts in Caddy";

            package = lib.mkOption {
              type = lib.types.package;
              default = self.packages.${pkgs.stdenv.hostPlatform.system}.default;
              defaultText = lib.literalExpression "portfolio.packages.\${system}.default";
              description = "The built site (static files and `caddy/portfolio.caddy`).";
            };

            domains = lib.mkOption {
              type = lib.types.listOf lib.types.str;
              default = [
                "guswid.com"
                "www.guswid.com"
                "r3dlust.com"
                "www.r3dlust.com"
              ];
              description = "Hosts serving the portfolio at `/` and the blog under `/blog`.";
            };

            blogDomains = lib.mkOption {
              type = lib.types.listOf lib.types.str;
              default = [
                "blog.guswid.com"
                "blog.r3dlust.com"
              ];
              description = "Hosts serving the blog at `/`; `/blog/*` redirects to `/*`.";
            };

            virtualHostConfig = lib.mkOption {
              type = lib.types.lines;
              default = "";
              example = ''
                log {
                  output file /var/log/caddy/portfolio.log
                }
              '';
              description = ''
                Caddy directives added to every portfolio and blog virtual host. Directives
                for a single host (such as `tls`) can be added to
                `services.caddy.virtualHosts.<host>.extraConfig`, which is merged with the
                configuration of this module.
              '';
            };
          };

          config = lib.mkIf cfg.enable {
            services.caddy = {
              enable = lib.mkDefault true;
              virtualHosts =
                lib.genAttrs cfg.domains (_: vhost "main") // lib.genAttrs cfg.blogDomains (_: vhost "blog");
            };
          };
        };
    };
}
