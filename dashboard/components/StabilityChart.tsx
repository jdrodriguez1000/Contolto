import { Activity } from 'lucide-react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';

interface StabilityChartProps {
  data: any[];
}

export default function StabilityChart({ data }: StabilityChartProps) {
  return (
    <article className="card" style={{ padding: '1.5rem', borderTop: '4px solid #3b82f6' }}>
      <div className="card-title" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Activity size={18} style={{ color: '#3b82f6' }} /> PROMEDIO ACUMULADO (MÁX 6 ACIERTOS: 5+SB)
      </div>
      <div style={{ height: '350px', width: '100%', minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis 
              domain={[0, 'auto']} 
              stroke="rgba(255,255,255,0.4)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <Tooltip 
              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
              formatter={(value: any, name: any) => {
                const cleanName = (name || '').toString().replace(/ESTRATEGIA\s+/i, '').replace(/\(IA\)/i, '').trim();
                return [`${Number(value).toFixed(4)} Pts`, cleanName];
              }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
            
            {/* LÍNEAS MAESTRAS (Grosor 3) */}
            <Line type="monotone" dataKey="real" name="Real" stroke="#3b82f6" strokeWidth={3} dot={false} connectNulls />
            <Line type="monotone" dataKey="afinidad" name="Afinidad" stroke="#a855f7" strokeWidth={3} dot={false} connectNulls />
            
            {/* LÍNEAS DE COMPARACIÓN (Grosor 2) */}
            <Line type="monotone" dataKey="elite" name="Elite" stroke="#fbbf24" strokeWidth={2} dot={false} connectNulls />
            <Line type="monotone" dataKey="aleatoria" name="Aleatoria" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls />
            <Line type="monotone" dataKey="unica" name="Unica" stroke="#f97316" strokeWidth={2} dot={false} connectNulls />
            
            {/* LÍNEAS SECUNDARIAS (Grosor 1 + Opacidad) */}
            <Line type="monotone" dataKey="balanceada" name="Balanceada" stroke="#10b981" strokeWidth={1} dot={false} connectNulls opacity={0.6} />
            <Line type="monotone" dataKey="caliente" name="Caliente" stroke="#ef4444" strokeWidth={1} dot={false} connectNulls opacity={0.4} />
            <Line type="monotone" dataKey="mixta" name="Mixta" stroke="#8b5cf6" strokeWidth={1} dot={false} connectNulls opacity={0.4} />
            <Line type="monotone" dataKey="fria" name="Fría" stroke="#94a3b8" strokeWidth={1} dot={false} connectNulls opacity={0.4} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
