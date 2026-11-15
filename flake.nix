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

      # How an upstreamer virtual host serves the site: one step including the generated
      # route fragment, whose file roots are the package's store path.
      upstreamerRoutes = package: kind: [ { include = "${package}/upstreamer/${kind}.json"; } ];

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

        # Evaluates the NixOS module on a host with each proxy, and checks the virtual hosts
        # it defines. upstreamer's module is replaced by a stub declaring the options this
        # module sets; the host that imports the real one validates the fragments with
        # `upstreamer check` when its system is built.
        checks.module-eval =
          let
            site = self.packages.${system}.default;
            upstreamerStub = {
              options.services.upstreamer = {
                enable = lib.mkEnableOption "upstreamer";
                virtualHosts = lib.mkOption {
                  type = lib.types.attrsOf (
                    lib.types.submodule {
                      options.routes = lib.mkOption {
                        type = lib.types.listOf (lib.types.attrsOf lib.types.anything);
                        default = [ ];
                      };
                    }
                  );
                  default = { };
                };
              };
            };
            host =
              modules:
              (nixpkgs.lib.nixosSystem {
                modules = [
                  self.nixosModules.default
                  {
                    boot.isContainer = true;
                    system.stateVersion = "26.05";
                    nixpkgs.hostPlatform = "x86_64-linux";
                    services.portfolio = {
                      enable = true;
                      package = site;
                    };
                  }
                ]
                ++ modules;
              }).config;
            plain = builtins.unsafeDiscardStringContext;
            failed = config: map (a: a.message) (lib.filter (a: !a.assertion) config.assertions);
            names = attrs: lib.sort lib.lessThan (lib.attrNames attrs);
            allHosts = lib.sort lib.lessThan [
              "guswid.com"
              "www.guswid.com"
              "r3dlust.com"
              "www.r3dlust.com"
              "blog.guswid.com"
              "blog.r3dlust.com"
            ];

            caddy = host [ ];
            upstreamer = host [
              upstreamerStub
              { services.portfolio.proxy = "upstreamer"; }
            ];
            caddyWithStub = host [ upstreamerStub ];
            withoutModule = host [ { services.portfolio.proxy = "upstreamer"; } ];
            caddyOptions = host [
              upstreamerStub
              {
                services.portfolio = {
                  proxy = "upstreamer";
                  virtualHostConfig = "log";
                };
              }
            ];

            includes = lib.mapAttrsToList (
              name: vhost: "${name} ${(lib.head vhost.routes).include}"
            ) upstreamer.services.upstreamer.virtualHosts;
          in
          assert failed caddy == [ ];
          assert caddy.services.caddy.enable;
          assert names caddy.services.caddy.virtualHosts == allHosts;
          assert lib.hasInfix (plain (caddyImport site "blog")) (
            plain caddy.services.caddy.virtualHosts."blog.guswid.com".extraConfig
          );
          assert caddyWithStub.services.caddy.virtualHosts == caddy.services.caddy.virtualHosts;
          assert !caddyWithStub.services.upstreamer.enable;
          assert caddyWithStub.services.upstreamer.virtualHosts == { };
          assert failed upstreamer == [ ];
          assert !upstreamer.services.caddy.enable;
          assert upstreamer.services.upstreamer.enable;
          assert names upstreamer.services.upstreamer.virtualHosts == allHosts;
          assert
            upstreamer.services.upstreamer.virtualHosts."www.r3dlust.com".routes
            == upstreamerRoutes site "main";
          assert
            upstreamer.services.upstreamer.virtualHosts."blog.r3dlust.com".routes
            == upstreamerRoutes site "blog";
          assert lib.length (failed withoutModule) == 1;
          assert lib.length (failed caddyOptions) == 1;
          pkgs.runCommand "portfolio-module-eval" { } ''
            while read -r name fragment; do
              test -f "$fragment" || { echo "$name: $fragment is missing" >&2; exit 1; }
            done <<'EOF'
            ${lib.concatStringsSep "\n" includes}
            EOF
            touch $out
          '';
      }
    )
    // {
      overlays.default = final: prev: { bun = import ./nix/bun.nix prev; };

      nixosModules.default =
        {
          config,
          options,
          lib,
          pkgs,
          ...
        }:
        let
          cfg = config.services.portfolio;
          # services.upstreamer is declared by upstreamer's own NixOS module, which this flake
          # does not import. Defining an undeclared option fails evaluation even under a false
          # mkIf, so the upstreamer virtual hosts are only defined when the host imports it.
          hasUpstreamer = options ? services.upstreamer.virtualHosts;
          hosts = f: lib.genAttrs cfg.domains (_: f "main") // lib.genAttrs cfg.blogDomains (_: f "blog");
          removed = option: [
            "services"
            "portfolio"
            option
          ];
          removedReason = ''
            The portfolio is static files served by a web server; there is no application server.
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
            enable = lib.mkEnableOption "the portfolio and blog virtual hosts";

            proxy = lib.mkOption {
              type = lib.types.enum [
                "caddy"
                "upstreamer"
              ];
              default = "caddy";
              description = ''
                The web server that serves the site. `caddy` adds `services.caddy.virtualHosts`
                importing `caddy/portfolio.caddy`. `upstreamer` adds
                `services.upstreamer.virtualHosts` whose only route step includes
                `upstreamer/main.json` or `upstreamer/blog.json`; the host must import
                upstreamer's NixOS module, which validates the fragments when the system is
                built. Either way the server is enabled by default, and per-host settings (TLS,
                logging) go in that server's own virtual host options.
              '';
            };

            package = lib.mkOption {
              type = lib.types.package;
              default = self.packages.${pkgs.stdenv.hostPlatform.system}.default;
              defaultText = lib.literalExpression "portfolio.packages.\${system}.default";
              description = "The built site (static files, `caddy/portfolio.caddy` and `upstreamer/*.json`).";
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
                Caddy directives added to every portfolio and blog virtual host (`proxy =
                "caddy"` only). Directives for a single host (such as `tls`) can be added to
                `services.caddy.virtualHosts.<host>.extraConfig`, which is merged with the
                configuration of this module.
              '';
            };
          };

          config = lib.mkIf cfg.enable (
            lib.mkMerge (
              [
                {
                  assertions = [
                    {
                      assertion = cfg.proxy != "upstreamer" || hasUpstreamer;
                      message = ''
                        services.portfolio.proxy = "upstreamer" needs upstreamer's NixOS module:
                        add its nixosModules.default to the host's imports.
                      '';
                    }
                    {
                      assertion = cfg.proxy != "upstreamer" || cfg.virtualHostConfig == "";
                      message = ''
                        services.portfolio.virtualHostConfig is Caddy configuration. With
                        services.portfolio.proxy = "upstreamer", set per-host options in
                        services.upstreamer.virtualHosts.<host> instead.
                      '';
                    }
                  ];
                }
                (lib.mkIf (cfg.proxy == "caddy") {
                  services.caddy = {
                    enable = lib.mkDefault true;
                    virtualHosts = hosts vhost;
                  };
                })
              ]
              ++ lib.optional hasUpstreamer (
                lib.mkIf (cfg.proxy == "upstreamer") {
                  services.upstreamer = {
                    enable = lib.mkDefault true;
                    virtualHosts = hosts (kind: {
                      routes = upstreamerRoutes cfg.package kind;
                    });
                  };
                }
              )
            )
          );
        };
    };
}
