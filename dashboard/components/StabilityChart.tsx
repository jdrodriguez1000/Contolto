import { Activity } from 'lucide-react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';

interface StabilityChartProps {
  data: any[];
}

export default function StabilityChart({ data }: StabilityChartProps) {
  return (
    <article className="card" style={{ padding: '1.5rem', borderTop: '4px solid #3b82f6' }}>
      <div className="card-title" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Activity size={18} style={{ color: '#3b82f6' }} /> PROMEDIO ACUMULADO (ESTABILIDAD A LARGO PLAZO)
      </div>
      <div style={{ height: '350px', width: '100%', minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
              formatter={(value: any, name: any) => {
                const n = (name || '').toString().toUpperCase();
                let cleanName = name;
                if (n.includes('REAL')) cleanName = 'ESTRATEGIA REAL (IA)';
                if (n.includes('ÚNICA') || n.includes('PERSISTENCIA')) cleanName = 'ESTRATEGIA ÚNICA (PERSISTENCIA)';
                if (n.includes('AZAR') || n.includes('ALEATORIA')) cleanName = 'AZAR (ALEATORIA)';
                return [`${Number(value).toFixed(4)} Ac`, `Estr: ${cleanName}`];
              }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
            <Line type="monotone" dataKey="real" name="ESTRATEGIA REAL (IA)" stroke="#3b82f6" strokeWidth={3} dot={false} connectNulls />
            <Line type="monotone" dataKey="elite" name="Elite" stroke="#fbbf24" strokeWidth={2} dot={false} connectNulls />
            <Line type="monotone" dataKey="aleatoria" name="AZAR (ALEATORIA)" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls />
            <Line type="monotone" dataKey="unica" name="ESTRATEGIA ÚNICA (PERSISTENCIA)" stroke="#f97316" strokeWidth={2} dot={false} connectNulls />
            <Line type="monotone" dataKey="balanceada" name="Balanceada" stroke="#10b981" strokeWidth={2} dot={false} connectNulls />
            <Line type="monotone" dataKey="caliente" name="Caliente" stroke="#ef4444" strokeWidth={1} dot={false} connectNulls opacity={0.6} />
            <Line type="monotone" dataKey="mixta" name="Mixta" stroke="#8b5cf6" strokeWidth={1} dot={false} connectNulls opacity={0.6} />
            <Line type="monotone" dataKey="fria" name="Fría" stroke="#a78bfa" strokeWidth={1} dot={false} connectNulls opacity={0.6} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
