export const extractVideoPoster = (videoFile: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.playsInline = true;
        video.muted = true;

        const url = URL.createObjectURL(videoFile);
        video.src = url;

        video.onloadedmetadata = () => {
            video.currentTime = Math.min(1, video.duration / 2);
        }

        video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d')

            if (!ctx) {
                URL.revokeObjectURL(url);
                return reject(new Error('Canvas Context not available'))
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                URL.revokeObjectURL(url);
                if (blob) {
                    const posterFile = new File([blob], `${videoFile.name}.thumb.webp`, { type: "image/webp" });
                    resolve(posterFile);
                } else {
                    reject(new Error('Failed to generate blob from canvas'))
                }
            }, 'image/webp', 0.8);
        };
        video.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load video metadata'));
        };
    });
};