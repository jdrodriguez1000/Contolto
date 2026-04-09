
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface HitDistributionChartProps {
  data: any[];
}

const HitDistributionChart: React.FC<HitDistributionChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  // Transformar datos para Recharts
  const chartData = data.map(item => {
    const row: any = { strategy: item.strategy };
    item.hits.forEach((count: number, i: number) => {
      row[`${i} AC.`] = count;
    });
    row['S.B.'] = item.sb;
    return row;
  });


  const colors = [
    '#475569', // 0 AC (Slate 600)
    '#64748b', // 1 AC (Slate 500)
    '#94a3b8', // 2 AC (Slate 400)
    '#facc15', // 3 AC (Yellow 400)
    '#eab308', // 4 AC (Yellow 600 - Fuerte)
    '#f97316', // 5 AC (Orange 500)
    '#22c55e', // 6 AC (Green 500)
    '#8b5cf6'  // S.B. (Purple 500)
  ];

  return (
    <article className="card animate-in" style={{ padding: '1.5rem', marginTop: '1rem', minHeight: '400px' }}>
      <div className="card-title" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <BarChart3 size={18} style={{ color: 'var(--primary)' }} /> 
        VISUALIZACIÓN DE DENSIDAD POR NIVEL DE ACIERTO
      </div>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            barSize={20}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" stroke="rgba(255,255,255,0.5)" fontSize={11} axisLine={false} tickLine={false} />
            <YAxis 
              type="category" 
              dataKey="strategy" 
              stroke="#fff" 
              fontSize={10} 
              width={80} 
              axisLine={false} 
              tickLine={false}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
            />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
            
            <Bar dataKey="0 AC." stackId="a" fill={colors[0]} radius={[0, 0, 0, 0]} />
            <Bar dataKey="1 AC." stackId="a" fill={colors[1]} />
            <Bar dataKey="2 AC." stackId="a" fill={colors[2]} />
            <Bar dataKey="3 AC." stackId="a" fill={colors[3]} />
            <Bar dataKey="4 AC." stackId="a" fill={colors[4]} />
            <Bar dataKey="5 AC." stackId="a" fill={colors[5]} />
            <Bar dataKey="6 AC." stackId="a" fill={colors[6]} />
            <Bar dataKey="S.B." stackId="a" fill={colors[7]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
};

export default HitDistributionChart;
