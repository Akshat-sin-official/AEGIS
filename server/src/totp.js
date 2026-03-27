import { TOTP } from '@otplib/totp';
import { NodeCryptoPlugin } from '@otplib/plugin-crypto-node';
import { ScureBase32Plugin } from '@otplib/plugin-base32-scure';

const totp = new TOTP({
  crypto: new NodeCryptoPlugin(),
  base32: new ScureBase32Plugin()
});

export function generateTotpSecret() {
  return totp.generateSecret();
}

export function otpauthUri({ email, secret }) {
  return totp.toURI({
    issuer: 'ProjectAEGIS',
    label: email,
    secret
  });
}

export async function verifyTotp(secret, token) {
  const result = await totp.verify(token, { secret, epochTolerance: 30 });
  return result.valid === true;
}
