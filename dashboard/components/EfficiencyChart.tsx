import { Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';

interface EfficiencyChartProps {
  data: any[];
}

export default function EfficiencyChart({ data }: EfficiencyChartProps) {
  return (
    <article className="card" style={{ padding: '1.5rem' }}>
      <div className="card-title" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
         <Activity size={18} style={{ color: '#fbbf24' }} /> FACTOR DE EFICIENCIA IA
      </div>
      <div style={{ height: '250px', width: '100%', minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}x`} />
            <Tooltip 
              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
              formatter={(v: any) => [`${Number(v).toFixed(2)}x`, 'Eficiencia']}
            />
            <Bar dataKey="efficiency" name="Eficiencia x Tirada" fill="#fbbf24" radius={[4, 4, 0, 0]}>
              {data.map((_entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={_entry.efficiency >= 1 ? '#fbbf24' : '#ef4444'} opacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '1rem', textAlign: 'center' }}>
        Muestra cuántas veces mejor rindió la IA comparada con el promedio esperado del azar.
      </p>
    </article>
  );
}
