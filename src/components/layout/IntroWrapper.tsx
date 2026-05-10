'use client';

import { useState, useEffect } from 'react';
import CinematicIntro from '@/components/intro/CinematicIntro';
import { useRouter, usePathname } from 'next/navigation';

export default function IntroWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    // Check if intro already played this session
    const played = sessionStorage.getItem('introPlayed');
    
    // Only show intro on root or dashboard paths, not on login/register
    const isMainPath = pathname === '/' || pathname.startsWith('/d');
    
    // Check if user is logged in (simulated check)
    // Replace with your actual auth check if needed
    const isLoggedIn = true; 

    if (!played && isMainPath && isLoggedIn) {
      setShowIntro(true);
    }
  }, [pathname]);

  const handleIntroComplete = () => {
    sessionStorage.setItem('introPlayed', 'true');
    setShowIntro(false);
    // If we are at root, go to select-dashboard
    if (pathname === '/') {
      router.push('/select-dashboard');
    }
  };

  return (
    <>
      {showIntro && <CinematicIntro onComplete={handleIntroComplete} />}
      <div className={showIntro ? 'invisible opacity-0' : 'visible opacity-100 transition-opacity duration-1000'}>
        {children}
      </div>
    </>
  );
}
