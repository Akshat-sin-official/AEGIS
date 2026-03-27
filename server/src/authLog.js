import { query } from './db.js';

export async function writeAuthLog({
  userId = null,
  emailAttempt = null,
  ip,
  deviceFingerprint,
  eventType,
  detail = null
}) {
  await query(
    `INSERT INTO authentication_logs
      (user_id, email_attempt, ip_address, device_fingerprint, event_type, detail)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, emailAttempt, ip, deviceFingerprint, eventType, detail]
  );
}
