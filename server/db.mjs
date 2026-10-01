import pg from 'pg';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:1234@100.70.251.65:5432/CS66';

export const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected error on idle client:', err.message);
});

let isInitialized = false;

// -------------------------------------------------------------
// Load Defaults from Data Files
// -------------------------------------------------------------
function loadDefaultMembers() {
  try {
    const tsPath = path.resolve(__dirname, '../data/members.ts');
    const content = fs.readFileSync(tsPath, 'utf8');
    const match = content.match(/export const members: Member\[\] = (\[[\s\S]*?\]);/);
    if (match) {
      return (new Function(`return ${match[1]}`))();
    }
  } catch (err) {
    console.error('Failed to load default members:', err.message);
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
    console.error('Failed to load default memories:', err.message);
  }
  return [];
}

function loadDefaultTeachers() {
  try {
    const tsPath = path.resolve(__dirname, '../data/teachers.ts');
    const content = fs.readFileSync(tsPath, 'utf8');
    const match = content.match(/export const defaultTeachers: Teacher\[\] = (\[[\s\S]*?\]);/);
    if (match) {
      return (new Function(`return ${match[1]}`))();
    }
  } catch (err) {
    console.error('Failed to load default teachers:', err.message);
  }
  return [];
}

function loadDefaultMessages() {
  try {
    const tsPath = path.resolve(__dirname, '../lib/message-storage.ts');
    const content = fs.readFileSync(tsPath, 'utf8');
    const match = content.match(/export const defaultMessages: FriendMessage\[\] = (\[[\s\S]*?\]);/);
    if (match) {
      return (new Function(`return ${match[1]}`))();
    }
  } catch (err) {
    console.error('Failed to load default messages:', err.message);
  }
  return [];
}

// -------------------------------------------------------------
// Schema Initialization & Seeding
// -------------------------------------------------------------
export async function initDb() {
  if (isInitialized) return;
  try {
    // 1. Members
    await pool.query(`
      CREATE TABLE IF NOT EXISTS members (
        id VARCHAR(255) PRIMARY KEY,
        nickname TEXT NOT NULL,
        fullname TEXT DEFAULT '',
        student_id TEXT DEFAULT '',
        role TEXT DEFAULT '',
        category TEXT DEFAULT 'Frontend',
        quote TEXT DEFAULT '',
        skills JSONB DEFAULT '[]'::jsonb,
        color TEXT DEFAULT '#6baaff',
        about TEXT DEFAULT '',
        social JSONB DEFAULT '{}'::jsonb,
        image TEXT,
        image_fit TEXT DEFAULT 'cover',
        birthday TEXT,
        created_at BIGINT,
        updated_at BIGINT
      );
    `);

    // 2. Memories
    await pool.query(`
      CREATE TABLE IF NOT EXISTS memories (
        id VARCHAR(255) PRIMARY KEY,
        image TEXT NOT NULL,
        title TEXT NOT NULL,
        caption TEXT DEFAULT '',
        album TEXT DEFAULT 'first-year',
        album_label TEXT DEFAULT '',
        custom INTEGER DEFAULT 0,
        created_at BIGINT
      );
    `);

    // 3. Teachers
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teachers (
        id VARCHAR(255) PRIMARY KEY,
        fullname TEXT NOT NULL,
        nickname TEXT DEFAULT '',
        academic_title TEXT DEFAULT '',
        position TEXT DEFAULT '',
        category TEXT DEFAULT 'Software',
        quote TEXT DEFAULT '',
        about TEXT DEFAULT '',
        courses JSONB DEFAULT '[]'::jsonb,
        email TEXT DEFAULT '',
        office TEXT DEFAULT '',
        image TEXT DEFAULT '',
        color TEXT DEFAULT '#6baaff',
        custom INTEGER DEFAULT 0,
        created_at BIGINT
      );
    `);

    // 4. Messages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(255) PRIMARY KEY,
        sender_name TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        receiver_name TEXT NOT NULL,
        content TEXT NOT NULL,
        tag TEXT DEFAULT '',
        likes INTEGER DEFAULT 0,
        color TEXT DEFAULT '#6baaff',
        created_at TEXT
      );
    `);

    // Seed Members
    const memRes = await pool.query('SELECT COUNT(*) as count FROM members');
    if (parseInt(memRes.rows[0].count, 10) === 0) {
      const defaults = loadDefaultMembers();
      const now = Date.now();
      for (let i = 0; i < defaults.length; i++) {
        const m = defaults[i];
        await pool.query(
          `INSERT INTO members (
            id, nickname, fullname, student_id, role, category, quote,
            skills, color, about, social, image, image_fit, birthday, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO NOTHING`,
          [
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
            now,
          ]
        );
      }
      console.log(`[PostgreSQL] Seeded ${defaults.length} default members into database.`);
    }

    // Seed Memories
    const memoryRes = await pool.query('SELECT COUNT(*) as count FROM memories');
    if (parseInt(memoryRes.rows[0].count, 10) === 0) {
      const defaults = loadDefaultMemories();
      const now = Date.now();
      for (let i = 0; i < defaults.length; i++) {
        const mem = defaults[i];
        await pool.query(
          `INSERT INTO memories (
            id, image, title, caption, album, album_label, custom, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING`,
          [
            mem.id,
            mem.image,
            mem.title || '',
            mem.caption || '',
            mem.album || 'first-year',
            mem.albumLabel || '',
            0,
            now - (defaults.length - i) * 100,
          ]
        );
      }
      console.log(`[PostgreSQL] Seeded ${defaults.length} default memories into database.`);
    }

    // Seed Teachers
    const teacherRes = await pool.query('SELECT COUNT(*) as count FROM teachers');
    if (parseInt(teacherRes.rows[0].count, 10) === 0) {
      const defaults = loadDefaultTeachers();
      const now = Date.now();
      for (let i = 0; i < defaults.length; i++) {
        const t = defaults[i];
        await pool.query(
          `INSERT INTO teachers (
            id, fullname, nickname, academic_title, position, category,
            quote, about, courses, email, office, image, color, custom, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (id) DO NOTHING`,
          [
            t.id,
            t.fullname,
            t.nickname || '',
            t.academicTitle || '',
            t.position || '',
            t.category || 'Software',
            t.quote || '',
            t.about || '',
            JSON.stringify(Array.isArray(t.courses) ? t.courses : []),
            t.email || '',
            t.office || '',
            t.image || '',
            t.color || '#6baaff',
            0,
            now - (defaults.length - i) * 1000,
          ]
        );
      }
      console.log(`[PostgreSQL] Seeded ${defaults.length} default teachers into database.`);
    }

    // Seed Messages
    const messageRes = await pool.query('SELECT COUNT(*) as count FROM messages');
    if (parseInt(messageRes.rows[0].count, 10) === 0) {
      const defaults = loadDefaultMessages();
      for (let i = 0; i < defaults.length; i++) {
        const msg = defaults[i];
        await pool.query(
          `INSERT INTO messages (
            id, sender_name, receiver_id, receiver_name, content, tag, likes, color, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO NOTHING`,
          [
            msg.id,
            msg.senderName,
            msg.receiverId || 'all',
            msg.receiverName || 'ทุกคนใน CS66',
            msg.content,
            msg.tag || '',
            msg.likes || 0,
            msg.color || '#6baaff',
            msg.createdAt || new Date().toISOString(),
          ]
        );
      }
      console.log(`[PostgreSQL] Seeded ${defaults.length} default messages into database.`);
    }

    isInitialized = true;
    console.log('[PostgreSQL] Database tables initialized and verified.');
  } catch (err) {
    console.error('[PostgreSQL] Database init failed:', err.message);
  }
}

// -------------------------------------------------------------
// Row Mappers
// -------------------------------------------------------------
function mapMemberRow(row) {
  if (!row) return null;
  const skills = Array.isArray(row.skills) ? row.skills : typeof row.skills === 'string' ? JSON.parse(row.skills) : [];
  const social = typeof row.social === 'object' && row.social !== null ? row.social : typeof row.social === 'string' ? JSON.parse(row.social) : {};

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
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
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
    createdAt: Number(row.created_at),
  };
}

function mapTeacherRow(row) {
  if (!row) return null;
  const courses = Array.isArray(row.courses) ? row.courses : typeof row.courses === 'string' ? JSON.parse(row.courses) : [];

  return {
    id: row.id,
    fullname: row.fullname,
    nickname: row.nickname || undefined,
    academicTitle: row.academic_title || undefined,
    position: row.position,
    category: row.category,
    quote: row.quote || undefined,
    about: row.about || undefined,
    courses,
    email: row.email || undefined,
    office: row.office || undefined,
    image: row.image || undefined,
    color: row.color || '#6baaff',
    custom: Boolean(row.custom),
  };
}

function mapMessageRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    senderName: row.sender_name,
    receiverId: row.receiver_id,
    receiverName: row.receiver_name,
    content: row.content,
    tag: row.tag || undefined,
    likes: Number(row.likes) || 0,
    color: row.color || '#6baaff',
    createdAt: row.created_at,
  };
}

// -------------------------------------------------------------
// Members API
// -------------------------------------------------------------
export async function getAllMembers() {
  await initDb();
  const res = await pool.query('SELECT * FROM members ORDER BY created_at DESC');
  return res.rows.map(mapMemberRow);
}

export async function getMemberById(id) {
  if (!id || typeof id !== 'string') return null;
  await initDb();
  const res = await pool.query('SELECT * FROM members WHERE id = $1', [id.trim()]);
  return mapMemberRow(res.rows[0]);
}

export async function saveMember(member) {
  await initDb();
  const rawId = member.id?.trim() || '';
  const existing = rawId ? await getMemberById(rawId) : null;
  const now = Date.now();
  const id = rawId || `cs66-${Date.now().toString(36)}`;
  const skillsJson = JSON.stringify(Array.isArray(member.skills) ? member.skills : []);
  const socialJson = JSON.stringify(typeof member.social === 'object' && member.social ? member.social : {});

  if (existing) {
    await pool.query(
      `UPDATE members SET
        nickname = $1,
        fullname = $2,
        student_id = $3,
        role = $4,
        category = $5,
        quote = $6,
        skills = $7::jsonb,
        color = $8,
        about = $9,
        social = $10::jsonb,
        image = $11,
        image_fit = $12,
        birthday = $13,
        updated_at = $14
      WHERE id = $15`,
      [
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
        id,
      ]
    );
  } else {
    await pool.query(
      `INSERT INTO members (
        id, nickname, fullname, student_id, role, category, quote,
        skills, color, about, social, image, image_fit, birthday, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11::jsonb, $12, $13, $14, $15, $16)`,
      [
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
        now,
      ]
    );
  }

  return getMemberById(id);
}

export async function deleteMember(id) {
  if (!id || typeof id !== 'string') return false;
  await initDb();
  const res = await pool.query('DELETE FROM members WHERE id = $1', [id.trim()]);
  return (res.rowCount || 0) > 0;
}

export async function resetMembers() {
  await initDb();
  await pool.query('DELETE FROM members');
  const defaults = loadDefaultMembers();
  const now = Date.now();
  for (let i = 0; i < defaults.length; i++) {
    const m = defaults[i];
    await pool.query(
      `INSERT INTO members (
        id, nickname, fullname, student_id, role, category, quote,
        skills, color, about, social, image, image_fit, birthday, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11::jsonb, $12, $13, $14, $15, $16)`,
      [
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
        now,
      ]
    );
  }
  return getAllMembers();
}

// -------------------------------------------------------------
// Memories API
// -------------------------------------------------------------
export async function getAllMemories() {
  await initDb();
  const res = await pool.query('SELECT * FROM memories ORDER BY custom DESC, created_at DESC');
  return res.rows.map(mapMemoryRow);
}

export async function saveMemory(memory) {
  await initDb();
  const id = memory.id?.trim() || `custom-mem-${Date.now()}`;
  const now = Date.now();

  await pool.query(
    `INSERT INTO memories (
      id, image, title, caption, album, album_label, custom, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET
      image = EXCLUDED.image,
      title = EXCLUDED.title,
      caption = EXCLUDED.caption,
      album = EXCLUDED.album,
      album_label = EXCLUDED.album_label,
      custom = EXCLUDED.custom`,
    [
      id,
      memory.image,
      memory.title || 'ความทรงจำ CS66',
      memory.caption || '',
      memory.album || 'first-year',
      memory.albumLabel || '',
      1,
      now,
    ]
  );

  const res = await pool.query('SELECT * FROM memories WHERE id = $1', [id]);
  return mapMemoryRow(res.rows[0]);
}

export async function deleteMemory(id) {
  if (!id || typeof id !== 'string') return false;
  await initDb();
  const res = await pool.query('DELETE FROM memories WHERE id = $1', [id.trim()]);
  return (res.rowCount || 0) > 0;
}

// -------------------------------------------------------------
// Teachers API
// -------------------------------------------------------------
export async function getAllTeachers() {
  await initDb();
  const res = await pool.query('SELECT * FROM teachers ORDER BY custom ASC, created_at ASC');
  return res.rows.map(mapTeacherRow);
}

export async function saveTeacher(teacher) {
  await initDb();
  const id = teacher.id?.trim() || `teacher-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = Date.now();
  const coursesJson = JSON.stringify(Array.isArray(teacher.courses) ? teacher.courses : []);

  await pool.query(
    `INSERT INTO teachers (
      id, fullname, nickname, academic_title, position, category,
      quote, about, courses, email, office, image, color, custom, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, $13, $14, $15)
    ON CONFLICT (id) DO UPDATE SET
      fullname = EXCLUDED.fullname,
      nickname = EXCLUDED.nickname,
      academic_title = EXCLUDED.academic_title,
      position = EXCLUDED.position,
      category = EXCLUDED.category,
      quote = EXCLUDED.quote,
      about = EXCLUDED.about,
      courses = EXCLUDED.courses,
      email = EXCLUDED.email,
      office = EXCLUDED.office,
      image = EXCLUDED.image,
      color = EXCLUDED.color,
      custom = EXCLUDED.custom`,
    [
      id,
      teacher.fullname,
      teacher.nickname || '',
      teacher.academicTitle || '',
      teacher.position || 'อาจารย์ประจำสาขาวิชา',
      teacher.category || 'Software',
      teacher.quote || '',
      teacher.about || '',
      coursesJson,
      teacher.email || '',
      teacher.office || '',
      teacher.image || '',
      teacher.color || '#6baaff',
      teacher.custom ? 1 : 0,
      now,
    ]
  );

  const res = await pool.query('SELECT * FROM teachers WHERE id = $1', [id]);
  return mapTeacherRow(res.rows[0]);
}

export async function deleteTeacher(id) {
  if (!id || typeof id !== 'string') return false;
  await initDb();
  const res = await pool.query('DELETE FROM teachers WHERE id = $1', [id.trim()]);
  return (res.rowCount || 0) > 0;
}

// -------------------------------------------------------------
// Messages API
// -------------------------------------------------------------
export async function getAllMessages() {
  await initDb();
  const res = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
  return res.rows.map(mapMessageRow);
}

export async function saveMessage(msg) {
  await initDb();
  const id = msg.id?.trim() || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const createdAt = msg.createdAt || new Date().toISOString();

  await pool.query(
    `INSERT INTO messages (
      id, sender_name, receiver_id, receiver_name, content, tag, likes, color, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (id) DO UPDATE SET
      sender_name = EXCLUDED.sender_name,
      receiver_id = EXCLUDED.receiver_id,
      receiver_name = EXCLUDED.receiver_name,
      content = EXCLUDED.content,
      tag = EXCLUDED.tag,
      likes = EXCLUDED.likes,
      color = EXCLUDED.color`,
    [
      id,
      msg.senderName,
      msg.receiverId || 'all',
      msg.receiverName || 'ทุกคนใน CS66',
      msg.content,
      msg.tag || '',
      Number(msg.likes) || 0,
      msg.color || '#6baaff',
      createdAt,
    ]
  );

  const res = await pool.query('SELECT * FROM messages WHERE id = $1', [id]);
  return mapMessageRow(res.rows[0]);
}

export async function toggleLikeMessage(id) {
  if (!id) return null;
  await initDb();
  await pool.query('UPDATE messages SET likes = likes + 1 WHERE id = $1', [id.trim()]);
  const res = await pool.query('SELECT * FROM messages WHERE id = $1', [id.trim()]);
  return mapMessageRow(res.rows[0]);
}

export async function deleteMessage(id) {
  if (!id || typeof id !== 'string') return false;
  await initDb();
  const res = await pool.query('DELETE FROM messages WHERE id = $1', [id.trim()]);
  return (res.rowCount || 0) > 0;
}
