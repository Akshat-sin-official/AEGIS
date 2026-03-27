import express from 'express';
import { query } from '../db.js';
import { getSession } from '../session.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const sid = req.cookies?.aegis_session;
  if (!sid) return res.status(401).json({ error: 'Unauthorized' });

  const s = await getSession(sid);
  if (!s) return res.status(401).json({ error: 'Unauthorized' });

  const logs = await query(
    `SELECT id, email_attempt, ip_address, LEFT(device_fingerprint, 16) AS device_fp_prefix,
            event_type, detail, created_at
     FROM authentication_logs
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 200`,
    [s.user_id]
  );

  return res.json({ logs });
});

export default router;
