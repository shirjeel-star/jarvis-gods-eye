import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'JARVIS — Intelligence & Routing System',
  description: 'AI-powered flight operations intelligence, emergency routing, and crew management platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#080a0f] text-slate-200 min-h-screen">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 md:ml-64 min-h-screen pt-14 md:pt-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
