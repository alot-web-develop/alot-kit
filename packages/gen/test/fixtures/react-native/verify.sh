#!/usr/bin/env bash
# Generate every react-native kind into .out (Order / orders), apply the documented manual edits, typecheck.
set -euo pipefail
cd "$(dirname "$0")"
T=../../../templates
G="node gen.mjs $T .out react-native"
rm -rf .out && mkdir -p .out && cp -R base/src .out/src
for k in app-entry providers query-client api-client env theme i18n auth app-layout; do $G $k App; done
for k in service query-keys query mutation; do $G $k Order; done
for k in page layout route list-page composite form hook context store locale; do $G $k Order orders Order; done
$G subcomponent OrderSummary orders Order
$G store OrderPersisted orders Order --persist
$G util formatOrder
$G primitive Badge
npx tsc --noEmit -p .
