'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function IntroWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <>{children}</>;
}
