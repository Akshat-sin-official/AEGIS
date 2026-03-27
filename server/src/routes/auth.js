import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { generateTotpSecret, otpauthUri, verifyTotp } from '../totp.js';
import { writeAuthLog } from '../authLog.js';
import { isTrustedContext, recordTrustedContext } from '../trust.js';
import { createSession, getSession, deleteSession } from '../session.js';

const router = express.Router();

const BCRYPT_ROUNDS = 10;
const JWT_TEMP_SECRET = process.env.JWT_TEMP_SECRET || 'dev-only-change-me-temp-secret-32chars';
const TEMP_JWT_MINS = 10;

function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || '0.0.0.0';
}

function passwordOk(pw) {
  if (!pw || pw.length < 8) return false;
  if (!/[a-z]/.test(pw)) return false;
  if (!/[A-Z]/.test(pw)) return false;
  if (!/\d/.test(pw)) return false;
  return true;
}

async function isIpBlocked(ip) {
  const rows = await query(
    `SELECT id FROM ip_blocks WHERE ip_address = ? AND blocked_until > NOW() LIMIT 1`,
    [ip]
  );
  return rows?.length > 0;
}

async function blockIp(ip, reason) {
  const until = new Date(Date.now() + 60 * 60 * 1000);
  await query(
    `INSERT INTO ip_blocks (ip_address, blocked_until, reason)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE blocked_until = VALUES(blocked_until), reason = VALUES(reason)`,
    [ip, until, reason]
  );
}

async function recentFailureCountForIp(ip) {
  const rows = await query(
    `SELECT COUNT(*) AS c FROM authentication_logs
     WHERE ip_address = ? AND event_type IN ('login_fail', 'totp_fail')
     AND created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)`,
    [ip]
  );
  return Number(rows?.[0]?.c || 0);
}

router.post('/register', async (req, res) => {
  const ip = clientIp(req);
  const deviceFingerprint = String(req.body?.deviceFingerprint || 'unknown');
  const email = String(req.body?.email || '')
    .trim()
    .toLowerCase();
  const password = String(req.body?.password || '');

  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (!passwordOk(password)) {
    return res.status(400).json({
      error: 'Password must be 8+ chars with upper, lower, and digit'
    });
  }

  try {
    const existing = await query(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
    if (existing?.length) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
    const totp_secret = generateTotpSecret();

    const result = await query(
      `INSERT INTO users (email, password_hash, totp_enabled, totp_secret)
       VALUES (?, ?, 1, ?)`,
      [email, password_hash, totp_secret]
    );

    const userId = Number(result.insertId);
    await writeAuthLog({
      userId,
      emailAttempt: email,
      ip,
      deviceFingerprint,
      eventType: 'register',
      detail: 'Account created with TOTP'
    });

    const otpauth = otpauthUri({ email, secret: totp_secret });

    return res.status(201).json({
      userId,
      email,
      totpSetup: {
        secret: totp_secret,
        otpauthUrl: otpauth
      },
      message: 'Scan the QR with an authenticator app, then sign in. New locations will require TOTP until trusted.'
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const ip = clientIp(req);
  const deviceFingerprint = String(req.body?.deviceFingerprint || 'unknown');
  const email = String(req.body?.email || '')
    .trim()
    .toLowerCase();
  const password = String(req.body?.password || '');

  if (await isIpBlocked(ip)) {
    await writeAuthLog({
      emailAttempt: email,
      ip,
      deviceFingerprint,
      eventType: 'ip_blocked',
      detail: 'Login attempt while IP blocked'
    });
    return res.status(403).json({ error: 'This network is temporarily blocked. Try again later.' });
  }

  const rows = await query(
    `SELECT id, email, password_hash, failed_attempt_count, locked_until, totp_enabled, totp_secret
     FROM users WHERE email = ? LIMIT 1`,
    [email]
  );

  const user = rows?.[0];
  if (!user) {
    await writeAuthLog({
      emailAttempt: email,
      ip,
      deviceFingerprint,
      eventType: 'login_fail',
      detail: 'Unknown email'
    });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    await writeAuthLog({
      userId: user.id,
      emailAttempt: email,
      ip,
      deviceFingerprint,
      eventType: 'lockout',
      detail: 'Account locked'
    });
    return res.status(423).json({ error: 'Account temporarily locked. Try again later.' });
  }

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) {
    const fails = (user.failed_attempt_count || 0) + 1;
    let lockedUntil = null;
    if (fails >= 3) {
      lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
      await query(`UPDATE users SET failed_attempt_count = ?, locked_until = ? WHERE id = ?`, [
        fails,
        lockedUntil,
        user.id
      ]);
      await writeAuthLog({
        userId: user.id,
        emailAttempt: email,
        ip,
        deviceFingerprint,
        eventType: 'login_fail',
        detail: 'Bad password'
      });
      await writeAuthLog({
        userId: user.id,
        emailAttempt: email,
        ip,
        deviceFingerprint,
        eventType: 'account_locked',
        detail: 'Too many failures — 10 min lock'
      });
    } else {
      await query(`UPDATE users SET failed_attempt_count = ? WHERE id = ?`, [fails, user.id]);
      await writeAuthLog({
        userId: user.id,
        emailAttempt: email,
        ip,
        deviceFingerprint,
        eventType: 'login_fail',
        detail: 'Bad password'
      });
    }

    const ipFails = await recentFailureCountForIp(ip);
    if (ipFails >= 5) {
      await blockIp(ip, 'Too many failed attempts from this IP');
      await writeAuthLog({
        userId: user.id,
        emailAttempt: email,
        ip,
        deviceFingerprint,
        eventType: 'ip_blocked',
        detail: 'IP blocked after repeated failures'
      });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  }

  await query(`UPDATE users SET failed_attempt_count = 0, locked_until = NULL WHERE id = ?`, [user.id]);

  const trusted = await isTrustedContext(user.id, ip, deviceFingerprint);

  if (trusted) {
    const { id: sessionId, expires } = await createSession(user.id, ip, deviceFingerprint);
    await writeAuthLog({
      userId: user.id,
      emailAttempt: email,
      ip,
      deviceFingerprint,
      eventType: 'login_success',
      detail: 'Trusted context — password only'
    });

    res.cookie('aegis_session', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    });

    return res.json({
      status: 'authenticated',
      trust: 'known_context',
      user: { id: user.id, email: user.email },
      sessionExpires: expires
    });
  }

  if (!user.totp_enabled || !user.totp_secret) {
    await recordTrustedContext(user.id, ip, deviceFingerprint, null);
    const { id: sessionId, expires } = await createSession(user.id, ip, deviceFingerprint);
    await writeAuthLog({
      userId: user.id,
      emailAttempt: email,
      ip,
      deviceFingerprint,
      eventType: 'login_success',
      detail: 'TOTP disabled — session created'
    });
    res.cookie('aegis_session', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    });
    return res.json({
      status: 'authenticated',
      trust: 'totp_disabled',
      user: { id: user.id, email: user.email },
      sessionExpires: expires
    });
  }

  const tempToken = jwt.sign(
    {
      typ: 'totp_pending',
      sub: user.id,
      email: user.email,
      ip,
      deviceFingerprint
    },
    JWT_TEMP_SECRET,
    { expiresIn: `${TEMP_JWT_MINS}m` }
  );

  await writeAuthLog({
    userId: user.id,
    emailAttempt: email,
    ip,
    deviceFingerprint,
    eventType: 'totp_required',
    detail: 'New location or device — step-up required'
  });

  return res.json({
    status: 'totp_required',
    tempToken,
    message: 'This IP or device is not trusted yet. Enter your authenticator code.'
  });
});

router.post('/verify-totp', async (req, res) => {
  const ip = clientIp(req);
  const { tempToken, code } = req.body || {};
  const deviceFingerprint = String(req.body?.deviceFingerprint || 'unknown');

  if (!tempToken || !code) {
    return res.status(400).json({ error: 'Missing token or code' });
  }

  let payload;
  try {
    payload = jwt.verify(tempToken, JWT_TEMP_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired step-up token' });
  }

  if (payload.typ !== 'totp_pending' || !payload.sub) {
    return res.status(400).json({ error: 'Wrong token type' });
  }

  if (payload.ip !== ip || payload.deviceFingerprint !== deviceFingerprint) {
    return res.status(401).json({ error: 'Context changed — start login again' });
  }

  const rows = await query(`SELECT id, totp_secret FROM users WHERE id = ? LIMIT 1`, [payload.sub]);
  const user = rows?.[0];
  if (!user?.totp_secret) {
    return res.status(400).json({ error: 'TOTP not configured' });
  }

  const valid = await verifyTotp(user.totp_secret, String(code).replace(/\s/g, ''));
  if (!valid) {
    await writeAuthLog({
      userId: user.id,
      ip,
      deviceFingerprint,
      eventType: 'totp_fail',
      detail: 'Invalid TOTP'
    });
    return res.status(401).json({ error: 'Invalid authenticator code' });
  }

  await recordTrustedContext(user.id, ip, deviceFingerprint, null);
  const { id: sessionId, expires } = await createSession(user.id, ip, deviceFingerprint);

  await writeAuthLog({
    userId: user.id,
    ip,
    deviceFingerprint,
    eventType: 'totp_success',
    detail: 'Context now trusted for this IP + device'
  });
  await writeAuthLog({
    userId: user.id,
    ip,
    deviceFingerprint,
    eventType: 'login_success',
    detail: 'After TOTP step-up'
  });

  res.cookie('aegis_session', sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/'
  });

  return res.json({
    status: 'authenticated',
    trust: 'new_context_trusted',
    user: { id: user.id, email: payload.email },
    sessionExpires: expires
  });
});

router.post('/logout', async (req, res) => {
  const sid = req.cookies?.aegis_session;
  if (sid) {
    const s = await getSession(sid);
    if (s) {
      await writeAuthLog({
        userId: s.user_id,
        ip: clientIp(req),
        deviceFingerprint: String(req.body?.deviceFingerprint || 'unknown'),
        eventType: 'logout',
        detail: 'User initiated'
      });
    }
    await deleteSession(sid);
  }
  res.clearCookie('aegis_session', { path: '/' });
  return res.json({ ok: true });
});

router.get('/me', async (req, res) => {
  const sid = req.cookies?.aegis_session;
  if (!sid) return res.json({ user: null });

  const s = await getSession(sid);
  if (!s) return res.json({ user: null });

  return res.json({
    user: { id: s.user_id, email: s.email },
    sessionExpires: s.expires_at
  });
});

export default router;
