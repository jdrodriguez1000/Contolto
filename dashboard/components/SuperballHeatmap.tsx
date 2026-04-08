import React from 'react';
import { Trophy } from 'lucide-react';

interface SuperballHeatmapProps {
  data: any[];
}

const SuperballHeatmap: React.FC<SuperballHeatmapProps> = ({ data }) => {
  return (
    <article className="card" style={{ padding: '1.5rem', marginTop: '1.5rem', borderTop: '4px solid #f59e0b' }}>
      <div className="card-title" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Trophy size={18} style={{ color: '#f59e0b' }} /> MAPA DE CALOR: SUPERBALOTA (1-16)
        </div>
        <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Análisis enfocado en el ciclo 1/16</div>
      </div>
      
      <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', opacity: 0.7 }}>
              <th style={{ padding: '0.75rem', position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 10 }}># SB</th>
              <th style={{ padding: '0.75rem', position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 10 }}>FRECUENCIA</th>
              <th style={{ padding: '0.75rem', position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 10 }}>ÚTIMA VEZ</th>
              <th style={{ padding: '0.75rem', position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 10 }}>CICLO PROM.</th>
              <th style={{ padding: '0.75rem', position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 10 }}>PRECISIÓN IA</th>
              <th style={{ padding: '0.75rem', position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 10 }}>ESTIMACIÓN</th>
              <th style={{ padding: '0.75rem', position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 10 }}>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s', cursor: 'default' }}>
                <td style={{ padding: '0.75rem' }}>
                  <span className="number-badge" style={{ 
                    width: '28px', height: '28px', 
                    background: 'transparent',
                    borderColor: '#f59e0b',
                    borderWidth: '1.5px',
                    borderStyle: 'solid',
                    borderRadius: '50%',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold', color: '#f59e0b'
                  }}>
                    {s.num}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                      <div style={{ width: `${Math.min(100, (s.count / 25) * 100)}%`, height: '100%', background: '#f59e0b', borderRadius: '2px' }} />
                    </div>
                    {s.count} veces
                  </div>
                </td>
                <td style={{ padding: '0.75rem', color: s.rawLast === 0 ? '#10b981' : (s.rawLast > 25 ? '#64748b' : '#fff') }}>
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

export default SuperballHeatmap;
