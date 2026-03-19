'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PlaneTakeoff, Radio, Plus, Eye, LogOut, Menu, X as XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/tracker',  label: 'Live Tracker', icon: Radio        },
  { href: '/flights',  label: 'My Flights',   icon: PlaneTakeoff  },
  { href: '/godseye',  label: "God's Eye",    icon: Eye           },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  function logout() {
    document.cookie = 'jarvis_auth=; path=/; max-age=0';
    router.push('/login');
  }

  function closeNav() { setMobileOpen(false); }

  return (
    <>
      {/* Hamburger — mobile only */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-[70] p-2 rounded-lg bg-[#080c14] border border-[#1a1e30] text-slate-400 hover:text-slate-200 active:scale-95 transition-all"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm"
        />
      )}

    <aside className={cn(
      "fixed left-0 top-0 h-screen w-64 bg-[#080c14] border-r border-[#1a1e30] flex flex-col z-[66] transition-transform duration-300 ease-in-out",
      mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-[#1a1e30]">
        <div className="flex items-center gap-3">
          {/* Close button on mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 -ml-1 text-slate-600 hover:text-slate-400 mr-1"
            aria-label="Close menu"
          >
            <XIcon className="w-4 h-4" />
          </button>
          <div className="relative">
            <Image
              src="/jarvis-logo.svg"
              alt="JARVIS"
              width={36}
              height={36}
              className="drop-shadow-[0_4px_12px_rgba(14,165,233,0.6)]"
            />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-cyan-400 rounded-full pulse-dot border-2 border-[#080c14]" />
          </div>
          <div>
            <div className="font-bold text-white tracking-widest text-xs uppercase">JARVIS</div>
            <div className="font-mono text-[10px] text-sky-400 tracking-widest">INTEL SYSTEM</div>
          </div>
        </div>
        <div className="mt-4 p-2 bg-[#0d1117] border border-[#1a1e30] rounded">
          <div className="flex items-center gap-2">
            <Radio className="w-3 h-3 text-cyan-400 pulse-dot" />
            <span className="font-mono text-xs text-slate-500">SYSTEM ONLINE</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <div className="mb-4">
          <div className="font-mono text-[10px] text-slate-600 tracking-widest uppercase px-2 mb-2">
            Operations
          </div>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={closeNav}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-150 group',
                  active
                    ? 'bg-sky-500/10 border border-sky-500/20 text-sky-400'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-[#111320] border border-transparent'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 flex-shrink-0',
                    active ? 'text-sky-400' : 'text-slate-600 group-hover:text-slate-400'
                  )}
                />
                <span className="text-sm font-medium">{label}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 bg-sky-400 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Quick Add */}
        <div className="pt-4 border-t border-[#1a1e30]">
          <Link
            href="/flights/new"
            onClick={closeNav}
            className="flex items-center gap-3 px-3 py-2.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 hover:border-sky-500/40 transition-all duration-150"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Log Flight</span>
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#1a1e30]">
        <div className="bg-[#0d1117] border border-[#1a1e30] rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-[#050d14] border border-sky-500/30 rounded flex items-center justify-center shadow shadow-sky-900/40">
              <span className="text-sky-400 text-[10px] font-mono font-bold">AI</span>
            </div>
            <div>
              <div className="text-xs text-slate-300 font-medium">JARVIS AI</div>
              <div className="text-[10px] font-mono text-slate-600">INTEL SYSTEM</div>
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[10px] text-slate-700 text-center">
          v2.0 · JARVIS
        </div>
        <button
          onClick={logout}
          className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded border border-red-900/30 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-150 font-mono text-xs tracking-widest"
        >
          <LogOut className="w-3.5 h-3.5" />
          LOGOUT
        </button>
      </div>
    </aside>
    </>
  );
}
