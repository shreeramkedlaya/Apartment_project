import axiosInstance from './core/axiosinstance';

export const fetchProfileExtension = async (endpoint: string) => {
    const res = await axiosInstance.get(endpoint);
    // StandardizedJSONRenderer might return { data: { status, data: [] } } or just unwrap it
    // Assuming axiosInstance already unwraps to the payload or we return { results: ... }
    return { results: res.data }; 
};

export const createProfileExtension = async (endpoint: string, data: any) => {
    const res = await axiosInstance.post(endpoint, data);
    return res.data;
};

export const updateProfileExtension = async (endpoint: string, id: number | string, data: any) => {
    const res = await axiosInstance.put(`${endpoint}${id}/`, data);
    return res.data;
};

export const deleteProfileExtension = async (endpoint: string, id: number | string) => {
    const res = await axiosInstance.delete(`${endpoint}${id}/`);
    return res.data;
};
