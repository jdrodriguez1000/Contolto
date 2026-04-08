import { Target, Activity, TrendingUp, Trophy, Sparkles } from 'lucide-react';
import { Sorteo, RendimientoDetallado } from '@/types';
import { formatDateShort } from '@/lib/utils';

interface StatsCardsProps {
  realStrategyEntry: RendimientoDetallado | null;
  lastSorteo: Sorteo | null;
  balotoJackpot: string;
  nextGames: any[];
}

export default function StatsCards({ 
  realStrategyEntry, 
  lastSorteo, 
  balotoJackpot, 
  nextGames 
}: StatsCardsProps) {
  return (
    <section className="grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
      {/* CARD 1: JUGADO */}
      <article className="card animate-in" style={{ animationDelay: '0.1s', borderTop: '4px solid var(--primary)', padding: '0.75rem' }}>
        <div className="card-title" style={{ fontSize: '0.7rem' }}>
          <Target size={14} /> JUGADO
        </div>
        <div style={{ display: 'flex', marginTop: '0.5rem', gap: '0.2rem', flexWrap: 'nowrap', alignItems: 'center' }}>
          {realStrategyEntry && lastSorteo ? (() => {
            const winningNums = [1, 2, 3, 4, 5].map(i => lastSorteo[`num${i}` as keyof Sorteo]);
            const isSbHit = realStrategyEntry.juegos.num6 === lastSorteo.num6;
            
            return (
              <>
                {[1, 2, 3, 4, 5].map(i => {
                  const val = realStrategyEntry.juegos[`num${i}` as keyof typeof realStrategyEntry.juegos] as number;
                  const isHit = winningNums.includes(val);
                  return (
                    <span key={i} className="number-badge" style={{ 
                      width: '22px', 
                      height: '22px', 
                      fontSize: '0.7rem',
                      background: isHit ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                      border: `1.5px solid ${isHit ? '#10b981' : 'var(--card-border)'}`,
                      color: isHit ? '#10b981' : 'var(--foreground-muted)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: isHit ? 'bold' : 'normal'
                    }}>
                      {val}
                    </span>
                  );
                })}
                <span className="number-badge" style={{ 
                  width: '22px', 
                  height: '22px', 
                  fontSize: '0.7rem',
                  background: isSbHit ? '#f59e0b' : 'transparent',
                  border: `1.5px solid #f59e0b`,
                  color: isSbHit ? '#fff' : '#f59e0b',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  boxShadow: isSbHit ? '0 0 8px rgba(245, 158, 11, 0.4)' : 'none'
                }}>
                  {realStrategyEntry.juegos.num6}
                </span>
              </>
            );
          })() : <span style={{opacity: 0.5, fontSize: '0.7rem'}}>...</span>}
        </div>
      </article>

      {/* CARD 2: SORTEO */}
      <article className="card animate-in" style={{ animationDelay: '0.2s', borderTop: '4px solid #f59e0b', padding: '0.75rem' }}>
        <div className="card-title" style={{ fontSize: '0.7rem' }}>
          <Activity size={14} /> ULTIMO SORTEO ({lastSorteo ? formatDateShort(lastSorteo.fecha) : '...'})
        </div>
        <div style={{ display: 'flex', marginTop: '0.5rem', gap: '0.2rem', flexWrap: 'nowrap', alignItems: 'center' }}>
          {lastSorteo ? (
            <>
              {[1, 2, 3, 4, 5].map(i => (
                <span key={i} className="number-badge hot" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }}>
                  {lastSorteo[`num${i}` as keyof Sorteo]}
                </span>
              ))}
              <span className="number-badge superball" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }}>
                {lastSorteo.num6}
              </span>
            </>
          ) : <span style={{opacity: 0.5, fontSize: '0.7rem'}}>...</span>}
        </div>
      </article>

      {/* CARD 3: ACIERTOS */}
      <article className="card animate-in" style={{ animationDelay: '0.3s', borderTop: '4px solid #3b82f6', padding: '0.75rem' }}>
        <div className="card-title" style={{ fontSize: '0.7rem' }}>
          <TrendingUp size={14} /> TOTAL ACIERTOS
        </div>
        <div className="card-value" style={{ color: '#3b82f6', fontSize: '1.2rem', marginTop: '0.2rem' }}>
          {realStrategyEntry ? (
            realStrategyEntry.aciertos_principales + (realStrategyEntry.acierto_superbalota ? 1 : 0)
          ) : '--'}
        </div>
      </article>

      {/* CARD 4: ACUMULADO */}
      <article className="card animate-in" style={{ animationDelay: '0.4s', borderTop: '4px solid #fbbf24', padding: '0.75rem' }}>
        <div className="card-title" style={{ fontSize: '0.7rem' }}>
          <Trophy size={14} /> ACUMULADO (JACKPOT)
        </div>
        <div className="card-value" style={{ color: '#fbbf24', fontSize: '1.1rem', marginTop: '0.2rem' }}>
          {balotoJackpot}
        </div>
      </article>

      {/* CARD 5: NUEVO */}
      <article className="card animate-in" style={{ animationDelay: '0.5s', borderTop: '4px solid #10b981', padding: '0.75rem' }}>
        <div className="card-title" style={{ fontSize: '0.7rem' }}>
          <Sparkles size={14} aria-label="Nuevo Juego" /> NUEVO JUEGO RECOMENDADO
        </div>
        <div style={{ display: 'flex', marginTop: '0.5rem', gap: '0.2rem', flexWrap: 'nowrap', alignItems: 'center' }}>
          {(() => {
            const nextReal = nextGames.find(g => g.estrategia.toLowerCase() === 'real');
            return nextReal ? (
              <>
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} className="number-badge hot" style={{ width: '22px', height: '22px', fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.2)', borderColor: '#10b981' }}>
                    {nextReal[`num${i}`]}
                  </span>
                ))}
                <span className="number-badge superball" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }}>
                  {nextReal.num6}
                </span>
              </>
            ) : <span style={{opacity: 0.5, fontSize: '0.7rem'}}>...</span>;
          })()}
        </div>
      </article>
    </section>
  );
}
