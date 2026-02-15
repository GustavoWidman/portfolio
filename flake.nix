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
      pname = "portfolio";
      version = "2.3.0";
      commitHash = if self ? rev then self.rev else "dirty";
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
          buildInputs = with pkgs; [
            stdenv.cc.cc.lib
            vips
          ];
          bunDeps = bun2nix.packages.${system}.default.fetchBunDeps {
            bunNix = ./.bun.nix;
          };
          buildPhase = ''
            runHook preBuild
            export LD_LIBRARY_PATH="${pkgs.stdenv.cc.cc.lib}/lib:${pkgs.vips}/lib:$LD_LIBRARY_PATH"
            export SOURCE_COMMIT="${commitHash}"
            bun run build
            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall

            mkdir -p $out
            cp -r out/* $out

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
