import { TrendingUp } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area, Line } from 'recharts';

interface TrendAreaChartProps {
  data: any[];
}

export default function TrendAreaChart({ data }: TrendAreaChartProps) {
  return (
    <article className="card" style={{ padding: '1.5rem' }}>
      <div className="card-title" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} style={{ color: '#3b82f6' }} /> IA REAL VS RANGO DE AZAR (1 VS 30)
        </div>
        <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Franja gris representa el rango (Min-Max) de 30 juegos aleatorios</div>
      </div>
      <div style={{ height: '300px', width: '100%', minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Area type="monotone" dataKey="alea_range" name="Rango Azar (Min-Max)" fill="rgba(148, 163, 184, 0.15)" stroke="rgba(148, 163, 184, 0.3)" />
            <Line type="monotone" dataKey="alea_avg" name="Promedio Azar" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            <Line type="monotone" dataKey="real" name="IA Real" stroke="#3b82f6" strokeWidth={4} dot={{ r: 5, fill: '#3b82f6' }} activeDot={{ r: 8 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
