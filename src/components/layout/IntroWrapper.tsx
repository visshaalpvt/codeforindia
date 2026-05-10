'use client';

import { useState, useEffect } from 'react';
import CinematicIntro from '@/components/intro/CinematicIntro';
import { useRouter, usePathname } from 'next/navigation';

export default function IntroWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [showIntro, setShowIntro] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Skip intro on login/register/auth pages
    const isAuthPage = ['/login', '/register', '/forgot-password'].includes(pathname);
    if (isAuthPage) {
      setAppReady(true);
      return;
    }

    // Check if user is logged in using correct key
    const isLoggedIn = !!localStorage.getItem('aiventra_user');
    if (isLoggedIn) {
      setShowIntro(true);
    } else {
      setAppReady(true);
    }
  }, [pathname]);

  const handleIntroComplete = () => {
    setShowIntro(false);
    setAppReady(true);
    // NO sessionStorage.setItem — plays every login
    router.push('/select-dashboard');
  };

  if (!mounted) return <>{children}</>;

  return (
    <>
      {showIntro && <CinematicIntro onComplete={handleIntroComplete} />}
      <div
        style={{
          visibility: showIntro ? 'hidden' : 'visible',
          opacity: appReady ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      >
        {children}
      </div>
    </>
  );
}
