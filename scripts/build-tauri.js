import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const keyPath = path.resolve('src-tauri/school-pos.key');
if (!fs.existsSync(keyPath)) {
  console.error('❌ Signer private key not found at src-tauri/school-pos.key');
  process.exit(1);
}

const keyContent = fs.readFileSync(keyPath, 'utf-8').trim();
const password = process.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD || 'schoolpos2026';

console.log('====================================================');
console.log('🚀 School POS System - Automated Signed Release Build');
console.log('====================================================');
console.log('🔑 Signer key loaded: src-tauri/school-pos.key');
console.log('🔐 Private key signing password configured.');

const env = {
  ...process.env,
  TAURI_SIGNING_PRIVATE_KEY: keyContent,
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD: password,
};

console.log('\n⚙️  Running Tauri Build with Signed Updater Artifacts...');
const buildResult = spawnSync('npx', ['tauri', 'build'], {
  env,
  stdio: 'inherit',
  shell: true,
});

if (buildResult.status !== 0) {
  console.error(`\n❌ Tauri build failed with status code ${buildResult.status}`);
  process.exit(buildResult.status || 1);
}

console.log('\n📦 Tauri build succeeded! Now generating release manifest school-updater.json...');
const manifestResult = spawnSync('node', ['scripts/generate-manifest.js'], {
  stdio: 'inherit',
  shell: true,
});

if (manifestResult.status !== 0) {
  console.error('\n❌ Manifest generation failed.');
  process.exit(manifestResult.status || 1);
}

console.log('\n🎉 ALL DONE! Your build is ready with signed updater artifacts and school-updater.json.');
