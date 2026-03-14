'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      <span className="ml-2">Redirecting to Dashboard...</span>
    </div>
  );
}