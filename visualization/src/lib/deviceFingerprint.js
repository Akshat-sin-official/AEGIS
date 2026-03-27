import { getDeviceId } from './deviceId';

export async function getDeviceFingerprint() {
  const id = getDeviceId();
  const raw = `${navigator.userAgent}|${navigator.language}|${typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : '0x0'}|${id}`;
  const enc = new TextEncoder().encode(raw);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
