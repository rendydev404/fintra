'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  PieChart,
  Target,
  CreditCard,
  Sparkles,
  FileBarChart,
  Settings,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Rocket,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  color: string;
  gradient: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    icon: <Rocket className="h-12 w-12" />,
    title: 'Selamat Datang di Finance Tracking! 🎉',
    description: 'Aplikasi pintar untuk mengelola keuangan pribadi Anda dengan mudah dan efisien.',
    features: [
      'Lacak semua pemasukan & pengeluaran',
      'Atur anggaran bulanan dengan mudah',
      'Capai target tabungan Anda',
      'Dapatkan insight AI tentang keuangan',
    ],
    color: 'text-blue-500',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    id: 2,
    icon: <LayoutDashboard className="h-12 w-12" />,
    title: 'Dashboard',
    description: 'Pantau ringkasan keuangan Anda dalam satu tampilan.',
    features: [
      'Lihat total saldo dari semua akun',
      'Grafik pemasukan vs pengeluaran',
      'Status anggaran dan target',
      'Transaksi terbaru',
    ],
    color: 'text-violet-500',
    gradient: 'from-violet-500/20 to-purple-500/20',
  },
  {
    id: 3,
    icon: <Wallet className="h-12 w-12" />,
    title: 'Akun',
    description: 'Kelola berbagai akun keuangan Anda.',
    features: [
      'Tambah akun bank, e-wallet, atau cash',
      'Lihat saldo masing-masing akun',
      'Transfer antar akun dengan mudah',
      'Warna & ikon kustom untuk setiap akun',
    ],
    color: 'text-emerald-500',
    gradient: 'from-emerald-500/20 to-green-500/20',
  },
  {
    id: 4,
    icon: <ArrowLeftRight className="h-12 w-12" />,
    title: 'Transaksi',
    description: 'Catat setiap pemasukan dan pengeluaran.',
    features: [
      'Kategorisasi otomatis',
      'Filter berdasarkan tanggal & kategori',
      'Pencarian transaksi cepat',
      'Ekspor data transaksi',
    ],
    color: 'text-orange-500',
    gradient: 'from-orange-500/20 to-amber-500/20',
  },
  {
    id: 5,
    icon: <PieChart className="h-12 w-12" />,
    title: 'Anggaran',
    description: 'Atur batas pengeluaran per kategori.',
    features: [
      'Buat anggaran bulanan',
      'Notifikasi saat mendekati limit',
      'Lihat persentase penggunaan',
      'Analisis kategori pengeluaran',
    ],
    color: 'text-pink-500',
    gradient: 'from-pink-500/20 to-rose-500/20',
  },
  {
    id: 6,
    icon: <Target className="h-12 w-12" />,
    title: 'Target Tabungan',
    description: 'Tetapkan dan capai tujuan finansial Anda.',
    features: [
      'Buat target dengan deadline',
      'Tambah kontribusi bertahap',
      'Lihat progress secara visual',
      'Notifikasi milestone tercapai',
    ],
    color: 'text-cyan-500',
    gradient: 'from-cyan-500/20 to-teal-500/20',
  },
  {
    id: 7,
    icon: <CreditCard className="h-12 w-12" />,
    title: 'Langganan',
    description: 'Pantau semua tagihan berlangganan.',
    features: [
      'Catat langganan bulanan/tahunan',
      'Reminder sebelum jatuh tempo',
      'Lihat total pengeluaran langganan',
      'Kelola renewal otomatis',
    ],
    color: 'text-indigo-500',
    gradient: 'from-indigo-500/20 to-blue-500/20',
  },
  {
    id: 8,
    icon: <Sparkles className="h-12 w-12" />,
    title: 'AI Insights',
    description: 'Dapatkan analisis cerdas tentang keuangan Anda.',
    features: [
      'Saran penghematan personalisasi',
      'Prediksi pengeluaran',
      'Skor kesehatan finansial',
      'Rekomendasi investasi dasar',
    ],
    color: 'text-amber-500',
    gradient: 'from-amber-500/20 to-yellow-500/20',
  },
  {
    id: 9,
    icon: <FileBarChart className="h-12 w-12" />,
    title: 'Laporan',
    description: 'Analisis mendalam keuangan Anda.',
    features: [
      'Laporan bulanan & tahunan',
      'Grafik tren pengeluaran',
      'Perbandingan antar periode',
      'Export ke PDF/Excel',
    ],
    color: 'text-teal-500',
    gradient: 'from-teal-500/20 to-emerald-500/20',
  },
  {
    id: 10,
    icon: <Settings className="h-12 w-12" />,
    title: 'Pengaturan',
    description: 'Personalisasi pengalaman Anda.',
    features: [
      'Pilih mata uang favorit',
      'Mode gelap/terang',
      'Atur notifikasi',
      'Kelola profil & keamanan',
    ],
    color: 'text-slate-500',
    gradient: 'from-slate-500/20 to-gray-500/20',
  },
];

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingTutorial({ isOpen, onClose, onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  const step = onboardingSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === onboardingSteps.length - 1;

  const handleNext = () => {
    if (isAnimating) return;
    
    if (isLastStep) {
      onComplete();
    } else {
      setSlideDirection('right');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handlePrev = () => {
    if (isAnimating || isFirstStep) return;
    
    setSlideDirection('left');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep((prev) => prev - 1);
      setIsAnimating(false);
    }, 150);
  };

  const handleSkip = () => {
    onComplete();
  };

  const goToStep = (index: number) => {
    if (isAnimating || index === currentStep) return;
    
    setSlideDirection(index > currentStep ? 'right' : 'left');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(index);
      setIsAnimating(false);
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 animate-in zoom-in-95 fade-in duration-300">
        <div className="relative overflow-hidden rounded-2xl bg-background border shadow-2xl">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-20 p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Skip button */}
          {!isLastStep && (
            <button
              onClick={handleSkip}
              className="absolute left-4 top-4 z-20 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Lewati
            </button>
          )}

          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className="pt-14 pb-6 px-6">
            <div
              className={cn(
                'flex flex-col items-center text-center transition-all duration-150',
                isAnimating && slideDirection === 'right' && 'opacity-0 -translate-x-4',
                isAnimating && slideDirection === 'left' && 'opacity-0 translate-x-4',
                !isAnimating && 'opacity-100 translate-x-0'
              )}
            >
              {/* Icon with gradient background */}
              <div className={cn(
                'mb-6 p-6 rounded-2xl bg-gradient-to-br transition-transform duration-300 hover:scale-105',
                step.gradient
              )}>
                <div className={step.color}>
                  {step.icon}
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold mb-2">{step.title}</h2>

              {/* Description */}
              <p className="text-muted-foreground mb-6">{step.description}</p>

              {/* Features list */}
              <ul className="space-y-3 w-full text-left">
                {step.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 animate-in slide-in-from-left duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CheckCircle2 className={cn('h-5 w-5 mt-0.5 flex-shrink-0', step.color)} />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-2 pb-4">
            {onboardingSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => goToStep(index)}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  index === currentStep
                    ? 'w-6 bg-primary'
                    : index < currentStep
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                )}
              />
            ))}
          </div>

          {/* Step counter */}
          <div className="text-center text-sm text-muted-foreground pb-2">
            {currentStep + 1} dari {onboardingSteps.length}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3 p-6 pt-2">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={isFirstStep || isAnimating}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Sebelumnya
            </Button>
            <Button
              onClick={handleNext}
              disabled={isAnimating}
              className="flex-1"
            >
              {isLastStep ? (
                <>
                  Mulai Sekarang
                  <Rocket className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Selanjutnya
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
