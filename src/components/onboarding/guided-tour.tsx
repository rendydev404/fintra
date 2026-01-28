'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  ChevronRight,
  ChevronLeft,
  X,
  Rocket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';

interface TourStep {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  path?: string; // Navigate to this path before showing step
  position: 'top' | 'bottom' | 'left' | 'right';
  spotlightPadding?: number;
  requiresSidebar?: boolean; // If true, sidebar should be open for this step
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    targetSelector: '[data-tour="logo"]',
    title: '👋 Selamat Datang di Finance Tracking!',
    description: 'Mari kita kenali fitur-fitur aplikasi ini bersama. Ikuti tour singkat ini untuk memahami cara menggunakan aplikasi.',
    position: 'bottom',
  },
  {
    id: 'total-balance',
    targetSelector: '[data-tour="total-balance"]',
    title: '💰 Total Saldo',
    description: 'Di sini Anda bisa melihat total saldo dari semua akun yang Anda miliki. Nilai ini akan terupdate otomatis saat ada transaksi.',
    position: 'bottom',
  },
  {
    id: 'dashboard-menu',
    targetSelector: '[data-tour="menu-dashboard"]',
    title: '📊 Dashboard',
    description: 'Dashboard menampilkan ringkasan keuangan Anda: grafik pemasukan/pengeluaran, status anggaran, dan transaksi terbaru.',
    position: 'right',
    path: '/dashboard',
    requiresSidebar: true,
  },
  {
    id: 'accounts-menu',
    targetSelector: '[data-tour="menu-accounts"]',
    title: '💳 Menu Akun',
    description: 'Kelola berbagai akun keuangan Anda di sini: bank, e-wallet, atau cash. Setiap akun memiliki saldo tersendiri.',
    position: 'right',
    path: '/accounts',
    requiresSidebar: true,
  },
  {
    id: 'transactions-menu',
    targetSelector: '[data-tour="menu-transactions"]',
    title: '📝 Menu Transaksi',
    description: 'Catat semua pemasukan dan pengeluaran di sini. Anda bisa filter, search, dan kategorikan setiap transaksi.',
    position: 'right',
    path: '/transactions',
    requiresSidebar: true,
  },
  {
    id: 'budgets-menu',
    targetSelector: '[data-tour="menu-budgets"]',
    title: '📊 Menu Anggaran',
    description: 'Atur batas pengeluaran per kategori. Anda akan mendapat notifikasi saat mendekati atau melebihi limit.',
    position: 'right',
    path: '/budgets',
    requiresSidebar: true,
  },
  {
    id: 'goals-menu',
    targetSelector: '[data-tour="menu-goals"]',
    title: '🎯 Menu Target',
    description: 'Tetapkan target tabungan dengan deadline. Tambah kontribusi bertahap dan lihat progress Anda.',
    position: 'right',
    path: '/goals',
    requiresSidebar: true,
  },
  {
    id: 'subscriptions-menu',
    targetSelector: '[data-tour="menu-subscriptions"]',
    title: '📅 Menu Langganan',
    description: 'Pantau semua tagihan berlangganan bulanan/tahunan. Dapatkan reminder sebelum jatuh tempo.',
    position: 'right',
    path: '/subscriptions',
    requiresSidebar: true,
  },
  {
    id: 'ai-insights-menu',
    targetSelector: '[data-tour="menu-ai-insights"]',
    title: '✨ AI Insights',
    description: 'Dapatkan analisis cerdas tentang keuangan Anda: saran penghematan, prediksi pengeluaran, dan skor kesehatan finansial.',
    position: 'right',
    path: '/ai-insights',
    requiresSidebar: true,
  },
  {
    id: 'reports-menu',
    targetSelector: '[data-tour="menu-reports"]',
    title: '📈 Menu Laporan',
    description: 'Lihat laporan detail keuangan Anda: tren pengeluaran, perbandingan antar periode, dan ekspor data.',
    position: 'right',
    path: '/reports',
    requiresSidebar: true,
  },
  {
    id: 'settings-menu',
    targetSelector: '[data-tour="menu-settings"]',
    title: '⚙️ Pengaturan',
    description: 'Personalisasi pengalaman Anda: pilih mata uang, mode gelap/terang, atur notifikasi, dan kelola profil.',
    position: 'right',
    path: '/settings',
    requiresSidebar: true,
  },
  {
    id: 'notifications',
    targetSelector: '[data-tour="notifications"]',
    title: '🔔 Notifikasi',
    description: 'Notifikasi akan muncul di sini saat ada anggaran hampir habis, tagihan jatuh tempo, atau target tercapai.',
    position: 'bottom',
    path: '/dashboard',
  },
  {
    id: 'complete',
    targetSelector: '[data-tour="add-transaction"]',
    title: '🚀 Siap Memulai!',
    description: 'Sekarang Anda siap menggunakan Finance Tracking! Mulai dengan menambah akun dan mencatat transaksi pertama.',
    position: 'left',
    path: '/dashboard',
  },
];

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface SpotlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  top: number;
  left: number;
}

export function GuidedTour({ isOpen, onClose, onComplete }: GuidedTourProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightPos, setSpotlightPos] = useState<SpotlightPosition | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>({ top: 0, left: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;

  const calculatePositions = useCallback(() => {
    if (!step) return;

    // Check if mobile
    const mobile = window.innerWidth < 1024;
    setIsMobile(mobile);

    const element = document.querySelector(step.targetSelector);
    if (!element) {
      // If element not found, center tooltip on screen
      setSpotlightPos(null);
      const tooltipWidth = mobile ? Math.min(300, window.innerWidth - 32) : 320;
      setTooltipPos({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - tooltipWidth / 2,
      });
      return;
    }

    const rect = element.getBoundingClientRect();
    const padding = step.spotlightPadding || 8;

    // Set spotlight position
    setSpotlightPos({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    // Calculate tooltip position based on step.position
    // Use smaller width on mobile
    const tooltipWidth = mobile ? Math.min(300, window.innerWidth - 32) : 320;
    const tooltipHeight = 200;
    const gap = mobile ? 12 : 20;

    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'top':
        top = rect.top - tooltipHeight - gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - gap;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + gap;
        break;
    }

    // Keep tooltip in viewport
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));

    setTooltipPos({ top, left });
  }, [step]);

  // Handle sidebar for mobile
  useEffect(() => {
    if (!isOpen || !step) return;

    const isMobileView = window.innerWidth < 1024;
    
    // Auto-open sidebar on mobile if step requires it
    if (isMobileView && step.requiresSidebar && !sidebarOpen) {
      setSidebarOpen(true);
    }
    // Close sidebar on mobile if step doesn't require it
    else if (isMobileView && !step.requiresSidebar && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [isOpen, step, sidebarOpen, setSidebarOpen]);

  // Navigate to path if needed
  useEffect(() => {
    if (!isOpen || !step) return;

    if (step.path && pathname !== step.path) {
      setIsTransitioning(true);
      router.push(step.path);
    }
  }, [isOpen, step, pathname, router]);

  // Calculate positions after navigation
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      calculatePositions();
      setIsTransitioning(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [isOpen, currentStep, pathname, calculatePositions]);

  // Recalculate on resize and track mobile state
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      calculatePositions();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, calculatePositions]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setIsTransitioning(true);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setIsTransitioning(true);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (!isOpen) return null;

  // Calculate connector line points
  const getConnectorPath = () => {
    if (!spotlightPos || !tooltipRef.current) return '';

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    // Spotlight center
    const spotlightCenterX = spotlightPos.left + spotlightPos.width / 2;
    const spotlightCenterY = spotlightPos.top + spotlightPos.height / 2;
    
    // Tooltip edge point based on position
    let tooltipX = 0;
    let tooltipY = 0;

    switch (step.position) {
      case 'top':
        tooltipX = tooltipRect.left + tooltipRect.width / 2;
        tooltipY = tooltipRect.bottom;
        break;
      case 'bottom':
        tooltipX = tooltipRect.left + tooltipRect.width / 2;
        tooltipY = tooltipRect.top;
        break;
      case 'left':
        tooltipX = tooltipRect.right;
        tooltipY = tooltipRect.top + tooltipRect.height / 2;
        break;
      case 'right':
        tooltipX = tooltipRect.left;
        tooltipY = tooltipRect.top + tooltipRect.height / 2;
        break;
    }

    // Create curved path
    const midX = (spotlightCenterX + tooltipX) / 2;
    const midY = (spotlightCenterY + tooltipY) / 2;

    return `M ${spotlightCenterX} ${spotlightCenterY} Q ${midX} ${spotlightCenterY}, ${tooltipX} ${tooltipY}`;
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlightPos && (
              <rect
                x={spotlightPos.left}
                y={spotlightPos.top}
                width={spotlightPos.width}
                height={spotlightPos.height}
                rx="8"
                fill="black"
                className="transition-all duration-300 ease-out"
              />
            )}
          </mask>
        </defs>
        
        {/* Dark overlay with mask */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#spotlight-mask)"
          onClick={onClose}
        />

        {/* Spotlight border glow */}
        {spotlightPos && (
          <rect
            x={spotlightPos.left}
            y={spotlightPos.top}
            width={spotlightPos.width}
            height={spotlightPos.height}
            rx="8"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            className="transition-all duration-300 ease-out animate-pulse"
          />
        )}

        {/* Connector line */}
        {spotlightPos && !isTransitioning && (
          <>
            <path
              d={getConnectorPath()}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray="5,5"
              className="transition-all duration-300"
            />
            {/* Circle at spotlight end */}
            <circle
              cx={spotlightPos.left + spotlightPos.width / 2}
              cy={spotlightPos.top + spotlightPos.height / 2}
              r="6"
              fill="hsl(var(--primary))"
              className="animate-ping"
            />
            <circle
              cx={spotlightPos.left + spotlightPos.width / 2}
              cy={spotlightPos.top + spotlightPos.height / 2}
              r="4"
              fill="hsl(var(--primary))"
            />
          </>
        )}
      </svg>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          'fixed bg-background border rounded-xl shadow-2xl pointer-events-auto',
          'transition-all duration-300 ease-out',
          isTransitioning && 'opacity-0 scale-95',
          !isTransitioning && 'opacity-100 scale-100',
          isMobile ? 'w-[calc(100vw-32px)] max-w-[300px]' : 'w-80'
        )}
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
        }}
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted rounded-t-xl overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Content */}
        <div className="p-5 pt-6">
          <h3 className="text-lg font-bold mb-2">{step.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{step.description}</p>

          {/* Step counter */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-muted-foreground">
              {currentStep + 1} dari {tourSteps.length}
            </span>
            {!isLastStep && (
              <button
                onClick={handleSkip}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Lewati Tour
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={isFirstStep || isTransitioning}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Kembali
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              disabled={isTransitioning}
              className="flex-1"
            >
              {isLastStep ? (
                <>
                  Selesai
                  <Rocket className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Lanjut
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-1 pb-4">
          {tourSteps.map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                index === currentStep
                  ? 'w-4 bg-primary'
                  : index < currentStep
                  ? 'w-1.5 bg-primary/50'
                  : 'w-1.5 bg-muted-foreground/30'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
