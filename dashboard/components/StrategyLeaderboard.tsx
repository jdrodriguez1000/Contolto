import React from 'react';
import { Trophy, Target, Sparkles } from 'lucide-react';

interface StrategyRanking {
  name: string;
  avg: number;
  total: number;
}

interface StrategyLeaderboardProps {
  ranking: StrategyRanking[];
}

export default function StrategyLeaderboard({ ranking }: StrategyLeaderboardProps) {
  const realStrat = ranking.find(s => s.name.toLowerCase() === 'real');
  const others = ranking.filter(s => s.name.toLowerCase() !== 'real').slice(0, 8);

  const getStratColor = (name: string) => {
    const globalIdx = ranking.findIndex(s => s.name === name);
    if (globalIdx === 0) return '#10b981'; // Verde
    if (globalIdx >= 1 && globalIdx <= 3) return '#f59e0b'; // Amarillo
    return '#ef4444'; // Rojo
  };

  return (
    <article className="card animate-in" style={{ padding: '1.25rem', animationDelay: '0.4s' }}>
      <div className="card-title" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Target size={18} style={{ color: '#fbbf24' }} /> LEADERBOARD: MEJORES ESTRATEGIAS
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        
        {/* LADO IZQUIERDO: ESTRATEGIA REAL (ANCLAJE) */}
        {realStrat && (
          <div style={{ flex: '0 0 200px' }}>
            <div style={{ 
              width: '100%', 
              padding: '1rem', 
              background: 'rgba(255,255,255,0.02)', 
              borderRadius: '12px', 
              border: `1.5px solid ${getStratColor(realStrat.name)}`,
              boxShadow: `0 0 15px ${getStratColor(realStrat.name)}15`,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              textAlign: 'center',
              position: 'relative'
            }}>
                <div style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', background: getStratColor(realStrat.name), color: '#fff', fontSize: '0.6rem', padding: '1px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                  REAL
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.3rem', color: getStratColor(realStrat.name), fontWeight: 'bold', fontSize: '0.9rem' }}>
                   <Sparkles size={14} /> {realStrat.name.toUpperCase()}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fff' }}>{realStrat.avg.toFixed(3)}</div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (realStrat.avg / 6) * 100)}%`, height: '100%', background: getStratColor(realStrat.name) }} />
                </div>
                <div style={{ fontSize: '0.65rem', opacity: 0.4 }}>n={realStrat.total} sorteos analizados</div>
            </div>
          </div>
        )}

        {/* LADO DERECHO: CUADRÍCULA 4x2 DE COMPARACIÓN */}
        <div style={{ 
          flex: 1,
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '0.85rem'
        }}>
          {others.map((strat, idx) => {
            const color = getStratColor(strat.name);
            const globalIdx = ranking.findIndex(s => s.name === strat.name);
            
            return (
              <div key={idx} style={{ 
                padding: '0.65rem', 
                background: 'rgba(255,255,255,0.02)', 
                borderRadius: '8px', 
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                borderLeft: globalIdx < 4 ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#fff' }}>
                      {globalIdx === 0 && <Trophy size={11} style={{ color: '#fbbf24', display: 'inline', marginRight: '3px' }} />} {strat.name}
                   </span>
                   <span style={{ fontSize: '0.55rem', opacity: 0.4 }}>n={strat.total}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                   <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${Math.min(100, (strat.avg / 6) * 100)}%`, 
                        height: '100%', 
                        background: color 
                      }} />
                   </div>
                   <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: color }}>{strat.avg.toFixed(3)}</div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </article>
  );
}
