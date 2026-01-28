'use client';

import Image from 'next/image';
import { APP_NAME } from '@/lib/constants';
import { Toaster } from '@/components/ui/sonner';
import { HeroBackground } from '@/components/landing/hero-background';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex w-full overflow-hidden bg-slate-950 text-slate-50">
      <HeroBackground />
      
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-xl ring-1 ring-white/20">
            <Image 
              src="/logo.webp" 
              alt="FinTra Logo" 
              fill
              className="object-cover"
            />
          </div>
          <span className="text-2xl font-bold tracking-tight">{APP_NAME}</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-5xl font-bold leading-tight drop-shadow-lg">
            Kelola Keuangan
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]">
              Tanpa Batas
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-md leading-relaxed drop-shadow-md">
            Platform pintar untuk tracking aset, budgeting, dan investasi Anda.
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="glass p-5 rounded-2xl border-l-4 border-l-green-400">
              <div className="text-3xl font-bold text-white mb-1">100%</div>
              <div className="text-sm text-slate-300">Gratis Selamanya</div>
            </div>
            <div className="glass p-5 rounded-2xl border-l-4 border-l-blue-400">
              <div className="text-3xl font-bold text-white mb-1">AI</div>
              <div className="text-sm text-slate-300">Smart Advisor</div>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-slate-400">
          &copy; {new Date().getFullYear()} {APP_NAME}. Protected by Bank-Grade Security.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl lg:rounded-l-[3rem] lg:border-l border-white/10" />
        <div className="relative w-full max-w-md">
          {children}
        </div>
      </div>
      
      <Toaster />
    </div>
  );
}

