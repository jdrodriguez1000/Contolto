import { Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';

interface EngineDistributionChartProps {
  data: any[];
}

export default function EngineDistributionChart({ data }: EngineDistributionChartProps) {
  return (
    <article className="card" style={{ padding: '1.25rem' }}>
      <div className="card-title" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Activity size={18} style={{ color: 'var(--primary)' }} /> DISTRIBUCIÓN COMPARATIVA: MOTORES PRINCIPALES (%)
      </div>
      <div style={{ height: '350px', width: '100%', minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="aciertos" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip 
              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
            <Bar dataKey="Elite" fill="#fbbf24" name="Elite" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Caliente" fill="#ef4444" name="Caliente" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Balanceada" fill="#8b5cf6" name="Balanceada" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Fria" fill="#3b82f6" name="Fría" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Mixta" fill="#10b981" name="Mixta" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
