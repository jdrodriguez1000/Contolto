'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  TrendingUp,
  ArrowUpRight,
  Settings,
  Calendar,
  Trophy,
  Activity,
  History,
  Target,
  Sparkles,
  RotateCw
} from 'lucide-react';

interface Sorteo {
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
  fecha: string;
}

interface RendimientoDetallado {
  aciertos_principales: number;
  acierto_superbalota: boolean;
  juegos: {
    estrategia: string;
    num1: number;
    num2: number;
    num3: number;
    num4: number;
    num5: number;
    num6: number;
    fecha_sorteo: string;
  };
  winner?: Sorteo;
}

export default function Home() {
  const [lastSorteo, setLastSorteo] = useState<Sorteo | null>(null);
  const [bestStrategy, setBestStrategy] = useState<string>('Calculando...');
  const [realStrategyEntry, setRealStrategyEntry] = useState<RendimientoDetallado | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [strategyRanking, setStrategyRanking] = useState<any[]>([]);
  const [detailedRecent, setDetailedRecent] = useState<RendimientoDetallado[]>([]);
  const [nextGames, setNextGames] = useState<any[]>([]);
  const [balotoJackpot, setBalotoJackpot] = useState<string>('...');

  useEffect(() => {
    async function fetchJackpot() {
       try {
          const res = await fetch('/api/baloto');
          const data = await res.json();
          if (data.jackpot) setBalotoJackpot(data.jackpot);
       } catch (err) {
          console.error("Error fetching jackpot:", err);
       }
    }
    fetchJackpot();

    async function fetchData() {
      setLoading(true);
      try {
        // 1. Obtener último sorteo ganador
        const { data: sorteoData } = await supabase
          .from('historial')
          .select('*')
          .eq('tipo', 'Baloto')
          .order('fecha', { ascending: false })
          .limit(1);
        
        let latestWinner: Sorteo | null = null;
        if (sorteoData && sorteoData.length > 0) {
          latestWinner = sorteoData[0];
          setLastSorteo(latestWinner);
        }

        // 2. Obtener mejor estrategia (last 20 total)
        const { data: rendData } = await supabase
          .from('rendimiento')
          .select(`
            aciertos_principales,
            juegos ( estrategia )
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        if (rendData) {
          const stats: Record<string, number[]> = {};
          rendData.forEach((item: any) => {
             const juego = Array.isArray(item.juegos) ? item.juegos[0] : item.juegos;
             const est = juego?.estrategia;
             if (est) {
                if (!stats[est]) stats[est] = [];
                stats[est].push(item.aciertos_principales);
             }
          });
          
          let best = 'Caliente';
          let maxAvg = -1;
          Object.entries(stats).forEach(([name, values]) => {
             const avg = values.reduce((a, b) => a + b, 0) / values.length;
             if (avg > maxAvg) {
                maxAvg = avg;
                best = name;
             }
          });
          setBestStrategy(best);
        }

        // 3. (Removido Números Calientes a petición del usuario para mostrar aciertos totales)

        // 4. Ranking de Estrategias completo
        const { data: rankData } = await supabase
          .from('rendimiento')
          .select(`
            aciertos_principales,
            acierto_superbalota,
            juegos ( estrategia )
          `);

        if (rankData) {
          const agg: Record<string, { total: number, sum: number, sb: number }> = {};
          rankData.forEach((item: any) => {
            const juego = Array.isArray(item.juegos) ? item.juegos[0] : item.juegos;
            const est = juego?.estrategia;
            if (!est) return;
            if (!agg[est]) agg[est] = { total: 0, sum: 0, sb: 0 };
            agg[est].total += 1;
            agg[est].sum += item.aciertos_principales;
            if (item.acierto_superbalota) agg[est].sb += 1;
          });

          const ranked = Object.entries(agg)
            .map(([name, s]) => ({
              estrategia: name,
              promedio: (s.sum / s.total).toFixed(2),
              sb: s.sb,
              total: s.total
            }))
            .sort((a, b) => parseFloat(b.promedio) - parseFloat(a.promedio));
          
          setStrategyRanking(ranked);
        }

        // 5. Último Juego Integrado (Solo el juego más reciente grabado en rendimiento)
        const { data: recentEntries } = await supabase
          .from('rendimiento')
          .select(`
            aciertos_principales,
            acierto_superbalota,
            juegos (
              estrategia,
              num1, num2, num3, num4, num5, num6,
              fecha_sorteo
            )
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        if (recentEntries && recentEntries.length > 0) {
          // Supabase relation might return an array for 'juegos'
          const getJuego = (r: any) => Array.isArray(r.juegos) ? r.juegos[0] : r.juegos;

          // Identificar la fecha del juego más reciente en rendimiento
          const latestJuego = getJuego(recentEntries[0]);
          const latestDate = latestJuego?.fecha_sorteo;
          
          // Filtrar por esa fecha específica
          const sameDayGames = recentEntries.filter(r => getJuego(r)?.fecha_sorteo === latestDate);
          
          // Buscar el ganador para esa fecha
          let winnerForDate = latestWinner;
          if (latestWinner?.fecha !== latestDate && latestDate) {
             const { data: oldWinner } = await supabase
               .from('historial')
               .select('*')
               .eq('fecha', latestDate)
               .limit(1);
             if (oldWinner && oldWinner.length > 0) winnerForDate = oldWinner[0];
          }

          const mappedGames = sameDayGames.map(g => ({ 
            ...g, 
            juegos: getJuego(g),
            winner: winnerForDate || undefined 
          }));

          setDetailedRecent(mappedGames);

          // Buscar la estrategia "Real" específicamente
          const real = mappedGames.find(g => g.juegos.estrategia.toLowerCase() === 'real');
          if (real) setRealStrategyEntry(real);
        }

        // 6. Obtener Próximos Juegos (Última carga en tabla juegos que no esté en rendimiento aún o simplemente los más recientes)
        const { data: latestGames } = await supabase
          .from('juegos')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (latestGames && latestGames.length > 0) {
           // Filtrar por la fecha más reciente encontrada en la tabla juegos
           const mostRecentDate = latestGames[0].fecha_sorteo;
           const gamesToPlay = latestGames.filter(g => g.fecha_sorteo === mostRecentDate);
           setNextGames(gamesToPlay);
        }

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CO', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00Z');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const yy = String(d.getUTCFullYear()).slice(-2);
    return `${dd}-${mm}-${yy}`;
  };

  const getMatchedNumbers = (play: number[], winner: number[]) => {
    return play.filter(n => winner.includes(n));
  };

  const handleRegenerate = async () => {
    if (regenerating) return;

    setRegenerating(true);
    try {
      const res = await fetch('/api/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();

      if (data.success) {
        // Recargar datos después de regenerar
        await new Promise(resolve => setTimeout(resolve, 1000));
        window.location.reload();
      } else {
        alert(`Error: ${data.message}`);
        setRegenerating(false);
      }
    } catch (err) {
      console.error('Error regenerando:', err);
      alert('Error al regenerar los números');
      setRegenerating(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a', color: 'white' }}>
       <div style={{ textAlign: 'center' }}>
          <Sparkles size={48} style={{ color: '#10b981', marginBottom: '1rem' }} />
          <p style={{ fontSize: '1.25rem', fontWeight: 300 }}>Sincronizando con Supabase...</p>
       </div>
    </div>
  );

  return (
    <main className="dashboard-container">
      <header className="header animate-in">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
             <Sparkles style={{ color: '#fbbf24' }} size={32} />
             <h1>Contolto Profesional</h1>
          </div>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: regenerating ? '#475569' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: regenerating ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 600,
            transition: 'all 0.3s ease',
            opacity: regenerating ? 0.7 : 1,
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <RotateCw
            size={20}
            style={{
              animation: regenerating ? 'spin 1s linear infinite' : 'none'
            }}
          />
          {regenerating ? 'Regenerando...' : 'Volver a jugar'}
        </button>
      </header>

      {/* KPI Cards */}
      <section className="grid">
        <article className="card animate-in" style={{ animationDelay: '0.1s', borderTop: '4px solid var(--primary)' }}>
          <div className="card-title">
            <Target size={16} /> ESTRATEGIA REAL JUGADA
          </div>
          <div style={{ display: 'flex', marginTop: '0.5rem', gap: '0.3rem', flexWrap: 'nowrap', alignItems: 'center' }}>
            {realStrategyEntry ? (
              <>
                {[1, 2, 3, 4, 5].map(i => {
                  const val = realStrategyEntry.juegos[`num${i}` as keyof typeof realStrategyEntry.juegos];
                  return (
                    <span key={i} className="number-badge hot">
                      {val as number}
                    </span>
                  );
                })}
                <span className="number-badge superball">
                  {realStrategyEntry.juegos.num6}
                </span>
              </>
            ) : <span style={{opacity: 0.5}}>Buscando...</span>}
          </div>
          {/* Message removed */}
        </article>

        <article className="card animate-in" style={{ animationDelay: '0.2s', borderTop: '4px solid #f59e0b' }}>
          <div className="card-title">
            <Activity size={16} /> ÚLTIMO SORTEO ({lastSorteo ? formatDateShort(lastSorteo.fecha) : '...'})
          </div>
          <div style={{ display: 'flex', marginTop: '0.5rem', gap: '0.3rem', flexWrap: 'nowrap', alignItems: 'center' }}>
            {lastSorteo ? (
              <>
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} className="number-badge hot">
                    {lastSorteo[`num${i}` as keyof Sorteo]}
                  </span>
                ))}
                <span className="number-badge superball">
                  {lastSorteo.num6}
                </span>
              </>
            ) : 'Cargando...'}
          </div>
        </article>

        <article className="card animate-in" style={{ animationDelay: '0.3s', borderTop: '4px solid #3b82f6' }}>
          <div className="card-title">
            <TrendingUp size={16} /> TOTAL ACIERTOS (EST. REAL)
          </div>
          <div className="card-value" style={{ color: '#3b82f6', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            {realStrategyEntry ? (
              <>
                {realStrategyEntry.aciertos_principales}
                <span style={{ fontSize: '1rem', opacity: 0.7 }}>
                  {realStrategyEntry.acierto_superbalota ? '+ SÚPERBOLA' : ' (Sin SB)'}
                </span>
              </>
            ) : '--'}
          </div>
          {/* Message removed */}
        </article>

        <article className="card animate-in" style={{ animationDelay: '0.4s', borderTop: '4px solid #fbbf24' }}>
          <div className="card-title">
            <Trophy size={16} /> ACUMULADO BALOTO
          </div>
          <div className="card-value" style={{ color: '#fbbf24' }}>
            {balotoJackpot}
          </div>
        </article>
      </section>

      {/* Unified Detailed Report Table */}
      <section className="card animate-in" style={{ animationDelay: '0.4s', marginBottom: '1.5rem' }}>
        <div className="card-title" style={{ color: 'white', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} /> Reporte Completo de Rendimiento
           </div>
           <span style={{ fontSize: '0.7rem', opacity: 0.6, background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
              {detailedRecent.length > 0 ? formatDate(detailedRecent[0].juegos.fecha_sorteo) : '---'}
           </span>
        </div>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>Estrategia</th>
                <th style={{ padding: '0.75rem' }}>S.B. Últ.</th>
                <th style={{ padding: '0.75rem' }}>Jugada (IA)</th>
                <th style={{ padding: '0.75rem' }}>Aciertos</th>
                <th style={{ padding: '0.75rem', borderLeft: '2px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.02)' }}>Prom. All Time</th>
                <th style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)' }}>S.B. All Time</th>
                <th style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)' }}>Total Juegos</th>
                <th style={{ padding: '0.75rem', borderLeft: '2px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.03)' }}>Próxima Jugada</th>
              </tr>
            </thead>
            <tbody>
              {detailedRecent.sort((a, b) => a.juegos.estrategia.localeCompare(b.juegos.estrategia)).map((r, i) => {
                const playNums = r.juegos ? [r.juegos.num1, r.juegos.num2, r.juegos.num3, r.juegos.num4, r.juegos.num5] : [];
                const winNums = r.winner ? [r.winner.num1, r.winner.num2, r.winner.num3, r.winner.num4, r.winner.num5] : [];
                const matches = getMatchedNumbers(playNums, winNums);
                const rankData = strategyRanking.find(rk => rk.estrategia.toLowerCase() === r.juegos.estrategia.toLowerCase());

                return (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'middle' }}>
                    <td style={{ padding: '0.75rem', textTransform: 'capitalize', fontWeight: 600 }}>{r.juegos.estrategia}</td>
                    <td style={{ padding: '0.75rem' }}>
                       {r.acierto_superbalota ? <span className="badge-tag badge-green">✓</span> : <span style={{opacity: 0.3}}>—</span>}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                        {playNums.map((n, idx) => (
                           <span key={idx} style={{
                             color: matches.includes(n) ? '#10b981' : 'inherit',
                             fontWeight: matches.includes(n) ? 700 : 400,
                             background: matches.includes(n) ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                             padding: '0 2px',
                             borderRadius: '2px'
                           }}>
                             {n}
                           </span>
                        ))}
                        <span style={{ color: '#fbbf24', fontWeight: 600 }}>+{r.juegos.num6}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge-tag ${r.aciertos_principales >= 3 ? 'badge-primary' : 'badge-neutral'}`} style={{ fontSize: '0.7rem' }}>
                        {r.aciertos_principales}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', borderLeft: '2px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.02)' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.75rem' }}>{rankData?.promedio || '—'}</span>
                    </td>
                    <td style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)' }}>
                      <span style={{ color: rankData && rankData.sb > 0 ? '#fbbf24' : 'inherit', fontSize: '0.75rem' }}>{rankData?.sb || '—'}</span>
                    </td>
                    <td style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', opacity: 0.7, fontSize: '0.75rem' }}>
                      {rankData?.total || '—'}
                    </td>
                    <td style={{ padding: '0.75rem', borderLeft: '2px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.03)' }}>
                      {(() => {
                        const gameData = nextGames.find(g => g.estrategia.toLowerCase() === r.juegos.estrategia.toLowerCase());
                        return gameData ? (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                            {[gameData.num1, gameData.num2, gameData.num3, gameData.num4, gameData.num5].map((n, idx) => (
                              <span key={idx} style={{ opacity: 0.9 }}>{n}</span>
                            ))}
                            <span style={{ color: '#fbbf24', fontWeight: 700 }}>+{gameData.num6}</span>
                          </div>
                        ) : <span style={{ opacity: 0.3 }}>—</span>;
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>



    </main>
  );
}
