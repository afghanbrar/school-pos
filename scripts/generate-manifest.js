import fs from 'fs';
import path from 'path';

// Read version from tauri.conf.json
const tauriConfigPath = path.resolve('src-tauri/tauri.conf.json');
const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf-8'));
const version = tauriConfig.version || '1.0.5';

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

const manifest = {
  version: version,
  notes: `School POS System Live Release v${version} - Instant Real-Time UI Performance & Live Updates`,
  pub_date: new Date().toISOString(),
  platforms: {
    'windows-x86_64': {
      signature: sigContent,
      url: `https://github.com/afghanbrar/school-pos/releases/download/v${version}/${encodeURIComponent(targetArtifact)}`
    }
  }
};

const outputNsisPath = path.join(nsisDir, 'latest.json');
fs.writeFileSync(outputNsisPath, JSON.stringify(manifest, null, 2));

// Also write a copy to root for quick access
const rootPath = path.resolve('latest.json');
fs.writeFileSync(rootPath, JSON.stringify(manifest, null, 2));

console.log(`✅ Successfully generated latest.json for GitHub Release!`);
console.log(`   - Saved to: ${outputNsisPath}`);
console.log(`   - Saved to: ${rootPath}`);
console.log('\n📄 Manifest Content:');
console.log(JSON.stringify(manifest, null, 2));
console.log(`\n📌 For GitHub Release:`);
console.log(`   1. Create release with Tag: v${version}`);
console.log(`   2. Upload: ${targetArtifact}`);
console.log(`   3. Upload: ${sigFile}`);
console.log(`   4. Upload: latest.json`);
