import axiosInstance from '../core/axiosinstance';
import { auth } from '@/config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';

export async function loginWithMPIN(phone: string, mpin: string) {
  const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
  const { data } = await axiosInstance.post('/accounts/auth/login/', { phone_number: formattedPhone, mpin }, { skipAuth: true });
  return data; // { access, refresh }
}

export async function sendFirebaseOTP(phone: string, containerId: string): Promise<ConfirmationResult> {
  const appVerifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
  const formattedPhone = `+91${phone}`;
  return signInWithPhoneNumber(auth, formattedPhone, appVerifier);
}

export async function verifyFirebaseOTP(confirmationResult: ConfirmationResult, code: string): Promise<string> {
  const result = await confirmationResult.confirm(code);
  if (!result.user) throw new Error("Verification failed");
  return await result.user.getIdToken();
}

export async function fetchBlocks() {
  const { data } = await axiosInstance.get('/accounts/blocks/', { skipAuth: true });
  return data;
}

export async function registerWithDjango(firebaseToken: string, profileData: { name: string, flat_id: number }) {
  const { data } = await axiosInstance.post('/accounts/auth/signup/', {
    firebase_token: firebaseToken,
    ...profileData
  }, { skipAuth: true });

  if (data.status === 'setup_mpin') {
    return data.uid;
  }
  throw new Error("Unexpected registration response");
}

export async function setDjangoMPIN(uid: string, mpin: string) {
  const { data } = await axiosInstance.post('/accounts/auth/set-mpin/', { uid, mpin }, { skipAuth: true });
  return data; // { access, refresh }
}

export async function resetDjangoMPIN(firebaseToken: string, newMpin: string) {
  const { data } = await axiosInstance.post('/accounts/auth/forgot-mpin/', {
    firebase_token: firebaseToken,
    new_mpin: newMpin
  }, { skipAuth: true });
  return data; // { access, refresh }
}

export async function fetchMe() {
  const { data } = await axiosInstance.get('/accounts/auth/me/');
  return data;
}
