import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const packageJsonPath = path.join(rootDir, "package.json");
const tauriConfigPath = path.join(rootDir, "src-tauri", "tauri.conf.json");
const cargoTomlPath = path.join(rootDir, "src-tauri", "Cargo.toml");

const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
const version = packageJson.version;

if (typeof version !== "string" || version.length === 0) {
  throw new Error("package.json version is missing or invalid");
}

const tauriConfig = JSON.parse(await readFile(tauriConfigPath, "utf8"));
if (tauriConfig.version !== version) {
  tauriConfig.version = version;
  await writeFile(tauriConfigPath, `${JSON.stringify(tauriConfig, null, 2)}\n`);
}

const cargoToml = await readFile(cargoTomlPath, "utf8");
const cargoVersionPattern = /^version = ".*"$/m;
if (!cargoVersionPattern.test(cargoToml)) {
  throw new Error("failed to update version in src-tauri/Cargo.toml");
}

const nextCargoToml = cargoToml.replace(
  cargoVersionPattern,
  `version = "${version}"`,
);

if (nextCargoToml !== cargoToml) {
  await writeFile(cargoTomlPath, nextCargoToml);
}

console.log(`Synced app version to ${version}`);
