import { publicClient } from '../api/client';

export interface PublicDoorbellResponse {
    id: number;
    code: string;
    name: string;
    isActive: boolean;
    callType: string;
    createdAt?: string;
}

export const PublicDoorbellService = {
    /**
     * Get public doorbell info by code
     */
    getDoorbellInfo: async (code: string): Promise<any> => {
        try {
            const response = await publicClient.get(`/public/doorbells/${code}`);
            const data = response.data;
            return data.processResponse || data;
        } catch (error) {
            console.error('Error fetching public doorbell info:', error);
            throw error;
        }
    }
};
