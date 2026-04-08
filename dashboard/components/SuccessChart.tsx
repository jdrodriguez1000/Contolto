import { TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';

interface SuccessChartProps {
  data: any[];
}

export default function SuccessChart({ data }: SuccessChartProps) {
  return (
    <article className="card animate-in" style={{ padding: '1.5rem', animationDelay: '0.6s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', color: 'var(--foreground-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} /> ESTRATEGIA REAL (IA) VS AZAR (ALEATORIA)
        </h2>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 10, height: 10, background: 'var(--primary)', borderRadius: '2px' }} /> ESTRATEGIA REAL (IA)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 10, height: 10, background: '#f97316', borderRadius: '2px' }} /> ESTRATEGIA ÚNICA (PERSISTENCIA)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 10, height: 10, background: '#64748b', borderRadius: '2px' }} /> AZAR (ALEATORIA)
          </div>
        </div>
      </div>
      <div style={{ width: '100%', height: 320, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
            <Tooltip 
              contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff', fontSize: '11px' }}
              formatter={(value: any, name: any, props: any) => {
                const n = (name || '').toString().toUpperCase();
                const isReal = n.includes('REAL');
                const isUnica = n.includes('ÚNICA') || n.includes('PERSISTENCIA');
                const count = isReal ? props.payload.realCount : (isUnica ? props.payload.unicaCount : props.payload.aleatoriaCount);
                return [`${Number(value).toFixed(2)}% (n=${count})`, `Estrategia: ${name}`];
              }}
            />
            <Bar dataKey="real" fill="var(--primary)" radius={[4, 4, 0, 0]} name="ESTRATEGIA REAL (IA)" />
            <Bar dataKey="unica" fill="#f97316" radius={[4, 4, 0, 0]} name="ESTRATEGIA ÚNICA (PERSISTENCIA)" />
            <Bar dataKey="aleatoria" fill="#64748b" radius={[4, 4, 0, 0]} name="AZAR (ALEATORIA)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
