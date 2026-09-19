import axiosInstance from "../core/axiosinstance";
import axios from "axios";

export const storageAPI = {
    authorizeUpload: async (file: File, isPublic = false) => {
        const payload = {
            original_filename: file.name,
            mime_type: file.type,
            file_size: file.size,
            is_public: isPublic
        }
        const response = await axiosInstance.post('/storage/authorize-upload/', payload)
        return response.data
    },

    uploadtoSignedUrl: async (url: string, file: File, onProgress?: (percent: number) => void) => {
        await axios.put(url, file, {
            headers: { 'Content-Type': file.type },
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    if (onProgress) onProgress(percent);
                }
            }
        });
    }
};