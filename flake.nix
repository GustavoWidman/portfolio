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
      ...
    }:
    let
      pname = "portfolio";
      version = "1.0.0";
    in
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        packages.default = bun2nix.packages.${system}.default.mkDerivation {
          inherit pname version;
          src = ./.;

          dontPatchShebangs = true;
          bunDeps = bun2nix.packages.${system}.default.fetchBunDeps {
            bunNix = ./.bun.nix;
          };
          buildPhase = ''
            runHook preBuild
            bun run build
            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall

            mkdir -p $out
            cp -r dist/* $out

            runHook postInstall
          '';

          meta = with pkgs.lib; {
            description = "Gustavo Widman's personal portfolio website";
            license = licenses.mit;
            platforms = platforms.unix;
          };
        };
      }
    );
}
