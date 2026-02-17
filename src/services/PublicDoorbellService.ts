import { apiClient } from '../api/client';

export interface PublicDoorbellResponse {
    id: number;
    code: string;
    name: string;
    isActive: boolean;
    callType: string;
    createdAt?: string;
}


const transformationData = (data: any) => {
    // Unpack processResponse if it exists (legacy structure)
    const sourceData = data.processResponse || data;

    // Safety check for members array
    if (!sourceData || !sourceData.memberStreamIds || !Array.isArray(sourceData.memberStreamIds)) {
        console.warn("⚠️ Doorbell data missing 'members' array:", sourceData);
        // Fallback: return sourceData itself or empty array if that's what's expected.
        // But the previous code returned an array of {user_id}.
        // If members are missing, we should probably return an empty array to avoid crash.
        return [];
    }

    let members = sourceData.memberStreamIds?.map((member: any) => ({ user_id: member }));
    console.log("✅ Transformed members:", members);
    return members;
}

export const PublicDoorbellService = {
    /**
     * Get public doorbell info by code
     */
    getDoorbellInfo: async (code: string): Promise<any> => {
        try {
            // Reverted to apiClient as user confirmed token is required
            const response = await apiClient.get(`/public/doorbells/${code}`);
            const data = response.data;
            return transformationData(data);
        } catch (error) {
            console.error('Error fetching public doorbell info:', error);
            throw error;
        }
    }
};
