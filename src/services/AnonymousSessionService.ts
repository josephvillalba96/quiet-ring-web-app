import { apiClient, publicClient } from '../api/client';
import { generateUUIDv4 } from '../utils/uuid';

export interface DeviceInfo {
    ip?: string;
    mobile?: string;
    mac?: string;
}

export interface BaseRequest {
    idProcess: string;
    deviceInfo?: DeviceInfo;
}

export interface AnonymousSessionResponse {
    sessionId: string;
    token: string;
    type: string;
    expiresIn: number;
    ip?: string;
    mac?: string;
    imgUrl?: string;
    createdAt?: string;
}

/**
 * Standard envelope for backend success responses
 */
export interface GenericResponse<T> {
    status: number;
    timestamp: string;
    idProcess: string;
    processResponse: T;
    // Flattened fallback (some endpoints might return data both ways)
    token?: string;
    sessionId?: string;
    expiresIn?: number;
}

export const AnonymousSessionService = {
    /**
     * Legacy/Complete Creation: Create session with image in one step
     * Endpoint: POST /api/anonymous-sessions
     */
    createLegacySession: async (mac: string, imgUrl: string, sessionId?: string): Promise<AnonymousSessionResponse> => {
        try {
            // Debug: Log what we're sending
            console.log('Creating legacy session with:', { mac, imgUrl, sessionId });

            if (!imgUrl) {
                throw new Error('imgUrl is required but was not provided');
            }

            const payload: any = {
                idProcess: generateUUIDv4(),
                mac,
                imgUrl
            };
            // Only include sessionId if provided
            if (sessionId) {
                payload.sessionId = sessionId;
            }

            console.log('Sending payload to /anonymous-sessions:', payload);
            const response = await apiClient.post<GenericResponse<AnonymousSessionResponse>>('/anonymous-sessions', payload);

            // Extract data from envelope
            const envelope = response.data;
            const data = envelope.processResponse || (envelope as unknown as AnonymousSessionResponse);

            if (!data.token && envelope.token) {
                (data as any).token = envelope.token;
                (data as any).sessionId = envelope.sessionId;
                (data as any).expiresIn = envelope.expiresIn;
            }

            if (data.token) {
                localStorage.setItem('sessionToken', data.token);
                localStorage.setItem('sessionId', data.sessionId);
            }
            return data;
        } catch (error) {
            console.error('Error creating legacy session:', error);
            throw error;
        }
    },

    /**
     * Step 1: Start anonymous session
     * Endpoint: POST /api/anonymous-sessions/iniciar
     * Saves the token to localStorage automatically.
     */
    startSession: async (mac: string): Promise<AnonymousSessionResponse> => {
        try {
            // Use publicClient to avoid sending existing (potentially stale) tokens for new sessions
            const response = await publicClient.post<GenericResponse<AnonymousSessionResponse>>('/anonymous-sessions/iniciar', {
                idProcess: generateUUIDv4(),
                mac
            });

            const envelope = response.data;
            // The actual data might be inside processResponse or at the top level (flattened)
            const data = envelope.processResponse || (envelope as unknown as AnonymousSessionResponse);

            if (!data.token && envelope.token) {
                // Defensive: check top level if not in processResponse
                (data as any).token = envelope.token;
                (data as any).sessionId = envelope.sessionId;
                (data as any).expiresIn = envelope.expiresIn;
            }

            if (data.token) {
                localStorage.setItem('sessionToken', data.token);
                localStorage.setItem('sessionId', data.sessionId);
            }

            return data;
        } catch (error) {
            console.error('Error starting session:', error);
            throw error;
        }
    },

    /**
     * Step 3: Update session photo
     * Endpoint: PUT /api/anonymous-sessions/upload-mediafile/{sessionId}
     * Token is automatically injected by interceptor.
     */
    updateSessionPhoto: async (sessionId: string, imgUrl: string): Promise<void> => {
        try {
            await apiClient.put(`/anonymous-sessions/upload-mediafile/${sessionId}`, {
                idProcess: generateUUIDv4(),
                imgUrl
            });
        } catch (error) {
            console.error('Error updating session photo:', error);
            throw error;
        }
    }
};

