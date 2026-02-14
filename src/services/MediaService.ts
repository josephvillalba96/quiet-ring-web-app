import { apiClient } from '../api/client';
import { generateUUIDv4 } from '../utils/uuid';

export interface UploadFileResponse {
    url: string;
    fileId: string;
}

interface GenericResponse<T> {
    status: number;
    timestamp: string;
    idProcess: string;
    processResponse: T;
}

export const MediaService = {
    /**
     * Upload photo
     * Token is automatically injected by interceptor.
     */
    uploadMedia: async (file: Blob): Promise<UploadFileResponse> => {
        try {
            const formData = new FormData();
            formData.append('file', file, 'photo.jpg');

            // Backend expects metadata in a 'request' part (Spring @RequestPart)
            // Must be sent as Blob with application/json content type
            const requestData = { idProcess: generateUUIDv4() };
            formData.append('request', new Blob([JSON.stringify(requestData)], { type: 'application/json' }));

            const response = await apiClient.post<GenericResponse<UploadFileResponse>>('/media/upload', formData, {
                headers: {
                    'Content-Type': undefined
                }
            });

            // Extract data from envelope
            const envelope = response.data;
            console.log('Media upload raw response:', envelope);

            // Handle different response structures
            let result: UploadFileResponse;
            const env = envelope as any;
            if (envelope.processResponse) {
                result = envelope.processResponse;
            } else if (env.url || env.fileUrl || env.downloadUrl || env.link) {
                // Response is at top level (flattened)
                result = {
                    url: env.url || env.fileUrl || env.downloadUrl || env.link,
                    fileId: env.fileId || env.id || env.file_id || ''
                };
            } else {
                result = envelope as unknown as UploadFileResponse;
            }

            console.log('Media upload extracted result:', result);
            return result;
        } catch (error) {
            console.error('Error uploading media:', error);
            throw error;
        }
    },

    /**
     * Get file by ID
     * Endpoint: GET /api/media/files/{fileId}
     */
    getFile: async (fileId: string): Promise<Blob> => {
        try {
            const response = await apiClient.get(`/media/files/${fileId}`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching file:', error);
            throw error;
        }
    },

    /**
     * Update existing file
     * Endpoint: PUT /api/media/files/{fileId}
     */
    updateFile: async (fileId: string, file: Blob): Promise<void> => {
        try {
            const formData = new FormData();
            formData.append('file', file, 'photo.jpg');

            // Backend expects metadata in a 'request' part (Spring @RequestPart)
            // Must be sent as Blob with application/json content type
            const requestData = { idProcess: generateUUIDv4() };
            formData.append('request', new Blob([JSON.stringify(requestData)], { type: 'application/json' }));

            await apiClient.put(`/media/files/${fileId}`, formData, {
                headers: {
                    'Content-Type': undefined
                }
            });
        } catch (error) {
            console.error('Error updating file:', error);
            throw error;
        }
    }
};
