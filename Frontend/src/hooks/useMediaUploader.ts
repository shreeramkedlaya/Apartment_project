import { useState, useCallback } from "react";
import { storageAPI } from "@/services/storage/storage.service";

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface UploadState {
    file: File;
    status: UploadStatus;
    progress: number;
    mediaId?: string;
    proofToken?: string;
    error?: string;
}

export const useMediaUploader = () => {
    const [uploadState, setUploadState] = useState<UploadState | null>(null);

    const uploadFile = useCallback(async (file: File) => {
        setUploadState({ file, status: 'uploading', progress: 0 });
        try {
            // 1. Authorize upload with django
            const authdata = await storageAPI.authorizeUpload(file);

            // 2. upload binary to supabase signed url
            await storageAPI.uploadtoSignedUrl(
                authdata.signed_url,
                file,
                (percent) => {
                    setUploadState(prev => prev ? { ...prev, progress: percent } : null);
                }
            )

            // 3. complete
            setUploadState({
                file,
                status: 'success',
                progress: 100,
                mediaId: authdata.media_id,
                proofToken: authdata.proof_token,
            })

            return authdata

        } catch (error: any) {
            setUploadState({
                file,
                status: 'error',
                progress: 0,
                error: error.response?.data?.detail || error.message || 'Upload failed'
            });
            throw error;
        }
    }, []);
    return { uploadState, uploadFile };
}