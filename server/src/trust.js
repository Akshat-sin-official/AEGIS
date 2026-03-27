import { query } from './db.js';

export async function isTrustedContext(userId, ip, deviceFingerprint) {
  const rows = await query(
    `SELECT id FROM trusted_login_contexts
     WHERE user_id = ? AND ip_address = ? AND device_fingerprint = ?
     LIMIT 1`,
    [userId, ip, deviceFingerprint]
  );
  return Array.isArray(rows) && rows.length > 0;
}

export async function recordTrustedContext(userId, ip, deviceFingerprint, label = null) {
  await query(
    `INSERT INTO trusted_login_contexts (user_id, ip_address, device_fingerprint, label)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE last_seen_at = CURRENT_TIMESTAMP, label = COALESCE(VALUES(label), label)`,
    [userId, ip, deviceFingerprint, label]
  );
}
