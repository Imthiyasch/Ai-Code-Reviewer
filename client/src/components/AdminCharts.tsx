import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend,
} from 'recharts';
import { useTheme } from '../hooks/useTheme';

interface DailyData { day: string; avg_score: number; count: number; }
interface BugData { severity: string; count: number; }

interface AdminChartsProps {
  daily: DailyData[];
  topBugs: BugData[];
}

const severityColor: Record<string, string> = {
  high: '#ef4444', medium: '#f59e0b', low: '#22c55e',
};

export function AdminCharts({ daily, topBugs }: AdminChartsProps) {
  const { isDark } = useTheme();
  const axisColor = isDark ? '#6060a0' : '#aaaacc';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const tooltipBg = isDark ? '#1e1e2e' : '#ffffff';

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
      <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-lg)', padding:20 }}>
        <h3 style={{ marginBottom:16 }}>📈 Quality Score Trend (30 days)</h3>
        {daily.length === 0
          ? <p style={{ color:'var(--color-text-3)', textAlign:'center', padding:'32px 0' }}>No data yet</p>
          : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={daily} margin={{ top:5, right:16, bottom:5, left:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="day" tick={{ fill:axisColor, fontSize:11 }} tickLine={false} axisLine={false}
                tickFormatter={v => v.slice(5)} />
              <YAxis domain={[0,10]} tick={{ fill:axisColor, fontSize:11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background:tooltipBg, border:'1px solid var(--color-border)', borderRadius:8 }}
                labelStyle={{ color:'var(--color-text)', fontWeight:600 }}
                itemStyle={{ color:'#7c6ff7' }}
              />
              <Line type="monotone" dataKey="avg_score" stroke="#7c6ff7" strokeWidth={2.5} dot={{ r:3, fill:'#7c6ff7' }} activeDot={{ r:5 }} name="Avg Score" />
            </LineChart>
          </ResponsiveContainer>
          )}
      </div>

      <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-lg)', padding:20 }}>
        <h3 style={{ marginBottom:16 }}>🐛 Bugs by Severity</h3>
        {topBugs.length === 0
          ? <p style={{ color:'var(--color-text-3)', textAlign:'center', padding:'32px 0' }}>No bug data yet</p>
          : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topBugs} margin={{ top:5, right:16, bottom:5, left:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="severity" tick={{ fill:axisColor, fontSize:12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill:axisColor, fontSize:11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background:tooltipBg, border:'1px solid var(--color-border)', borderRadius:8 }}
                labelStyle={{ color:'var(--color-text)', fontWeight:600, textTransform:'capitalize' }}
              />
              <Bar dataKey="count" radius={[6,6,0,0]} name="Count">
                {topBugs.map((entry,i) => (
                  <Cell key={i} fill={severityColor[entry.severity] ?? '#7c6ff7'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          )}
      </div>
    </div>
  );
}

export default AdminCharts;
