import { join } from 'node:path';

// Simple zip script that zips dist/ into codefixer.zip
const fs = await import('node:fs/promises');
const dist = join(process.cwd(), 'dist');
const out = join(process.cwd(), 'codefixer.zip');
try {
    await fs.unlink(out);
} catch { }

const { default: AdmZip } = await import('adm-zip');
const zip = new AdmZip();
zip.addLocalFolder(dist);
zip.writeZip(out);
console.log('Created', out);


