import React from 'react';
import { TrendingUp } from 'lucide-react';

interface FrequencyTableProps {
  data: any[];
  selectedNumber: number | null;
  onSelect: (num: number) => void;
}

const FrequencyTable: React.FC<FrequencyTableProps> = ({ data, selectedNumber, onSelect }) => {
  return (
    <article className="card" style={{ padding: '1.5rem' }}>
      <div className="card-title" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} style={{ color: '#8b5cf6' }} /> MAPA DE CALOR: FRECUENCIA Y RECENCIA (NÚMEROS 1-43)
        </div>
        <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Análisis basado en los últimos 200 sorteos oficiales</div>
      </div>
      
      <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', opacity: 0.7 }}>
              <th style={{ padding: '0.75rem', position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 10 }}># NUM</th>
              <th style={{ padding: '0.75rem', position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 10 }}>FRECUENCIA</th>
              <th style={{ padding: '0.75rem', position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 10 }}>ÚTIMA VEZ</th>
              <th style={{ padding: '0.75rem', position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 10 }}>CICLO PROM.</th>
              <th style={{ padding: '0.75rem', position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 10 }}>PRECISIÓN IA</th>
              <th style={{ padding: '0.75rem', position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 10 }}>ESTIMACIÓN PRÓXIMO</th>
              <th style={{ padding: '0.75rem', position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 10 }}>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s, idx) => (
              <tr key={idx} 
                onClick={() => onSelect(s.num)}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s', cursor: 'pointer', background: selectedNumber === s.num ? 'rgba(251, 191, 36, 0.1)' : 'transparent' }}>
                <td style={{ padding: '0.75rem' }}>
                  <span className="number-badge" style={{ 
                    width: '28px', height: '28px', 
                    background: s.status === 'CALIENTE' ? 'rgba(239, 68, 68, 0.2)' : (s.status === 'LATENTE' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255,255,255,0.05)'),
                    borderColor: s.status === 'CALIENTE' ? '#ef4444' : (s.status === 'LATENTE' ? '#fbbf24' : 'rgba(255,255,255,0.1)'),
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderRadius: '50%',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold', color: s.status === 'CALIENTE' ? '#ef4444' : (s.status === 'LATENTE' ? '#fbbf24' : '#fff')
                  }}>
                    {s.num}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                      <div style={{ width: `${Math.min(100, (s.count / 40) * 100)}%`, height: '100%', background: '#8b5cf6', borderRadius: '2px' }} />
                    </div>
                    {s.count} veces
                  </div>
                </td>
                <td style={{ padding: '0.75rem', color: s.rawLast === 0 ? '#10b981' : (s.rawLast > 20 ? '#64748b' : '#fff') }}>
                  {s.lastSeen}
                </td>
                <td style={{ padding: '0.75rem', opacity: 0.6 }}>{s.avgGap} sorteos</td>
                <td style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>{s.precision}%</span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>n={s.totalPlayed}</span>
                  </div>
                </td>
                <td style={{ padding: '0.75rem', color: s.nextEst.includes('Próximamente') ? '#fbbf24' : '#fff', fontWeight: s.nextEst.includes('Próximamente') ? 'bold' : 'normal' }}>
                  {s.nextEst}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{ 
                    padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 'bold',
                    background: s.status === 'CALIENTE' ? 'rgba(239, 68, 68, 0.1)' : (s.status === 'LATENTE' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(16, 185, 129, 0.1)'),
                    color: s.status === 'CALIENTE' ? '#ef4444' : (s.status === 'LATENTE' ? '#fbbf24' : '#10b981'),
                    border: `1px solid ${s.status === 'CALIENTE' ? '#ef4444' : (s.status === 'LATENTE' ? '#fbbf24' : '#10b981')}`
                  }}>
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
};

export default FrequencyTable;
