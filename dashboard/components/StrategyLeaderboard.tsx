import { Trophy, Target } from 'lucide-react';

interface StrategyRanking {
  name: string;
  avg: number;
  total: number;
}

interface StrategyLeaderboardProps {
  ranking: StrategyRanking[];
}

export default function StrategyLeaderboard({ ranking }: StrategyLeaderboardProps) {
  return (
    <article className="card animate-in" style={{ padding: '1.25rem', animationDelay: '0.4s' }}>
      <div className="card-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Target size={18} style={{ color: '#fbbf24' }} /> LEADERBOARD: MEJORES ESTRATEGIAS
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {ranking.slice(0, 8).map((strat, idx) => (
          <div key={idx} style={{ 
            padding: '0.75rem', 
            background: 'rgba(255,255,255,0.02)', 
            borderRadius: '10px', 
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: idx === 0 ? '#fbbf24' : '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                 {idx === 0 && <Trophy size={14} />} {strat.name}
               </span>
               <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>n={strat.total}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
               <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.min(100, (strat.avg / 6) * 100)}%`, 
                    height: '100%', 
                    background: idx === 0 ? 'linear-gradient(90deg, #fbbf24, #f59e0b)' : 'linear-gradient(90deg, #3b82f6, #2563eb)' 
                  }} />
               </div>
               <div style={{ fontSize: '1rem', fontWeight: '900', color: idx === 0 ? '#fbbf24' : '#fff' }}>{strat.avg.toFixed(3)}</div>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
