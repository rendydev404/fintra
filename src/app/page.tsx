import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowRight, CheckCircle, Sparkles, PieChart, Shield, TrendingUp, BarChart3, Lock, Zap } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { HeroBackground } from '@/components/landing/hero-background';

export default function HomePage() {
  const features = [
    {
      icon: Wallet,
      title: 'Multi-Akun Terintegrasi',
      description: 'Kelola semua aset keuangan dari bank, e-wallet, hingga kripto dalam satu dashboard terpusat.',
    },
    {
      icon: PieChart,
      title: 'Smart Budgeting',
      description: 'Algoritma cerdas yang membantu Anda menentukan batas pengeluaran yang realistis.',
    },
    {
      icon: TrendingUp,
      title: 'Real-time Tracking',
      description: 'Pantau arus kas Anda detik demi detik dengan visualisasi grafik yang memukau.',
    },
    {
      icon: Sparkles,
      title: 'AI Financial Advisor',
      description: 'Dapatkan insight mendalam dan rekomendasi aksi dari asisten AI personal Anda.',
    },
    {
      icon: Shield,
      title: 'Bank-Grade Security',
      description: 'Enkripsi tingkat lanjut memastikan data finansial Anda tetap privat dan aman.',
    },
    {
      icon: Zap,
      title: 'Instant Sync',
      description: 'Sinkronisasi awan super cepat agar data Anda selalu mutakhir di semua perangkat.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-blue-500/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg ring-1 ring-white/20">
              <Image 
                src="/logo.webp" 
                alt="FinTra Logo" 
                fill
                className="object-cover"
              />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">{APP_NAME}</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10">Masuk</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-[0_0_20px_rgba(37,99,235,0.3)]">Daftar Gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden pt-20">
        <HeroBackground />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300 mb-8 backdrop-blur-md">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">The Future of Personal Finance</span>
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-8 leading-tight">
              Kelola Keuangan dengan
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]">
                Kecerdasan Masa Depan
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              Platform modern untuk melacak, menganalisis, dan mengoptimalkan kekayaan Anda. 
              Didukung AI canggih untuk keputusan finansial yang lebih baik.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <Link href="/register">
                <Button size="lg" className="h-14 px-8 text-lg bg-white text-slate-900 hover:bg-slate-200 hover:scale-105 transition-all duration-300 font-semibold shadow-[0_0_30px_rgba(255,255,255,0.3)] rounded-full">
                  Mulai Sekarang
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Floating Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { label: 'Gratis', value: '100%', icon: CheckCircle, color: 'text-green-400' },
                { label: 'Transaksi', value: 'Unlimited', icon: BarChart3, color: 'text-blue-400' },
                { label: 'Privacy', value: 'Encrypted', icon: Lock, color: 'text-violet-400' },
                { label: 'AI Powered', value: 'Smart', icon: Sparkles, color: 'text-amber-400' },
              ].map((stat, i) => (
                <div key={i} className="glass border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center hover:bg-white/10 transition-colors group">
                  <stat.icon className={`h-6 w-6 mb-2 ${stat.color} group-hover:scale-110 transition-transform`} />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Fade to content */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
      </section>

      {/* Features Section */}
      <section className="py-32 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 h-96 w-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-96 w-96 bg-violet-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Teknologi Finansial Terdepan
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Suite lengkap alat manajemen keuangan yang didesain untuk era digital.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group relative p-8 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-white/10 hover:bg-slate-900/80 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-violet-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-300 ring-1 ring-blue-500/20">
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4 text-center">
          <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-blue-900/20 to-violet-900/20 border border-white/10 p-12 sm:p-24 backdrop-blur-sm">
            {/* Background sparkle */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.2),transparent_70%)]" />
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl sm:text-5xl font-bold mb-8 text-white">
                Siap Mengambil Kontrol Penuh?
              </h2>
              <p className="text-xl text-slate-300 mb-10 leading-relaxed">
                Bergabunglah dengan ribuan pengguna cerdas lainnya. Gratis selamanya, tanpa komitmen.
              </p>
              <Link href="/register">
                <Button size="lg" className="h-16 px-10 text-xl rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:shadow-[0_0_60px_rgba(37,99,235,0.6)] transition-all duration-300 transform hover:scale-105">
                  Buat Akun Gratis
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
              <p className="mt-8 text-sm text-slate-500">
                Tidak perlu kartu kredit · Setup dalam 30 detik
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-slate-950">
        <div className="container mx-auto px-4 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 mb-8 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
            <Image 
              src="/logo.webp" 
              alt="FinTra Logo" 
              width={24} 
              height={24} 
              className="rounded"
            />
            <span className="font-bold text-lg text-white">{APP_NAME}</span>
          </div>
          <div className="text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
            <div className="flex gap-6 justify-center mt-4">
              <Link href="#" className="hover:text-blue-400 transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-blue-400 transition-colors">Terms</Link>
              <Link href="#" className="hover:text-blue-400 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
