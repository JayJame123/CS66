import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const downloadsRoot = 'C:/Users/Jayjame/Downloads/ภาพรวมๆ';
const publicMemDir = path.join(rootDir, 'public', 'memories');
const memoriesDataFile = path.join(rootDir, 'data', 'memories.ts');

function hashFile(filePath) {
  return crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
}

// 1. Read existing memories.ts
import { memories as existingMemories, albums } from '../data/memories.ts';

// Map of hash -> existing memory
const hashToExisting = new Map();
existingMemories.forEach(m => {
  const p = path.join(rootDir, 'public', m.image);
  if (fs.existsSync(p)) {
    hashToExisting.set(hashFile(p), m);
  }
});

const folders = [
  { dir: 'ตอนปี1', prefix: 'first-year', album: 'first-year', albumLabel: 'สานสัมพันธ์ปี 1', defaultTitle: 'ความทรงจำสานสัมพันธ์ปี 1', defaultCaption: 'กิจกรรมสานสัมพันธ์น้องพี่ CS66' },
  { dir: 'ดูงานปี2', prefix: 'study-trip', album: 'study-trip', albumLabel: 'ดูงานและทริปปี 2', defaultTitle: 'ทริปดูงานและเรียนรู้นอกห้องเรียน', defaultCaption: 'บรรยากาศทริปดูงานและชายทะเลของ CS66' },
  { dir: 'บายเนียร์ปี2', prefix: 'bye-nior', album: 'bye-nior', albumLabel: 'บายเนียร์ปี 2', defaultTitle: 'ค่ำคืนบายเนียร์ CS66', defaultCaption: 'ความทรงจำและรอยยิ้มจากงานบายเนียร์' },
  { dir: 'จับฉลากปี3', prefix: 'gift-exchange', album: 'gift-exchange', albumLabel: 'จับฉลากปี 3', defaultTitle: 'กิจกรรมจับฉลากปี 3', defaultCaption: 'แลกของขวัญและส่งต่อความสุขท้ายปี' }
];

const allMemories = [];
let addedCount = 0;
let existingCount = 0;

folders.forEach(fo => {
  const folderPath = path.join(downloadsRoot, fo.dir);
  if (!fs.existsSync(folderPath)) {
    console.error(`Folder not found: ${folderPath}`);
    return;
  }

  const files = fs.readdirSync(folderPath).filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png') || f.toLowerCase().endsWith('.jpeg'));
  
  // Sort files nicely
  files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  files.forEach((file, idx) => {
    const filePath = path.join(folderPath, file);
    const fileHash = hashFile(filePath);

    if (hashToExisting.has(fileHash)) {
      // Existing memory item
      allMemories.push(hashToExisting.get(fileHash));
      existingCount++;
    } else {
      // New memory item
      const numStr = String(idx + 1).padStart(3, '0');
      const targetFilename = `${fo.prefix}-add-${numStr}.jpg`;
      const targetPath = path.join(publicMemDir, targetFilename);

      // Copy file to public/memories
      fs.copyFileSync(filePath, targetPath);

      const newItem = {
        id: `${fo.prefix}-add-${numStr}`,
        image: `/memories/${targetFilename}`,
        title: `${fo.defaultTitle} #${idx + 1}`,
        caption: fo.defaultCaption,
        album: fo.album,
        albumLabel: fo.albumLabel
      };

      allMemories.push(newItem);
      addedCount++;
    }
  });
});

console.log(`Processed ${allMemories.length} total photos (Existing: ${existingCount}, Newly Added: ${addedCount})`);

// Write updated data/memories.ts
const code = `export const albums = ${JSON.stringify(albums, null, 2)};
export const memories = ${JSON.stringify(allMemories, null, 2)};
`;

fs.writeFileSync(memoriesDataFile, code, 'utf-8');
console.log(`Updated ${memoriesDataFile} with ${allMemories.length} photos.`);
