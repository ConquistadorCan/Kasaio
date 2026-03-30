#!/usr/bin/env node

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const flags = process.argv.slice(2).filter((a) => a.startsWith("--"));
const newVersion = args[0];
const isRetry = flags.includes("--retry");

if (!newVersion) {
  console.error("Usage: npm run release -- <version> [--retry]");
  console.error("Example: npm run release -- 0.2.0");
  console.error("Retry a failed release (skip version bump): npm run release -- 0.2.0 --retry");
  process.exit(1);
}

function run(cmd) {
  return execSync(cmd, { encoding: "utf-8" }).trim();
}

function checkSemver(current, next) {
  const parse = (v) => v.split(".").map(Number);
  const [cMaj, cMin, cPat] = parse(current);
  const [nMaj, nMin, nPat] = parse(next);
  if (nMaj > cMaj) return true;
  if (nMaj === cMaj && nMin > cMin) return true;
  if (nMaj === cMaj && nMin === cMin && nPat > cPat) return true;
  return false;
}

// 1. Check branch
const branch = run("git rev-parse --abbrev-ref HEAD");
if (branch !== "main") {
  console.error(`Must be on main branch. Currently on: ${branch}`);
  process.exit(1);
}

// 2. Check uncommitted changes
try {
  run("git diff-index --quiet HEAD --");
} catch {
  console.error("You have uncommitted changes. Commit or stash them first.");
  process.exit(1);
}

// 3. Check version is newer (skipped on retry)
const packageJson = JSON.parse(readFileSync("package.json", "utf-8"));
const currentVersion = packageJson.version;

if (isRetry) {
  if (currentVersion !== newVersion) {
    console.error(`--retry expects version files to already be at ${newVersion}, but found ${currentVersion}.`);
    process.exit(1);
  }
  console.log(`Retrying release for v${newVersion} — skipping version bump.`);
} else {
  if (!checkSemver(currentVersion, newVersion)) {
    console.error(
      `New version (${newVersion}) must be greater than current version (${currentVersion}).`,
    );
    console.error(`If the version files were already bumped in a previous attempt, use --retry:`);
    console.error(`  npm run release -- ${newVersion} --retry`);
    process.exit(1);
  }

  // 4. Check CHANGELOG.md is updated
  const changelog = readFileSync("CHANGELOG.md", "utf-8");
  if (!changelog.includes(`[${newVersion}]`)) {
    console.error(
      `CHANGELOG.md does not contain an entry for [${newVersion}]. Update it first.`,
    );
    process.exit(1);
  }

  // 5. Update package.json
  packageJson.version = newVersion;
  writeFileSync("package.json", JSON.stringify(packageJson, null, 2) + "\n");

  // 6. Update tauri.conf.json
  const tauriConf = JSON.parse(readFileSync("src-tauri/tauri.conf.json", "utf-8"));
  tauriConf.version = newVersion;
  writeFileSync("src-tauri/tauri.conf.json", JSON.stringify(tauriConf, null, 2) + "\n");

  // 7. Update Cargo.toml
  let cargoToml = readFileSync("src-tauri/Cargo.toml", "utf-8");
  cargoToml = cargoToml.replace(/^version = ".*"/m, `version = "${newVersion}"`);
  writeFileSync("src-tauri/Cargo.toml", cargoToml);

  // 8. Update main.py
  let mainPy = readFileSync("src-backend/main.py", "utf-8");
  mainPy = mainPy.replace(/version="[^"]*"/, `version="${newVersion}"`);
  writeFileSync("src-backend/main.py", mainPy);

  console.log(`Version bumped: ${currentVersion} → ${newVersion}`);
}

// 9. Commit version bump
run("git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml src-backend/main.py");
run(`git commit -m "chore: bump version to ${newVersion}"`);

// 10. Create tag
run(`git tag v${newVersion}`);

// 11. Push
run("git push origin main");
run(`git push origin v${newVersion}`);

console.log(`Released v${newVersion} successfully.`);