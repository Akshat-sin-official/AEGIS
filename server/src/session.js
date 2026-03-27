import crypto from 'crypto';
import { query } from './db.js';

const SESSION_HOURS = Number(process.env.SESSION_HOURS || 24);

export function newSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

export async function createSession(userId, ip, deviceFingerprint) {
  const id = newSessionId();
  const expires = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  await query(
    `INSERT INTO sessions (id, user_id, ip_address, device_fingerprint, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, userId, ip, deviceFingerprint, expires]
  );
  return { id, expires };
}

export async function getSession(sessionId) {
  const rows = await query(
    `SELECT s.id, s.user_id, s.expires_at, u.email
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > NOW()
     LIMIT 1`,
    [sessionId]
  );
  if (!rows?.length) return null;
  return rows[0];
}

export async function deleteSession(sessionId) {
  await query(`DELETE FROM sessions WHERE id = ?`, [sessionId]);
}

export async function deleteUserSessions(userId) {
  await query(`DELETE FROM sessions WHERE user_id = ?`, [userId]);
}
