import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Loader2, Sun, Moon, ArrowLeft, Phone, Lock, KeyRound } from 'lucide-react';
import { loginWithMPIN, sendFirebaseOTP, verifyFirebaseOTP, resetDjangoMPIN } from '@/services/auth/auth.service';

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode & Steps
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1); // 1: Phone -> 2: OTP -> 3: Reset MPIN

  // Form State
  const [phone, setPhone] = useState(() => localStorage.getItem('savedPhoneNumber') || '');
  const [mpin, setMpin] = useState(''); // Used for both login and setting new MPIN
  const [confirmMpin, setConfirmMpin] = useState('');
  const [otp, setOtp] = useState('');

  // Auth Objects
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [forgotFirebaseToken, setForgotFirebaseToken] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as { from?: Location })?.from?.pathname ?? null;

  const navigateToDestination = () => {
    const dest = from ?? '/dashboard';
    navigate(dest, { replace: true });
  };

  // ─── LOGIN FLOW ──────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10 || mpin.length !== 4) {
      setError('Please enter a valid 10-digit number and 4-digit MPIN.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await loginWithMPIN(phone, mpin);
      await login(data.access, data.refresh);
      localStorage.setItem('savedPhoneNumber', phone);
      navigateToDestination();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  // ─── FORGOT MPIN FLOW ────────────────────────────────────────────────────
  const handleForgotStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await sendFirebaseOTP(phone, 'recaptcha-container');
      setConfirmationResult(result);
      setForgotStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const fbToken = await verifyFirebaseOTP(confirmationResult, otp);
      setForgotFirebaseToken(fbToken);
      setForgotStep(3);
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotStep3 = async (e: React.FormEvent) => {
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
      const data = await resetDjangoMPIN(forgotFirebaseToken, mpin);
      await login(data.access, data.refresh);
      navigateToDestination();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to reset MPIN.');
    } finally {
      setLoading(false);
    }
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8F9FB] dark:bg-gray-950 font-sans transition-colors duration-300">

      {/* Invisible Recaptcha */}
      <div id="recaptcha-container"></div>

      {/* Theme Toggle (Absolute) */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-md shadow-sm border border-gray-100 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-800 transition-colors z-50 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Left Split: Branding / Graphic */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-600 via-teal-500 to-teal-400 p-12 flex-col justify-between relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[30rem] h-[30rem] rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[24rem] h-[24rem] rounded-full bg-blue-900/20 blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-1 mb-6">
            <span className="text-3xl font-bold tracking-tight text-white">Jains</span>
            <span className="text-3xl font-bold tracking-tight text-white/80">Prakriti</span>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4 text-white">
            Welcome to your <br /> Modern Community.
          </h2>
          <p className="text-white/80 text-lg max-w-md">
            Manage bills, log complaints, book amenities, and stay connected with your apartment management instantly.
          </p>
        </div>
        <div className="relative z-10">
          <p className="text-sm text-white/70">&copy; {new Date().getFullYear()} Jains Prakriti Welfare Association</p>
        </div>
      </div>

      {/* Right Split: Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <div className="md:hidden flex items-center gap-1 mb-10 mt-8">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">Jains</span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">Prakriti</span>
        </div>

        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-gray-50 dark:border-gray-800 transition-colors duration-300">

          {mode === 'forgot' && (
            <button
              onClick={() => {
                if (forgotStep > 1) setForgotStep(forgotStep - 1 as 1 | 2);
                else setMode('login');
              }}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {mode === 'login' && "Sign In securely"}
              {mode === 'forgot' && forgotStep === 1 && "Reset MPIN"}
              {mode === 'forgot' && forgotStep === 2 && "Verify Phone Number"}
              {mode === 'forgot' && forgotStep === 3 && "Set New MPIN"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {mode === 'login' && "Enter your mobile number and 4-digit MPIN to continue."}
              {mode === 'forgot' && forgotStep === 1 && "Enter your registered number to reset your MPIN."}
              {mode === 'forgot' && forgotStep === 2 && `We've sent a 6-digit code to +91 ${phone}`}
              {mode === 'forgot' && forgotStep === 3 && "Create a new 4-digit pin for fast logins."}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* MODE: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
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
                <label className="text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase">4-Digit MPIN</label>
                <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:focus-within:ring-blue-500/20 transition-all relative bg-white dark:bg-gray-800">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input type="password" maxLength={4} required value={mpin} onChange={(e) => setMpin(e.target.value.replace(/\D/g, ''))} placeholder="••••" className="w-full bg-transparent pl-10 pr-4 py-3 text-xl tracking-[0.2em] font-mono font-medium text-gray-900 dark:text-white outline-none placeholder-gray-300 dark:placeholder-gray-600" />
                </div>
                <div className="flex justify-end mt-1">
                  <button type="button" onClick={() => { setMode('forgot'); setForgotStep(1); setError(''); }} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
                    Forgot MPIN?
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Signing In...' : 'Sign In'}
              </button>

              <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                New resident? <Link to="/signup" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Register here</Link>
              </div>
            </form>
          )}

          {/* MODE: FORGOT MPIN */}
          {mode === 'forgot' && (
            <>
              {/* Step 1: Phone */}
              {forgotStep === 1 && (
                <form onSubmit={handleForgotStep1} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase">Registered Mobile Number</label>
                    <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:focus-within:ring-blue-500/20 transition-all bg-white dark:bg-gray-800">
                      <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-r border-gray-200 dark:border-gray-700 flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium">
                        <Phone className="w-4 h-4" /> +91
                      </div>
                      <input type="tel" maxLength={10} required value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="10-digit number" className="flex-1 bg-transparent px-4 py-3 text-gray-900 dark:text-white font-medium outline-none placeholder-gray-300 dark:placeholder-gray-600" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? 'Sending Code...' : 'Send OTP'}
                  </button>
                </form>
              )}

              {/* Step 2: OTP */}
              {forgotStep === 2 && (
                <form onSubmit={handleForgotStep2} className="space-y-6">
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

              {/* Step 3: Set New MPIN */}
              {forgotStep === 3 && (
                <form onSubmit={handleForgotStep3} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase">New 4-Digit MPIN</label>
                    <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:focus-within:ring-blue-500/20 transition-all relative bg-white dark:bg-gray-800">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input type="password" maxLength={4} required value={mpin} onChange={(e) => setMpin(e.target.value.replace(/\D/g, ''))} placeholder="••••" className="w-full bg-transparent pl-10 pr-4 py-3.5 text-center tracking-[0.5em] font-mono text-xl text-gray-900 dark:text-white outline-none placeholder-gray-200 dark:placeholder-gray-600" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase">Confirm New MPIN</label>
                    <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:focus-within:ring-blue-500/20 transition-all relative bg-white dark:bg-gray-800">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input type="password" maxLength={4} required value={confirmMpin} onChange={(e) => setConfirmMpin(e.target.value.replace(/\D/g, ''))} placeholder="••••" className="w-full bg-transparent pl-10 pr-4 py-3.5 text-center tracking-[0.5em] font-mono text-xl text-gray-900 dark:text-white outline-none placeholder-gray-200 dark:placeholder-gray-600" />
                    </div>
                  </div>

                  <button type="submit" disabled={loading || mpin.length < 4 || confirmMpin.length < 4} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? 'Resetting...' : 'Reset & Sign In'}
                  </button>
                </form>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
