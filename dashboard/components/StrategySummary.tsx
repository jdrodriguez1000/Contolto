import { Sparkles } from 'lucide-react';

interface StrategyStats {
  total: number;
  avg: number;
}

interface StrategySummaryProps {
  realStats: StrategyStats;
  unicaStats: StrategyStats;
  aleatoriaStats: StrategyStats;
}

export default function StrategySummary({ realStats, unicaStats, aleatoriaStats }: StrategySummaryProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Fila 1: ESTRATEGIA REAL */}
      <article className="card animate-in" style={{ padding: '0.5rem 0.8rem', borderLeft: '4px solid var(--primary)', background: 'rgba(59, 130, 246, 0.05)' }}>
        <div className="card-title" style={{ fontSize: '0.6rem', marginBottom: '0.2rem' }}>ESTRATEGIA REAL (IA)</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <span style={{ fontSize: '0.55rem', opacity: 0.6 }}>TOTAL</span>
            <div style={{ fontSize: '0.9rem', fontWeight: '800' }}>{realStats.total}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.55rem', opacity: 0.6 }}>AVG</span>
            <div style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--primary)' }}>{realStats.avg.toFixed(2)}</div>
          </div>
        </div>
      </article>

      {/* Fila 2: ESTRATEGIA ÚNICA */}
      <article className="card animate-in" style={{ padding: '0.5rem 0.8rem', borderLeft: '4px solid #f97316', background: 'rgba(249, 115, 22, 0.05)' }}>
        <div className="card-title" style={{ fontSize: '0.6rem', marginBottom: '0.2rem' }}>ESTRATEGIA ÚNICA (PERSISTENCIA)</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <span style={{ fontSize: '0.55rem', opacity: 0.6 }}>TOTAL</span>
            <div style={{ fontSize: '0.9rem', fontWeight: '800' }}>{unicaStats.total}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.55rem', opacity: 0.6 }}>AVG</span>
            <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#f97316' }}>{unicaStats.avg.toFixed(2)}</div>
          </div>
        </div>
      </article>

      {/* Fila 3: AZAR / ALEATORIA */}
      <article className="card animate-in" style={{ padding: '0.5rem 0.8rem', borderLeft: '4px solid #64748b', background: 'rgba(100, 116, 139, 0.05)' }}>
        <div className="card-title" style={{ fontSize: '0.6rem', marginBottom: '0.2rem' }}>AZAR (ALEATORIA)</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <span style={{ fontSize: '0.55rem', opacity: 0.6 }}>TOTAL</span>
            <div style={{ fontSize: '0.9rem', fontWeight: '800' }}>{aleatoriaStats.total}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.55rem', opacity: 0.6 }}>AVG</span>
            <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#64748b' }}>{aleatoriaStats.avg.toFixed(2)}</div>
          </div>
        </div>
      </article>

      {/* Fila 4: COMPARACIÓN GLOBAL (VENTAJA COMPETITIVA) */}
      <article className="card animate-in" style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
         <div className="card-title" style={{ fontSize: '0.7rem', color: '#10b981', marginBottom: '0.5rem' }}>
           <Sparkles size={14} /> VENTAJA COMPETITIVA (IA)
         </div>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                <span>vs Azar</span>
                <span style={{ 
                  fontWeight: 'bold', 
                  color: (realStats.avg >= aleatoriaStats.avg) ? '#10b981' : '#ef4444' 
                }}>
                  {(realStats.avg >= aleatoriaStats.avg ? '+' : '')}{(((realStats.avg / (aleatoriaStats.avg || 1)) - 1) * 100).toFixed(1)}%
                </span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                <span>vs Única</span>
                <span style={{ 
                  fontWeight: 'bold', 
                  color: (realStats.avg >= (unicaStats.avg || 1)) ? '#10b981' : '#ef4444' 
                }}>
                  {(realStats.avg >= (unicaStats.avg || 1) ? '+' : '')}{(((realStats.avg / (unicaStats.avg || 1)) - 1) * 100).toFixed(1)}%
                </span>
             </div>
             <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '0.4rem', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (realStats.avg/0.5)*100)}%`, height: '100%', background: '#10b981' }} />
             </div>
         </div>
      </article>
    </div>
  );
}
