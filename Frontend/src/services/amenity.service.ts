import axiosInstance from "./core/axiosinstance";

export interface Amenity {
    id: number;
    name: string;
    description: string;
    rules: string;
    is_active: boolean;
}

export interface AmenityBooking {
    id: number;
    amenity: number;
    start_time: string;
    end_time: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
    purpose: string;
}

export const fetchAmenities = async () => {
    const response = await axiosInstance.get('/amenities/');
    return response.data;
}

export const fetchAmenityBookings = async () => {
    const response = await axiosInstance.get('/amenities/bookings/');
    return response.data;
}

export const createBooking = async (data: { amenity: number; start_time: string; end_time: string; purpose: string }) => {
    const response = await axiosInstance.post('/amenities/bookings/', data);
    return response.data;
}

export const approveBooking = async (bookingId: number) => {
    const response = await axiosInstance.post(`/amenities/bookings/${bookingId}/approve/`);
    return response.data;
}

export const rejectBooking = async (bookingId: number) => {
    const response = await axiosInstance.post(`/amenities/bookings/${bookingId}/reject/`);
    return response.data;
}

export const cancelBooking = async (bookingId: number) => {
    const response = await axiosInstance.post(`/amenities/bookings/${bookingId}/cancel/`);
    return response.data;
}