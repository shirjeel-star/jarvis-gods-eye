'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { FlightStats } from '@/types';

const COLORS = ['#00d4ff', '#0090b0', '#006680', '#004455', '#003040', '#00d4ff88'];
const CHART_STYLE = {
  backgroundColor: 'transparent',
  border: 'none',
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d0f1a] border border-[#252a40] rounded px-3 py-2 font-mono text-xs shadow-xl">
      {label && <div className="text-slate-500 mb-1">{label}</div>}
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color || '#00d4ff' }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function StatsCharts({ stats }: { stats: FlightStats }) {
  return (
    <>
      {/* Flights per month */}
      {stats.flightsByMonth.length > 0 && (
        <div className="panel p-5">
          <div className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-4">
            Flights by Month
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.flightsByMonth} style={CHART_STYLE}>
              <defs>
                <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                tick={{ fill: '#374151', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: '#1a1e30' }}
                tickLine={false}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis
                tick={{ fill: '#374151', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                name="Flights"
                stroke="#00d4ff"
                strokeWidth={1.5}
                fill="url(#cyanGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Airlines pie */}
      {stats.flightsByAirline.length > 0 && (
        <div className="panel p-5">
          <div className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-4">
            Airline Distribution
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={stats.flightsByAirline.slice(0, 6)}
                  dataKey="count"
                  nameKey="airline"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  strokeWidth={0}
                >
                  {stats.flightsByAirline.slice(0, 6).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {stats.flightsByAirline.slice(0, 6).map(({ airline, count }, i) => (
                <div key={airline} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-slate-400 truncate flex-1">{airline.split(' ').slice(-1)[0]}</span>
                  <span className="font-mono text-slate-600">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
