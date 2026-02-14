import { SignJWT } from 'jose';

export async function generateJWT(apiKey: string, secret: string, userId: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    // Subtract 60 seconds to prevent "token used before issued at" errors
    // due to clock skew between client and server
    const issuedAt = now - 60;
    const payload = {
        user_id: userId,
        sub: `user/${userId}`,
        apiKey: apiKey,
        iat: issuedAt,
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
