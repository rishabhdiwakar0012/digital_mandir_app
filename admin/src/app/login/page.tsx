'use client';

import { useState, FormEvent, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, ShieldCheck, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { sendOtp, verifyOtp, hydrate, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      await sendOtp(email);
      toast.success('OTP sent to your email');
      setStep('otp');
      setCooldown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to send OTP';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: FormEvent) => {
    e?.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) return;
    setIsLoading(true);
    try {
      await verifyOtp(email, otpCode);
      toast.success('Login successful');
      router.push('/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Invalid OTP';
      toast.error(message);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setIsLoading(true);
    try {
      await sendOtp(email);
      toast.success('OTP resent to your email');
      setCooldown(60);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to resend OTP';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (value && !/^\d$/.test(value)) return;
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
      // Auto-submit when all 6 digits entered — use newOtp directly to avoid stale closure
      if (value && index === 5 && newOtp.every((d) => d !== '')) {
        const otpCode = newOtp.join('');
        if (otpCode.length === 6) {
          setIsLoading(true);
          verifyOtp(email, otpCode)
            .then(() => {
              toast.success('Login successful');
              router.push('/dashboard');
            })
            .catch((err: unknown) => {
              const message =
                (err as { response?: { data?: { message?: string } } })?.response
                  ?.data?.message || 'Invalid OTP';
              toast.error(message);
              setOtp(['', '', '', '', '', '']);
              otpRefs.current[0]?.focus();
            })
            .finally(() => setIsLoading(false));
        }
      }
    },
    [otp, email, verifyOtp, router],
  );

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    const nextIndex = Math.min(pastedData.length, 5);
    otpRefs.current[nextIndex]?.focus();
    // Use newOtp directly to avoid the stale closure issue
    if (pastedData.length === 6) {
      const otpCode = newOtp.join('');
      setIsLoading(true);
      verifyOtp(email, otpCode)
        .then(() => {
          toast.success('Login successful');
          router.push('/dashboard');
        })
        .catch((err: unknown) => {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || 'Invalid OTP';
          toast.error(message);
          setOtp(['', '', '', '', '', '']);
          otpRefs.current[0]?.focus();
        })
        .finally(() => setIsLoading(false));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-orange-50 to-amber-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 overflow-hidden items-center justify-center rounded-2xl shadow-lg bg-linear-to-br from-orange-500 to-amber-500">
            <Image
              src="/app-icon.png"
              alt="App Icon"
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Digital Mandir</h1>
          <p className="mt-1 text-sm text-gray-500">Admin Panel</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
          {step === 'email' ? (
            <>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                  <Mail className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Sign in to your account
                  </h2>
                  <p className="text-xs text-gray-500">
                    Enter your admin email to receive an OTP
                  </p>
                </div>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <Input
                  id="email"
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                />
                <Button type="submit" className="w-full" isLoading={isLoading}>
                  <KeyRound className="h-4 w-4" />
                  Send OTP
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <button
                  onClick={() => {
                    setStep('email');
                    setOtp(['', '', '', '', '', '']);
                  }}
                  className="mb-4 flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Enter verification code
                    </h2>
                    <p className="text-xs text-gray-500">
                      We sent a 6-digit code to{' '}
                      <span className="font-medium text-gray-700">{email}</span>
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    OTP Code
                  </label>
                  <div
                    className="flex items-center justify-center gap-2 sm:gap-3"
                    onPaste={handleOtpPaste}
                  >
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="h-12 w-10 sm:h-14 sm:w-12 rounded-xl border-2 border-gray-200 bg-gray-50 text-center text-xl font-bold text-gray-900 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
                        autoComplete={i === 0 ? 'one-time-code' : 'off'}
                      />
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isLoading}
                  disabled={otp.join('').length !== 6}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Verify & Sign In
                </Button>

                <div className="text-center">
                  {cooldown > 0 ? (
                    <p className="text-xs text-gray-400">
                      Resend code in{' '}
                      <span className="font-semibold text-orange-600">
                        {cooldown}s
                      </span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isLoading}
                      className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Digital Mandir. All rights reserved.
        </p>
      </div>
    </div>
  );
}
