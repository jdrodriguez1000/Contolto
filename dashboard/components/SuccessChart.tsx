import { Target } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';

interface SuccessChartProps {
  data: any[];
}

export default function SuccessChart({ data }: SuccessChartProps) {
  return (
    <article className="card animate-in" style={{ 
      padding: '1.25rem', 
      animationDelay: '0.6s', 
      borderTop: '4px solid #f97316',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
           <h2 style={{ fontSize: '1rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={18} style={{ color: '#f97316' }} /> ESTRATEGIA REAL VS ESTRATEGIA ALEATORIA
          </h2>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 10, height: 10, background: 'var(--primary)', borderRadius: '2px' }} /> Real
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 10, height: 10, background: '#f97316', borderRadius: '2px' }} /> Unica
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 10, height: 10, background: '#64748b', borderRadius: '2px' }} /> Aleatoria
          </div>
        </div>
      </div>

      <div style={{ width: '100%', flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="rgba(255,255,255,0.6)" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              interval={0}
              tick={(props: any) => {
                const { x, y, payload } = props;
                const isSB = payload.value === 'SB';
                return (
                  <text 
                    x={x} y={y + 16} 
                    textAnchor="middle" 
                    fill={isSB ? '#f97316' : 'rgba(255,255,255,0.6)'}
                    fontWeight={isSB ? 'bold' : 'normal'}
                    fontSize={isSB ? 12 : 11}
                  >
                    {payload.value}
                  </text>
                );
              }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.4)" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(val) => `${val}%`} 
            />
            <Tooltip 
              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ fontSize: '11px' }}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              formatter={(value: any, name: any, props: any) => {
                const n = (name || '').toString().toUpperCase();
                const isReal = n.includes('REAL');
                const isUnica = n.includes('UNICA') || n.includes('ÚNICA') || n.includes('PERSISTENCIA');
                const count = isReal ? props.payload.realCount : (isUnica ? props.payload.unicaCount : props.payload.aleatoriaCount);
                return [`${Number(value).toFixed(2)}% (${count} aciertos)`, name];
              }}
            />
            
            <Bar dataKey="real" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Real" barSize={20} />
            <Bar dataKey="unica" fill="#f97316" radius={[4, 4, 0, 0]} name="Unica" barSize={20} />
            <Bar dataKey="aleatoria" fill="#64748b" radius={[4, 4, 0, 0]} name="Aleatoria" barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ fontSize: '0.6rem', opacity: 0.2, marginTop: '10px', textAlign: 'center' }}>
        * Ventana de 24 sorteos monitoreados.
      </div>
    </article>
  );
}
