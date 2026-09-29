import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../data/cs66.sqlite');

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for smooth concurrent reads and writes
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA synchronous = NORMAL;');

// Initialize tables
db.exec(`
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  fullname TEXT DEFAULT '',
  student_id TEXT DEFAULT '',
  role TEXT DEFAULT '',
  category TEXT DEFAULT 'Frontend',
  quote TEXT DEFAULT '',
  skills TEXT DEFAULT '[]',
  color TEXT DEFAULT '#6baaff',
  about TEXT DEFAULT '',
  social TEXT DEFAULT '{}',
  image TEXT,
  image_fit TEXT DEFAULT 'cover',
  birthday TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  image TEXT NOT NULL,
  title TEXT NOT NULL,
  caption TEXT DEFAULT '',
  album TEXT DEFAULT 'first-year',
  album_label TEXT DEFAULT '',
  custom INTEGER DEFAULT 0,
  created_at INTEGER
);
`);

function loadDefaultMembers() {
  try {
    const tsPath = path.resolve(__dirname, '../data/members.ts');
    const content = fs.readFileSync(tsPath, 'utf8');
    const match = content.match(/export const members: Member\[\] = (\[[\s\S]*?\]);/);
    if (match) {
      return (new Function(`return ${match[1]}`))();
    }
  } catch (err) {
    console.error('Failed to load default members from data/members.ts:', err.message);
  }
  return [];
}

function loadDefaultMemories() {
  try {
    const tsPath = path.resolve(__dirname, '../data/memories.ts');
    const content = fs.readFileSync(tsPath, 'utf8');
    const match = content.match(/export const memories = (\[[\s\S]*?\]);/);
    if (match) {
      return (new Function(`return ${match[1]}`))();
    }
  } catch (err) {
    console.error('Failed to load default memories from data/memories.ts:', err.message);
  }
  return [];
}

// Seed default members if table is empty
const memberCountRow = db.prepare('SELECT COUNT(*) as count FROM members').get();
if (memberCountRow && memberCountRow.count === 0) {
  const defaults = loadDefaultMembers();
  const insert = db.prepare(`
    INSERT INTO members (
      id, nickname, fullname, student_id, role, category, quote,
      skills, color, about, social, image, image_fit, birthday, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = Date.now();
  for (let i = 0; i < defaults.length; i++) {
    const m = defaults[i];
    insert.run(
      m.id,
      m.nickname || '',
      m.fullname || '',
      m.studentId || '',
      m.role || '',
      m.category || 'Frontend',
      m.quote || '',
      JSON.stringify(Array.isArray(m.skills) ? m.skills : []),
      m.color || '#6baaff',
      m.about || '',
      JSON.stringify(typeof m.social === 'object' && m.social ? m.social : {}),
      m.image || null,
      m.imageFit || 'cover',
      m.birthday || null,
      now - (defaults.length - i) * 1000,
      now
    );
  }
  console.log(`[SQLite] Seeded ${defaults.length} default members into database.`);
}

// Seed default memories if table is empty
const memoryCountRow = db.prepare('SELECT COUNT(*) as count FROM memories').get();
if (memoryCountRow && memoryCountRow.count === 0) {
  const defaults = loadDefaultMemories();
  const insert = db.prepare(`
    INSERT INTO memories (
      id, image, title, caption, album, album_label, custom, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = Date.now();
  for (let i = 0; i < defaults.length; i++) {
    const mem = defaults[i];
    insert.run(
      mem.id,
      mem.image,
      mem.title || '',
      mem.caption || '',
      mem.album || 'first-year',
      mem.albumLabel || '',
      0,
      now - (defaults.length - i) * 100
    );
  }
  console.log(`[SQLite] Seeded ${defaults.length} default memories into database.`);
}

function mapMemberRow(row) {
  if (!row) return null;
  let skills = [];
  try {
    skills = JSON.parse(row.skills || '[]');
  } catch {}
  let social = {};
  try {
    social = JSON.parse(row.social || '{}');
  } catch {}

  return {
    id: row.id,
    nickname: row.nickname,
    fullname: row.fullname || '',
    studentId: row.student_id || '',
    role: row.role || '',
    category: row.category || 'Frontend',
    quote: row.quote || '',
    skills,
    color: row.color || '#6baaff',
    about: row.about || '',
    social,
    image: row.image || undefined,
    imageFit: row.image_fit || 'cover',
    birthday: row.birthday || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getAllMembers() {
  const rows = db.prepare('SELECT * FROM members ORDER BY created_at DESC').all();
  return rows.map(mapMemberRow);
}

export function getMemberById(id) {
  if (!id || typeof id !== 'string') return null;
  const row = db.prepare('SELECT * FROM members WHERE id = ?').get(id.trim());
  return mapMemberRow(row);
}

export function saveMember(member) {
  const rawId = member.id?.trim() || '';
  const existing = rawId ? getMemberById(rawId) : null;
  const now = Date.now();
  const id = rawId || `cs66-${Date.now().toString(36)}`;
  const skillsJson = JSON.stringify(Array.isArray(member.skills) ? member.skills : []);
  const socialJson = JSON.stringify(typeof member.social === 'object' && member.social ? member.social : {});

  if (existing) {
    const update = db.prepare(`
      UPDATE members SET
        nickname = ?,
        fullname = ?,
        student_id = ?,
        role = ?,
        category = ?,
        quote = ?,
        skills = ?,
        color = ?,
        about = ?,
        social = ?,
        image = ?,
        image_fit = ?,
        birthday = ?,
        updated_at = ?
      WHERE id = ?
    `);
    update.run(
      member.nickname || existing.nickname,
      (member.fullname !== undefined ? member.fullname : existing.fullname) || '',
      (member.studentId !== undefined ? member.studentId : existing.studentId) || '',
      (member.role !== undefined ? member.role : existing.role) || '',
      (member.category !== undefined ? member.category : existing.category) || 'Frontend',
      (member.quote !== undefined ? member.quote : existing.quote) || '',
      skillsJson,
      member.color || existing.color || '#6baaff',
      (member.about !== undefined ? member.about : existing.about) || '',
      socialJson,
      (member.image !== undefined ? member.image : existing.image) ?? null,
      member.imageFit || existing.imageFit || 'cover',
      (member.birthday !== undefined ? member.birthday : existing.birthday) ?? null,
      now,
      id
    );
  } else {
    const insert = db.prepare(`
      INSERT INTO members (
        id, nickname, fullname, student_id, role, category, quote,
        skills, color, about, social, image, image_fit, birthday, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(
      id,
      member.nickname || 'เพื่อน CS66',
      member.fullname || '',
      member.studentId || '',
      member.role || 'สมาชิก CS66',
      member.category || 'Frontend',
      member.quote || '',
      skillsJson,
      member.color || '#6baaff',
      member.about || '',
      socialJson,
      member.image ?? null,
      member.imageFit || 'cover',
      member.birthday ?? null,
      now,
      now
    );
  }

  return getMemberById(id);
}

export function deleteMember(id) {
  if (!id || typeof id !== 'string') return false;
  const result = db.prepare('DELETE FROM members WHERE id = ?').run(id.trim());
  return result.changes > 0;
}

export function resetMembers() {
  db.exec('DELETE FROM members');
  const defaults = loadDefaultMembers();
  const insert = db.prepare(`
    INSERT INTO members (
      id, nickname, fullname, student_id, role, category, quote,
      skills, color, about, social, image, image_fit, birthday, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = Date.now();
  for (let i = 0; i < defaults.length; i++) {
    const m = defaults[i];
    insert.run(
      m.id,
      m.nickname || '',
      m.fullname || '',
      m.studentId || '',
      m.role || '',
      m.category || 'Frontend',
      m.quote || '',
      JSON.stringify(Array.isArray(m.skills) ? m.skills : []),
      m.color || '#6baaff',
      m.about || '',
      JSON.stringify(typeof m.social === 'object' && m.social ? m.social : {}),
      m.image || null,
      m.imageFit || 'cover',
      m.birthday || null,
      now - (defaults.length - i) * 1000,
      now
    );
  }
  return getAllMembers();
}

function mapMemoryRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    image: row.image,
    title: row.title,
    caption: row.caption || '',
    album: row.album || 'first-year',
    albumLabel: row.album_label || '',
    custom: Boolean(row.custom),
    createdAt: row.created_at,
  };
}

export function getAllMemories() {
  const rows = db.prepare('SELECT * FROM memories ORDER BY custom DESC, created_at DESC').all();
  return rows.map(mapMemoryRow);
}

export function saveMemory(memory) {
  const id = memory.id?.trim() || `custom-mem-${Date.now()}`;
  const now = Date.now();

  const insert = db.prepare(`
    INSERT OR REPLACE INTO memories (
      id, image, title, caption, album, album_label, custom, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    id,
    memory.image,
    memory.title || 'ความทรงจำ CS66',
    memory.caption || '',
    memory.album || 'first-year',
    memory.albumLabel || '',
    1,
    now
  );

  const row = db.prepare('SELECT * FROM memories WHERE id = ?').get(id);
  return mapMemoryRow(row);
}

export function deleteMemory(id) {
  if (!id || typeof id !== 'string') return false;
  const result = db.prepare('DELETE FROM memories WHERE id = ?').run(id.trim());
  return result.changes > 0;
}
