import axiosInstance from "./core/axiosinstance";

export interface EmergencyContact {
    id: number;
    name: string;
    category: string;
    category_display?: string;
    phone_number: string;
    is_active: boolean;
    is_emergency_hotline?: boolean;
    display_order?: number;
    alternate_number?: string;
    email?: string;
    description?: string;
}

export const fetchContacts = async (params: any = {}) => {
    const res = await axiosInstance.get('/emergency/contacts/', { params });
    return res.data;
};

export const createContact = async (data: Partial<EmergencyContact>) => {
    const res = await axiosInstance.post('/emergency/contacts/', data);
    return res.data;
};

export const updateContact = async (id: number | string, data: Partial<EmergencyContact>) => {
    const res = await axiosInstance.put(`/emergency/contacts/${id}/`, data);
    return res.data;
};

export const deleteContact = async (id: number | string) => {
    const res = await axiosInstance.delete(`/emergency/contacts/${id}/`);
    return res.data;
};

export interface EmergencyBroadcast {
    id: number;
    title: string;
    message: string;
    severity: string;
    severity_display?: string;
    status: string;
    status_display?: string;
    sent_by?: any;
    broadcast_metadata?: any;
    created_at: string;
    updated_at: string;
    category?: string;
    resolution_note?: string;
}

export const fetchBroadcasts = async () => {
    const res = await axiosInstance.get('/emergency/broadcasts/');
    return res.data;
};

export const createBroadcast = async (data: { title: string; message: string; severity: string; category: string }) => {
    const res = await axiosInstance.post('/emergency/broadcasts/', data);
    return res.data;
};

export const resolveBroadcast = async (id: number | string, data: { resolution_note: string }) => {
    const res = await axiosInstance.post(`/emergency/broadcasts/${id}/resolve/`, data);
    return res.data;
};
