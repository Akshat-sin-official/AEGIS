# Project A.E.G.I.S — Prominent viva Q&A

Short answers you can use in a viva or demo. Numbers and behavior match this repo where noted.

---

## Why bcrypt for passwords?

**Answer:** Passwords must never be stored in a form that lets an attacker recover the original secret if the database leaks. **bcrypt** is a **one-way password hashing** function: it mixes the password with a **random salt** and runs an intentionally **slow** inner loop so each guess is expensive. That makes offline brute-force and rainbow-table attacks impractical compared to fast hashes like SHA-256. This project stores only `password_hash` in MySQL and verifies with `bcrypt.compare` on login (`server/src/routes/auth.js`).

---

## What does “10 rounds” mean?

**Answer:** In bcrypt, the **cost factor** (here **10**, set as `BCRYPT_ROUNDS` in `server/src/routes/auth.js`) controls how many **iterations** of the underlying Blowfish-based work happen when deriving the hash. It is exponential: each +1 roughly **doubles** the time to hash. **10** is a common default today: strong enough to slow mass guessing, still acceptable for interactive login on typical hardware. Higher rounds are safer but slower; the right value is a trade-off between security and user-visible latency.

---

## Why not store plain text or a single SHA-256 of the password?

**Answer:** Plain text is unacceptable: anyone with DB access sees every password. **SHA-256** is **fast** and **deterministic** (same input → same output), so attackers can try billions of guesses per second and use **rainbow tables** unless you add salts and many iterations yourself. **bcrypt** already bundles **salt + adaptive cost** for password storage, which is why it is preferred for this use case.

---

## What is “trusted context” in this project?

**Answer:** After a correct email and password, the server checks whether this user has already logged in successfully from the **same IP** and **same device fingerprint**. If a row exists in `trusted_login_contexts`, the user gets a **session without** asking for TOTP again. If not, TOTP is required (when enabled), then that context is stored as trusted—similar in spirit to “recognized device” flows in large services.

---

## Why use a session cookie instead of putting a JWT in localStorage?

**Answer:** **HttpOnly** cookies (as used for `aegis_session` in this design) are not readable by JavaScript, which **reduces impact of XSS** stealing the token. **localStorage** is trivial for scripts to read if there is any XSS. Cookies also fit a classic **server-side session** model: the cookie holds an opaque id; session data and expiry live in the database.

---

## What is the temp JWT for (`totp_required`)?

**Answer:** After password success but **before** TOTP in an **unknown** context, the server returns a **short-lived JWT** (`tempToken`) that proves “password already passed” without issuing a full session. **verify-totp** checks that JWT and that **IP and fingerprint** still match the token, then creates the session and trusts the context—reducing misuse of the token from another machine.

---

## How does TOTP verification work in brief?

**Answer:** The server stores a **shared secret** (base32) on the user. The authenticator app derives a **6-digit code** from that secret and the current time (typically **30-second** steps). The server uses the same secret and accepts codes within a small **time window** (e.g. ±30 seconds) so minor clock skew still works (`otplib` in this stack).

---

## What limits brute-force or abuse on login?

**Answer:** Failed password attempts increment a counter; after repeated failures the account can be **locked** for a period. There is also **IP blocking** after enough failures in a window, and events are written to **`authentication_logs`** for audit (see `docs/HOW_IT_WORKS.md` for exact thresholds).

---

*For architecture and API detail, see `docs/HOW_IT_WORKS.md`.*
