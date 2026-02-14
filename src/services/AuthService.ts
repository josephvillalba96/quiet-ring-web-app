import { generateJWT } from '../utils/jwtGenerator';

const apiKey = import.meta.env.VITE_STREAM_API_KEY;
const secret = import.meta.env.VITE_STREAM_SECRET;

export const AuthService = {
    /**
     * Generate Stream Video Token Locally
     * Following the logic from web-call/src/App.tsx
     */
    getStreamToken: async (userId: string): Promise<string> => {
        try {
            console.log('Generating local Stream token for:', userId);
            return await generateJWT(apiKey, secret, userId);
        } catch (error) {
            console.error('Error generating local stream token:', error);
            throw error;
        }
    }
};
