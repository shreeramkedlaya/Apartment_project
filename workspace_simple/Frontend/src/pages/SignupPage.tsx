import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { fetchBlocks } from '@/services/auth/auth.service';
import type { BlockData } from '@/types/auth.types';
import { Loader2, Sun, Moon, ArrowLeft, Phone, Building, KeyRound, User, Home } from 'lucide-react';
import { sendFirebaseOTP, verifyFirebaseOTP, registerWithDjango, setDjangoMPIN } from '@/services/auth/auth.service';

export default function SignupPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Mode & Steps
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);

  // Blocks Data
  const [blocks, setBlocks] = useState<BlockData[]>([]);

  // Form State
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState<number | ''>('');
  const [selectedFlatId, setSelectedFlatId] = useState<number | ''>('');
  const [otp, setOtp] = useState('');
  const [mpin, setMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');

  // Auth Objects
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [djangoUid, setDjangoUid] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBlocks().then(setBlocks).catch(console.error);
  }, []);

  const handleSignupStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10 || !name.trim() || !selectedFlatId) {
      setError('Please fill in all details.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await sendFirebaseOTP(phone, 'recaptcha-container');
      setConfirmationResult(result);
      setSignupStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    if (!selectedFlatId) return;
    setError('');
    setLoading(true);
    try {
      const fbToken = await verifyFirebaseOTP(confirmationResult, otp);
      const uid = await registerWithDjango(fbToken, { name, flat_id: selectedFlatId as number });
      setDjangoUid(uid);
      setSignupStep(3);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mpin.length !== 4) {
      setError('MPIN must be exactly 4 digits.');
      return;
    }
    if (mpin !== confirmMpin) {
      setError('MPIN and Confirm MPIN do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await setDjangoMPIN(djangoUid, mpin);
      await login(data.access, data.refresh);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to set MPIN.');
    } finally {
      setLoading(false);
    }
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8F9FB] dark:bg-gray-950 font-sans transition-colors duration-300">
      <div id="recaptcha-container"></div>

      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-md shadow-sm border border-gray-100 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-800 transition-colors z-50 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Left Split */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-600 via-teal-500 to-teal-400 p-12 flex-col justify-between relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[30rem] h-[30rem] rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[24rem] h-[24rem] rounded-full bg-blue-900/20 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-1 mb-6">
            <span className="text-3xl font-bold tracking-tight text-white">Jains</span>
            <span className="text-3xl font-bold tracking-tight text-white/80">Prakriti</span>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4 text-white">
            Join your <br /> Modern Community.
          </h2>
          <p className="text-white/80 text-lg max-w-md">
            Register to manage bills, log complaints, and stay connected.
          </p>
        </div>
        <div className="relative z-10">
          <p className="text-sm text-white/70">&copy; {new Date().getFullYear()} Jains Prakriti Welfare Association</p>
        </div>
      </div>

      {/* Right Split */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <div className="md:hidden flex items-center gap-1 mb-10 mt-8">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">Jains</span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">Prakriti</span>
        </div>

        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-gray-50 dark:border-gray-800 transition-colors duration-300">
          
          {signupStep > 1 && (
            <button
              onClick={() => setSignupStep(signupStep - 1 as 1 | 2)}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {signupStep === 1 && "Create your Profile"}
              {signupStep === 2 && "Verify Phone Number"}
              {signupStep === 3 && "Set your secure MPIN"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {signupStep === 1 && "We'll send an OTP to verify your number."}
              {signupStep === 2 && `We've sent a 6-digit code to +91 ${phone}`}
              {signupStep === 3 && "You'll use this 4-digit pin for fast logins."}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Step 1 */}
          {signupStep === 1 && (
            <form onSubmit={handleSignupStep1} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase">Mobile Number</label>
                <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:focus-within:ring-blue-500/20 transition-all bg-white dark:bg-gray-800">
                  <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-r border-gray-200 dark:border-gray-700 flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium">
                    <Phone className="w-4 h-4" /> +91
                  </div>
                  <input type="tel" maxLength={10} required value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="10-digit number" className="flex-1 bg-transparent px-4 py-3 text-gray-900 dark:text-white font-medium outline-none placeholder-gray-300 dark:placeholder-gray-600" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase">Full Name</label>
                <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:focus-within:ring-blue-500/20 transition-all relative bg-white dark:bg-gray-800">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><User className="w-4 h-4" /></div>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="E.g. Arjun Sharma" className="w-full bg-transparent pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white outline-none placeholder-gray-300 dark:placeholder-gray-600" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase">Block</label>
                  <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:focus-within:ring-blue-500/20 transition-all relative bg-white dark:bg-gray-800">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Building className="w-4 h-4" /></div>
                    <select required value={selectedBlockId} onChange={(e) => { setSelectedBlockId(Number(e.target.value)); setSelectedFlatId(''); }} className="w-full bg-transparent pl-9 pr-2 py-3 text-sm text-gray-900 dark:text-white outline-none appearance-none">
                      <option value="" disabled>Select Block</option>
                      {blocks.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase">Flat</label>
                  <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:focus-within:ring-blue-500/20 transition-all relative bg-white dark:bg-gray-800">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Home className="w-4 h-4" /></div>
                    <select required disabled={!selectedBlockId} value={selectedFlatId} onChange={(e) => setSelectedFlatId(Number(e.target.value))} className="w-full bg-transparent pl-9 pr-2 py-3 text-sm text-gray-900 dark:text-white outline-none appearance-none disabled:opacity-50">
                      <option value="" disabled>Select Flat</option>
                      {selectedBlock?.flats.map(f => (
                        <option key={f.id} value={f.id}>{f.number}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Sending Code...' : 'Send OTP'}
              </button>

              <div className="mt-6 text-center text-sm text-gray-500">
                Already registered? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign In here</Link>
              </div>
            </form>
          )}

          {/* Step 2 */}
          {signupStep === 2 && (
            <form onSubmit={handleSignupStep2} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase">6-Digit Code</label>
                <input type="text" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="123456" className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-center tracking-[0.5em] font-mono text-xl text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 transition-all placeholder-gray-200 dark:placeholder-gray-600" />
              </div>
              <button type="submit" disabled={loading || otp.length < 6} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>
          )}

          {/* Step 3 */}
          {signupStep === 3 && (
            <form onSubmit={handleSignupStep3} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase">Create 4-Digit MPIN</label>
                <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:focus-within:ring-blue-500/20 transition-all relative bg-white dark:bg-gray-800">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input type="password" maxLength={4} required value={mpin} onChange={(e) => setMpin(e.target.value.replace(/\D/g, ''))} placeholder="••••" className="w-full bg-transparent pl-10 pr-4 py-3.5 text-center tracking-[0.5em] font-mono text-xl text-gray-900 dark:text-white outline-none placeholder-gray-200 dark:placeholder-gray-600" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase">Confirm 4-Digit MPIN</label>
                <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:focus-within:ring-blue-500/20 transition-all relative bg-white dark:bg-gray-800">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input type="password" maxLength={4} required value={confirmMpin} onChange={(e) => setConfirmMpin(e.target.value.replace(/\D/g, ''))} placeholder="••••" className="w-full bg-transparent pl-10 pr-4 py-3.5 text-center tracking-[0.5em] font-mono text-xl text-gray-900 dark:text-white outline-none placeholder-gray-200 dark:placeholder-gray-600" />
                </div>
              </div>

              <button type="submit" disabled={loading || mpin.length < 4 || confirmMpin.length < 4} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Securing Profile...' : 'Finish & Login'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
