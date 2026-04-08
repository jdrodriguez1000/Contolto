import { TrendingUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from 'recharts';

interface SuperiorityChartProps {
  data: any[];
}

export default function SuperiorityChart({ data }: SuperiorityChartProps) {
  return (
    <article className="card" style={{ padding: '1.5rem' }}>
      <div className="card-title" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <TrendingUp size={18} style={{ color: '#10b981' }} /> ÍNDICE DE SUPERIORIDAD IA (%)
      </div>
      <div style={{ height: '250px', width: '100%', minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorSup" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip 
              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
              formatter={(v: any) => [`${Number(v).toFixed(1)}%`, 'Superior a']}
            />
            <Area type="monotone" dataKey="superiority" name="Superioridad vs Azar" stroke="#10b981" fillOpacity={1} fill="url(#colorSup)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '1rem', textAlign: 'center' }}>
        Indica a qué porcentaje de los 30 juegos aleatorios superó la IA en cada fecha.
      </p>
    </article>
  );
}
