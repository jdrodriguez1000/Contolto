import { Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, LabelList } from 'recharts';

interface EngineDistributionChartProps {
  data: any[];
}

export default function EngineDistributionChart({ data }: EngineDistributionChartProps) {
  // Función para renderizar el número de aciertos solo en la categoría SB
  const renderCustomLabel = (props: any) => {
    const { x, y, width, value, payload } = props;
    if (!payload || payload.aciertos !== 'SB' || value === 0) return null;

    return (
      <text
        x={x + width / 2}
        y={y - 8}
        fill="#f97316"
        textAnchor="middle"
        fontSize={10}
        fontWeight="bold"
      >
        {props.payload[`${props.dataKey}Count`]}
      </text>
    );
  };

  return (
    <article className="card" style={{ padding: '1.25rem', borderTop: '4px solid #a855f7' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} style={{ color: '#a855f7' }} /> DISTRIBUCIÓN COMPARATIVA: MOTORES PRINCIPALES (%)
        </div>
      </div>

      <div style={{ height: '350px', width: '100%', minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 25, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="aciertos"
              stroke="rgba(255,255,255,0.4)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={(props: any) => {
                const { x, y, payload } = props;
                const val = payload.value;
                const isSB = val === 'SB';
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text
                      x={0} y={0} dy={16}
                      textAnchor="middle"
                      fill={isSB ? '#f97316' : 'rgba(255,255,255,0.6)'}
                      fontWeight={isSB ? 'bold' : 'normal'}
                      fontSize={isSB ? 13 : 11}
                    >
                      {val}
                    </text>
                  </g>
                );
              }}
            />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              formatter={(value: any, name: any, props: any) => {
                const countKey = `${name}Count`;
                const count = props.payload[countKey] || 0;
                return [`${Number(value).toFixed(2)}% (${count} aciertos)`, name];
              }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '15px' }} />

            <Bar dataKey="Afinidad" fill="#a855f7" name="Afinidad" radius={[3, 3, 0, 0]} barSize={18}>
              <LabelList content={renderCustomLabel} dataKey="Afinidad" />
            </Bar>
            <Bar dataKey="Elite" fill="#fbbf24" name="Elite" radius={[3, 3, 0, 0]} barSize={18}>
              <LabelList content={renderCustomLabel} dataKey="Elite" />
            </Bar>
            <Bar dataKey="Caliente" fill="#ef4444" name="Caliente" radius={[3, 3, 0, 0]} barSize={18}>
              <LabelList content={renderCustomLabel} dataKey="Caliente" />
            </Bar>
            <Bar dataKey="Balanceada" fill="#8b5cf6" name="Balanceada" radius={[3, 3, 0, 0]} barSize={18}>
              <LabelList content={renderCustomLabel} dataKey="Balanceada" />
            </Bar>
            <Bar dataKey="Fria" fill="#3b82f6" name="Fria" radius={[3, 3, 0, 0]} barSize={18}>
              <LabelList content={renderCustomLabel} dataKey="Fria" />
            </Bar>
            <Bar dataKey="Mixta" fill="#10b981" name="Mixta" radius={[3, 3, 0, 0]} barSize={18}>
              <LabelList content={renderCustomLabel} dataKey="Mixta" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
