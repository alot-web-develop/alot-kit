#!/usr/bin/env bash
# Bundle a minimal Expo Router app with the theme template files (metro, postcss, global.css, nativewind-env.d.ts)
# and a Better Auth expoClient (package exports resolution) through a real Metro export.
set -euo pipefail
cd "$(dirname "$0")"
T=../../../templates/react-native/theme
D=node_modules/@alot-web-develop/design
M=.metro-check
DESIGN=../../../../design/dist
[ -f "$DESIGN/nativewind.css" ] || (cd ../../../../design && pnpm build)
rm -rf "$D" && mkdir -p "$D"
cp ../../../../design/package.json "$D/package.json"
cp -R "$DESIGN" "$D/dist"
rm -rf "$M" && mkdir -p "$M/app"
for f in metro.config.js postcss.config.mjs global.css nativewind-env.d.ts; do cp "$T/$f" "$M/"; done
echo '{"name":"metro-check","main":"expo-router/entry","private":true}' > "$M/package.json"
echo '{"expo":{"name":"metro-check","slug":"metro-check","scheme":"metrocheck","plugins":["expo-router"]}}' > "$M/app.json"
cat > "$M/app/_layout.tsx" <<'TSX'
import '../global.css';
import { Slot } from 'expo-router';

export default function RootLayout() {
  return <Slot />;
}
TSX
cat > "$M/authClient.ts" <<'TS'
import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

export const authClient = createAuthClient({
  baseURL: 'http://localhost:4000',
  plugins: [expoClient({ scheme: 'metrocheck', storagePrefix: 'metrocheck', storage: SecureStore })],
});
TS
cat > "$M/app/index.tsx" <<'TSX'
import { Text, View } from 'react-native';
import { authClient } from '../authClient';

void authClient.getCookie();

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center rounded-lg bg-surface-1 dark:bg-surface-2">
      <Text className="text-primary dark:text-foreground">metro-check</Text>
    </View>
  );
}
TSX
cp tsconfig.json /tmp/alot-rn-fixture-tsconfig.json
OUT=$(mktemp -d)
(cd "$M" && CI=1 EXPO_NO_TELEMETRY=1 ../node_modules/.bin/expo export --platform ios --no-bytecode --output-dir "$OUT")
BUNDLE=$(ls "$OUT"/_expo/static/js/ios/*.js)
DARK_SURFACE=$(node -e 'import("./node_modules/@alot-web-develop/design/dist/index.js").then(({ themes }) => console.log(themes.default.colors.dark["surface-2"]))')
grep -q "\"surface-2\",\[\[\"$DARK_SURFACE\",\[\[\"=\",\"prefers-color-scheme\",\"dark\"\]\]" "$BUNDLE" || { echo "design dark tokens missing from native bundle"; exit 1; }
grep -q '"rounded-lg",\[{s:\[[0-9,]*\],d:\[{borderRadius:10}' "$BUNDLE" || { echo "rounded-lg is not 10px on native"; exit 1; }
echo "native bundle: design tokens and radius verified"
cp /tmp/alot-rn-fixture-tsconfig.json tsconfig.json
