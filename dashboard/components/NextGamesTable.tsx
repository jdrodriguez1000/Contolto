import { Sparkles, ArrowUpRight } from 'lucide-react';

interface NextGame {
  id: number;
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
  estrategia: string;
  fecha_sorteo: string;
}

interface NextGamesTableProps {
  games: NextGame[];
}

export default function NextGamesTable({ games }: NextGamesTableProps) {
  if (!games || games.length === 0) return null;

  return (
    <article className="card animate-in" style={{ padding: '1.25rem', animationDelay: '0.2s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '0.9rem', color: 'var(--foreground-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={16} style={{ color: '#10b981' }} /> PRÓXIMAS JUGADAS RECOMENDADAS
        </h2>
        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>
          Sorteo: {new Date(games[0].fecha_sorteo).toLocaleDateString('es-CO')}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {games.map((game) => (
          <div key={game.id} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '0.75rem',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.05)',
            transition: 'transform 0.2s',
            cursor: 'default'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                fontSize: '0.65rem', 
                fontWeight: 'bold', 
                color: game.estrategia.toLowerCase() === 'real' ? '#fbbf24' : '#64748b',
                background: game.estrategia.toLowerCase() === 'real' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255,255,255,0.05)',
                padding: '2px 8px',
                borderRadius: '4px',
                width: '80px',
                textAlign: 'center'
              }}>
                {game.estrategia.toUpperCase()}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} className="number-badge" style={{ 
                    width: '26px', 
                    height: '26px', 
                    fontSize: '0.75rem' ,
                    background: game.estrategia.toLowerCase() === 'real' ? 'rgba(251, 191, 36, 0.05)' : 'transparent',
                    borderColor: game.estrategia.toLowerCase() === 'real' ? '#fbbf24' : 'var(--card-border)'
                  }}>
                    {game[`num${i}` as keyof NextGame] as number}
                  </span>
                ))}
                <span className="number-badge superball" style={{ width: '26px', height: '26px', fontSize: '0.75rem' }}>
                  {game.num6}
                </span>
              </div>
            </div>
            <ArrowUpRight size={14} style={{ opacity: 0.3 }} />
          </div>
        ))}
      </div>
    </article>
  );
}
