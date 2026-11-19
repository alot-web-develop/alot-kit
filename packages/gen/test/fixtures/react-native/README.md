Typecheck fixture for React Native templates. Stubs in `stubs/` implement the contracts in `../../../TEMPLATES.md`.

    npm install --no-package-lock --ignore-scripts   # deps stay out of git
    ./verify.sh    # generates every kind into .out (Order / orders), locale registration is wired by the generator, runs tsc --noEmit

`gen.mjs` is a local copy of `~/Development/other/alot-gen-proto/gen.mjs` with extra path keys (`src`, `lib`, `config`, `routes`) and `--persist` / per-file `flag`/`unlessFlag` support.

    ./metro-check.sh   # real Metro export (iOS) of a minimal Expo Router app built from the theme template files

NativeWind v5 RC needs its exact peer pair and a lightningcss pin, as in the NativeWind v5 install guide: `nativewind` + the `react-native-css` RC it declares as peer, `tailwindcss` / `@tailwindcss/postcss` at the tested 4.1.x, and `"overrides": { "lightningcss": "1.30.1" }`. Without the override, Metro fails with `failed to deserialize; expected an object-like struct named Specifier`. The repo-init-agent must apply the same pins when NativeWind v5 is still RC; re-check the guide when v5 goes stable.
