'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, User, Loader2, Eye, EyeOff, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

// Schemas
const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login Form
  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // Register Form
  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const password = registerForm.watch('password', '');

  const passwordRequirements = [
    { label: 'Minimal 6 karakter', met: password.length >= 6 },
    { label: 'Mengandung huruf', met: /[a-zA-Z]/.test(password) },
    { label: 'Mengandung angka', met: /[0-9]/.test(password) },
  ];

  const handleLogin = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message === 'Invalid login credentials' 
          ? 'Email atau password salah' 
          : error.message);
        return;
      }

      toast.success('Login berhasil!');
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Pendaftaran berhasil! Silakan cek email untuk verifikasi.');
      setIsLogin(true);
    } catch (error) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchForm = () => {
    setIsLogin(!isLogin);
    setShowPassword(false);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Mobile Logo */}
      <div className="flex items-center justify-center gap-2 lg:hidden mb-6">
        <Image 
          src="/logo.webp" 
          alt="FinTra Logo" 
          width={40} 
          height={40} 
          className="rounded-lg ring-1 ring-white/20"
        />
        <span className="text-xl font-bold text-white tracking-tight">{APP_NAME}</span>
      </div>

      {/* Animated Form Container */}
      <div className="relative overflow-hidden">
        <div 
          className={cn(
            "flex transition-transform duration-500 ease-out",
            isLogin ? "translate-x-0" : "-translate-x-1/2"
          )}
          style={{ width: '200%' }}
        >
          {/* Login Form */}
          <div className="w-1/2 px-1">
            <Card className="border border-white/10 bg-slate-900/50 backdrop-blur-md shadow-2xl">
              <CardHeader className="space-y-1 text-center pb-6">
                <CardTitle className="text-3xl font-bold text-white tracking-tight">Selamat Datang</CardTitle>
                <CardDescription className="text-slate-400 text-base">
                  Masuk ke akun Anda untuk melanjutkan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Google Login */}
                <Button
                  variant="outline"
                  className="w-full h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Masuk dengan Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full bg-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-900/50 px-3 text-slate-500 font-medium tracking-wider">
                      atau
                    </span>
                  </div>
                </div>

                {/* Login Form Fields */}
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-slate-300">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="nama@email.com"
                        className="pl-10 h-12 bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 focus-visible:border-blue-500/50 transition-all rounded-xl"
                        {...loginForm.register('email')}
                        disabled={isLoading}
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-red-400 font-medium">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-slate-300">Password</Label>
                      <Link href="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                        Lupa password?
                      </Link>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-12 bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 focus-visible:border-blue-500/50 transition-all rounded-xl"
                        {...loginForm.register('password')}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-400 font-medium">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-[0_4px_20px_rgba(59,130,246,0.5)] hover:shadow-[0_4px_25px_rgba(59,130,246,0.6)] transition-all duration-300" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      'Masuk Sekarang'
                    )}
                  </Button>
                </form>

                <div className="text-center pt-2">
                  <button
                    onClick={switchForm}
                    className="text-sm text-slate-400 hover:text-white transition-colors group inline-flex items-center gap-2"
                  >
                    Belum punya akun?{' '}
                    <span className="text-blue-400 font-medium group-hover:text-blue-300 inline-flex items-center gap-1">
                      Daftar Gratis <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Register Form */}
          <div className="w-1/2 px-1">
            <Card className="border border-white/10 bg-slate-900/50 backdrop-blur-md shadow-2xl">
              <CardHeader className="space-y-1 text-center pb-6">
                <CardTitle className="text-3xl font-bold text-white tracking-tight">Buat Akun Baru</CardTitle>
                <CardDescription className="text-slate-400 text-base">
                  Mulai kelola keuangan Anda dengan lebih baik
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Google Login */}
                <Button
                  variant="outline"
                  className="w-full h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Daftar dengan Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full bg-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-900/50 px-3 text-slate-500 font-medium tracking-wider">
                      atau
                    </span>
                  </div>
                </div>

                {/* Register Form Fields */}
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="register-name" className="text-slate-300 text-sm">Nama Lengkap</Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="John Doe"
                        className="pl-10 h-11 bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 focus-visible:border-blue-500/50 transition-all rounded-xl"
                        {...registerForm.register('fullName')}
                        disabled={isLoading}
                      />
                    </div>
                    {registerForm.formState.errors.fullName && (
                      <p className="text-xs text-red-400">{registerForm.formState.errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="register-email" className="text-slate-300 text-sm">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="nama@email.com"
                        className="pl-10 h-11 bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 focus-visible:border-blue-500/50 transition-all rounded-xl"
                        {...registerForm.register('email')}
                        disabled={isLoading}
                      />
                    </div>
                    {registerForm.formState.errors.email && (
                      <p className="text-xs text-red-400">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="register-password" className="text-slate-300 text-sm">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                      <Input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-11 bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 focus-visible:border-blue-500/50 transition-all rounded-xl"
                        {...registerForm.register('password')}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {password && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
                        {passwordRequirements.map((req, i) => (
                          <div
                            key={i}
                            className={`flex items-center gap-1 text-xs transition-colors ${
                              req.met ? 'text-green-400' : 'text-slate-500'
                            }`}
                          >
                            <Check className={`h-3 w-3 ${req.met ? 'opacity-100' : 'opacity-30'}`} />
                            {req.label}
                          </div>
                        ))}
                      </div>
                    )}
                    {registerForm.formState.errors.password && (
                      <p className="text-xs text-red-400">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="register-confirm" className="text-slate-300 text-sm">Konfirmasi Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                      <Input
                        id="register-confirm"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10 h-11 bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 focus-visible:border-blue-500/50 transition-all rounded-xl"
                        {...registerForm.register('confirmPassword')}
                        disabled={isLoading}
                      />
                    </div>
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-red-400">{registerForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-[0_4px_20px_rgba(59,130,246,0.5)] hover:shadow-[0_4px_25px_rgba(59,130,246,0.6)] transition-all duration-300 mt-2" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      'Buat Akun'
                    )}
                  </Button>
                </form>

                <div className="text-center pt-2">
                  <button
                    onClick={switchForm}
                    className="text-sm text-slate-400 hover:text-white transition-colors group inline-flex items-center gap-2"
                  >
                    <span className="text-blue-400 font-medium group-hover:text-blue-300 inline-flex items-center gap-1">
                      <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" /> Masuk
                    </span>
                    {' '}jika sudah punya akun
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
