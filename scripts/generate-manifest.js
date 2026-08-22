import fs from 'fs';
import path from 'path';

// Read version from tauri.conf.json
const tauriConfigPath = path.resolve('src-tauri/tauri.conf.json');
const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf-8'));
const version = tauriConfig.version || '1.0.0';

// Find sig file in nsis bundle matching current version
const nsisDir = path.resolve('src-tauri/target/release/bundle/nsis');
const files = fs.existsSync(nsisDir) ? fs.readdirSync(nsisDir) : [];
const sigFile = files.find(f => f.includes(version) && f.endsWith('.exe.sig')) || 
                files.find(f => f.includes(version) && f.endsWith('.sig')) || 
                files.find(f => f.endsWith('.exe.sig'));

if (!sigFile) {
  console.error('❌ Signature file (.sig) not found in src-tauri/target/release/bundle/nsis. Please run npm run tauri:build first.');
  process.exit(1);
}

const sigContent = fs.readFileSync(path.join(nsisDir, sigFile), 'utf-8').trim();
const exeFile = sigFile.replace('.sig', '');

const manifest = {
  version: version,
  notes: `School POS System Live Release v${version}`,
  pub_date: new Date().toISOString(),
  platforms: {
    'windows-x86_64': {
      signature: sigContent,
      url: `https://github.com/DoctorOfCoding/school-pos/releases/download/v${version}/${encodeURIComponent(exeFile)}`
    }
  }
};

const outputPath = path.join(nsisDir, 'latest.json');
fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

console.log(`✅ Successfully generated latest.json for GitHub Release at: ${outputPath}`);
console.log(JSON.stringify(manifest, null, 2));
