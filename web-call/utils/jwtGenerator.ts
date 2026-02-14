import { SignJWT } from 'jose';

export async function generateJWT(apiKey: string, secret: string, userId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    user_id: userId,
    sub: `user/${userId}`,
    apiKey: apiKey,
    iat: now,
    exp: now + (60 * 60) // 1 hour expiration
  };
  
  const encoder = new TextEncoder();
  const key = encoder.encode(secret);
  
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(payload.iat)
    .setExpirationTime(payload.exp)
    .sign(key);
}