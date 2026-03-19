'use client';

import dynamic from 'next/dynamic';

const LiveTracker = dynamic(() => import('@/components/LiveTracker'), { ssr: false });

export default function TrackerPage() {
  return (
    <div className="relative h-screen overflow-hidden">
      <LiveTracker />
    </div>
  );
}
