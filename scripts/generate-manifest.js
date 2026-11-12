import fs from 'fs';
import path from 'path';

// Read version from tauri.conf.json
const tauriConfigPath = path.resolve('src-tauri/tauri.conf.json');
const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf-8'));
const version = tauriConfig.version || '1.0.13';

// Find sig file in nsis bundle matching current version
const nsisDir = path.resolve('src-tauri/target/release/bundle/nsis');
const files = fs.existsSync(nsisDir) ? fs.readdirSync(nsisDir) : [];

// Prefer .nsis.zip.sig (Tauri v2 updater target) or .exe.sig
const sigFile = files.find(f => f.includes(version) && f.endsWith('.nsis.zip.sig')) ||
                files.find(f => f.includes(version) && f.endsWith('.exe.sig')) || 
                files.find(f => f.includes(version) && f.endsWith('.sig')) || 
                files.find(f => f.endsWith('.nsis.zip.sig')) ||
                files.find(f => f.endsWith('.exe.sig'));

if (!sigFile) {
  console.error(`❌ Signature file (.sig) not found for v${version} in src-tauri/target/release/bundle/nsis.`);
  console.error('Available files:', files);
  console.error('Please run npm run tauri:build first.');
  process.exit(1);
}

const sigContent = fs.readFileSync(path.join(nsisDir, sigFile), 'utf-8').trim();
const targetArtifact = sigFile.replace('.sig', '');

// GitHub release assets automatically replace spaces with dots
const githubAsset = targetArtifact.replace(/ /g, '.');

const manifest = {
  version: version,
  notes: `School POS System Live Release v${version} - Customer/student search autocomplete in POS, automatic new buyer profile saving, pending dues tracking and settlement sync, corrected activity performer attribution, and permanent fix for disappearing sales`,
  pub_date: new Date().toISOString(),
  platforms: {
    'windows-x86_64': {
      signature: sigContent,
      url: `https://github.com/afghanbrar/releases-pos/releases/download/v${version}/${githubAsset}`
    }
  }
};

// 1. Generate school-updater.json (primary multi-project release updater)
const outputUpdaterPath = path.join(nsisDir, 'school-updater.json');
fs.writeFileSync(outputUpdaterPath, JSON.stringify(manifest, null, 2));

const rootUpdaterPath = path.resolve('school-updater.json');
fs.writeFileSync(rootUpdaterPath, JSON.stringify(manifest, null, 2));

// 2. Also keep latest.json for backwards compatibility
const outputNsisPath = path.join(nsisDir, 'latest.json');
fs.writeFileSync(outputNsisPath, JSON.stringify(manifest, null, 2));

const rootPath = path.resolve('latest.json');
fs.writeFileSync(rootPath, JSON.stringify(manifest, null, 2));

console.log(`✅ Successfully generated school-updater.json & latest.json for GitHub Release!`);
console.log(`   - Saved to: ${outputUpdaterPath}`);
console.log(`   - Saved to: ${rootUpdaterPath}`);
console.log('\n📄 Manifest Content:');
console.log(JSON.stringify(manifest, null, 2));
console.log(`\n📌 For GitHub Release:`);
console.log(`   1. Create release with Tag: v${version}`);
console.log(`   2. Upload: ${targetArtifact}`);
console.log(`   3. Upload: ${sigFile}`);
console.log(`   4. Upload: school-updater.json`);
console.log(`   5. Upload: latest.json`);
