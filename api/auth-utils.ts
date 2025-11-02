import type { VercelRequest } from '@vercel/node';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export function getSecret() {
  if (typeof process === 'undefined' || !process.env) return 'dev-secret-change-me';
  return process.env.AUTH_SECRET || process.env.JWT_SECRET || 'dev-secret-change-me';
}

// Simple HMAC token: base64url(payload).signature
export function issueToken(payload: any) {
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

export function verifyToken(token?: string): any | null {
  if (!token) return null;
  const [b64, sig] = token.split('.') as [string, string];
  if (!b64 || !sig) return null;
  const expect = crypto.createHmac('sha256', getSecret()).update(b64).digest('base64url');
  if (expect !== sig) return null;
  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function hashPassword(pw: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pw, salt);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export function getAuthPlayerId(req: VercelRequest): string | null {
  const auth = req.headers['authorization'];
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length).trim();
    const payload = verifyToken(token);
    if (payload?.pid) return String(payload.pid);
  }
  return null;
}

