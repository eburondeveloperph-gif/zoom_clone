'use client';

// Success Class - Prejoin Page (root "/")
// Redirects to /auth if not authenticated
// Shows prejoin card for role/name/language selection

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PrejoinCard } from '@/ui/PrejoinCard';
import {
  loadSession,
  setRole,
  setName,
  setLanguage,
  setPreferredMic,
  setPreferredCam,
  getSessionState,
} from '@/state/session.store';
import type { UserRole } from '@/state/session.store';

export default function PrejoinPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Load session from localStorage
    const session = loadSession();
    
    if (!session.isAuthenticated) {
      router.replace('/auth');
      return;
    }
    
    setIsAuthenticated(true);
    setIsLoading(false);
  }, [router]);

  const handleJoin = (data: {
    role: UserRole;
    name: string;
    language: string;
    micId: string | null;
    camId: string | null;
  }) => {
    // Persist to store/localStorage
    setRole(data.role);
    setName(data.name);
    setLanguage(data.language);
    if (data.micId) setPreferredMic(data.micId);
    if (data.camId) setPreferredCam(data.camId);
    
    // Navigate to classroom
    router.push('/classroom');
  };

  if (isLoading) {
    return (
      <main className="sc-prejoin-page">
        <div className="sc-loading">
          <div className="sc-spinner" />
          <span>Loading...</span>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <main className="sc-prejoin-page">
      <PrejoinCard onJoin={handleJoin} />
    </main>
  );
}
