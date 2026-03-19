import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { FlightStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export function formatDistance(km: number): string {
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`;
  return `${km} km`;
}

export function formatDateTime(iso: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDate(iso: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(iso: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function getStatusColor(status: FlightStatus): string {
  switch (status) {
    case 'arrived': return 'text-emerald-400 bg-emerald-950 border-emerald-800';
    case 'departed': return 'text-cyan-400 bg-cyan-950 border-cyan-800';
    case 'boarding': return 'text-amber-400 bg-amber-950 border-amber-800';
    case 'scheduled': return 'text-blue-400 bg-blue-950 border-blue-800';
    case 'cancelled': return 'text-red-400 bg-red-950 border-red-800';
    case 'diverted': return 'text-orange-400 bg-orange-950 border-orange-800';
    case 'delayed': return 'text-yellow-400 bg-yellow-950 border-yellow-800';
    default: return 'text-slate-400 bg-slate-900 border-slate-700';
  }
}

export function getStatusDot(status: FlightStatus): string {
  switch (status) {
    case 'arrived': return 'bg-emerald-400';
    case 'departed': return 'bg-cyan-400';
    case 'boarding': return 'bg-amber-400';
    case 'scheduled': return 'bg-blue-400';
    case 'cancelled': return 'bg-red-400';
    case 'diverted': return 'bg-orange-400';
    case 'delayed': return 'bg-yellow-400';
    default: return 'bg-slate-400';
  }
}

export function isUpcoming(scheduledDep: string): boolean {
  return new Date(scheduledDep) > new Date();
}

export function isPast(scheduledDep: string): boolean {
  return new Date(scheduledDep) < new Date();
}
