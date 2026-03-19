#!/usr/bin/env bash

set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: ./release.sh <version>"
  exit 1
fi

VERSION="$1"
TAG="v$VERSION"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+([-.][0-9A-Za-z.-]+)?$ ]]; then
  echo "Invalid version: $VERSION"
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree is not clean. Commit or stash changes before releasing."
  exit 1
fi

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Tag $TAG already exists locally."
  exit 1
fi

if git ls-remote --exit-code --tags origin "refs/tags/$TAG" >/dev/null 2>&1; then
  echo "Tag $TAG already exists on origin."
  exit 1
fi

VERSION="$VERSION" node <<'NODE'
const fs = require("node:fs");

const version = process.env.VERSION;
if (!version) {
  throw new Error("VERSION is required");
}

for (const file of ["package.json", "package-lock.json"]) {
  const raw = fs.readFileSync(file, "utf8");
  const json = JSON.parse(raw);
  json.version = version;
  if (json.packages?.[""]) {
    json.packages[""].version = version;
  }
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
}
NODE

pnpm run sync-version

git add package.json package-lock.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
git commit -m "chore(release): $TAG" -- package.json package-lock.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
git tag "$TAG"
git push origin "$BRANCH"
git push origin "$TAG"

echo "Released $TAG"
