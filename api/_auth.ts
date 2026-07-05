import type { VercelRequest } from '@vercel/node';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export interface AuthPayload {
  pid: string;
  u?: string;
  exp?: number;
}

export function getSecret() {
  const secret = process.env.AUTH_SECRET
    || process.env.AUTHSECRET
    || process.env.authsecret
    || process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET, AUTHSECRET, authsecret, or JWT_SECRET is required');
    }
    return 'dev-secret-change-me';
  }
  return secret;
}

function signPayload(encodedPayload: string) {
  return crypto.createHmac('sha256', getSecret()).update(encodedPayload).digest('base64url');
}

function constantTimeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function issueToken(payload: AuthPayload) {
  const json = JSON.stringify(payload);
  const encodedPayload = Buffer.from(json).toString('base64url');
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyToken(token?: string): AuthPayload | null {
  if (!token) return null;
  const [encodedPayload, signature] = token.split('.') as [string, string];
  if (!encodedPayload || !signature) return null;

  let expectedSignature: string;
  try {
    expectedSignature = signPayload(encodedPayload);
  } catch {
    return null;
  }

  if (!constantTimeEqual(expectedSignature, signature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()) as AuthPayload;
    if (!payload.pid) return null;
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function getAuthPlayerId(req: VercelRequest): string | null {
  const auth = req.headers.authorization;
  if (typeof auth !== 'string' || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length).trim();
  const payload = verifyToken(token);
  return payload?.pid ? String(payload.pid) : null;
}
