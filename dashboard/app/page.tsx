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
  Sparkles
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
           <Sparkles style={{ color: '#fbbf24' }} size={32} />
           <h1>CONTOLTO v2 Professional</h1>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', fontWeight: 300 }}>
           Estrategias de IA & Análisis de Rendimiento Predictivo
        </p>
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

      {/* Detailed Table Section (Reporte Detallado v2) */}
      <section className="card animate-in" style={{ animationDelay: '0.4s', marginBottom: '1.5rem' }}>
          <div className="card-title" style={{ color: 'white', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} /> Reporte detallado de Rendimiento - Contolto V2
             </div>
             <span style={{ fontSize: '0.8rem', opacity: 0.6, background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                ÚLTIMO JUEGO INTEGRADO: {detailedRecent.length > 0 ? formatDate(detailedRecent[0].juegos.fecha_sorteo) : '---'}
             </span>
          </div>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: '#94a3b8', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>Estrategia</th>
                  <th style={{ padding: '1rem' }}>S.B.</th>
                  <th style={{ padding: '1rem' }}>Jugada (IA)</th>
                  <th style={{ padding: '1rem' }}>Ganadora (Historial)</th>
                  <th style={{ padding: '1rem' }}>Aciertos</th>
                </tr>
              </thead>
              <tbody>
                {detailedRecent.map((r, i) => {
                  const playNums = r.juegos ? [r.juegos.num1, r.juegos.num2, r.juegos.num3, r.juegos.num4, r.juegos.num5] : [];
                  const winNums = r.winner ? [r.winner.num1, r.winner.num2, r.winner.num3, r.winner.num4, r.winner.num5] : [];
                  const matches = getMatchedNumbers(playNums, winNums);
                  
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'middle' }}>
                      <td style={{ padding: '1rem', textTransform: 'capitalize', fontWeight: 600 }}>{r.juegos.estrategia}</td>
                      <td style={{ padding: '1rem' }}>
                         {r.acierto_superbalota ? <span className="badge-tag badge-green">OK</span> : <span style={{opacity: 0.3}}>NO</span>}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {playNums.map((n, idx) => (
                             <span key={idx} style={{ 
                               color: matches.includes(n) ? '#10b981' : 'inherit', 
                               fontWeight: matches.includes(n) ? 700 : 400,
                               background: matches.includes(n) ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                               padding: '0 4px',
                               borderRadius: '2px'
                             }}>
                               {n}{idx < 4 ? ',' : ''}
                             </span>
                          ))}
                          <span style={{ color: '#fbbf24', fontWeight: 600 }}> + {r.juegos.num6}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {r.winner ? (
                           <div style={{ opacity: 0.7 }}>
                             [{winNums.join(', ')}] + {r.winner.num6}
                           </div>
                        ) : '--'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`badge-tag ${r.aciertos_principales >= 3 ? 'badge-primary' : 'badge-neutral'}`}>
                          {r.aciertos_principales} aciertos
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
      </section>

      {/* Grid of Tables Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <section className="card animate-in" style={{ animationDelay: '0.5s' }}>
          <div className="card-title" style={{ color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <History size={18} /> Ranking de Estrategias - All Time
          </div>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: '#94a3b8', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Estrategia</th>
                  <th style={{ padding: '0.75rem' }}>Promedio Aciertos</th>
                  <th style={{ padding: '0.75rem' }}>S.B. Ganadas</th>
                  <th style={{ padding: '0.75rem' }}>Total Juegos</th>
                </tr>
              </thead>
              <tbody>
                {strategyRanking.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem', textTransform: 'capitalize', fontWeight: 600 }}>{r.estrategia}</td>
                    <td style={{ padding: '0.75rem' }}>
                       <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{r.promedio}</span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                       <span style={{ color: r.sb > 0 ? '#fbbf24' : 'inherit' }}>{r.sb}</span>
                    </td>
                    <td style={{ padding: '0.75rem', opacity: 0.6 }}>{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card animate-in" style={{ animationDelay: '0.6s' }}>
          <div className="card-title" style={{ color: 'white', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={18} /> Próximos Números Recomendados
             </div>
             <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                OBJETIVO: {nextGames.length > 0 ? formatDate(nextGames[0].fecha_sorteo) : '---'}
             </span>
          </div>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: '#94a3b8', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Estrategia</th>
                  <th style={{ padding: '0.75rem' }}>Jugada Recomendada</th>
                </tr>
              </thead>
              <tbody>
                {nextGames.map((g, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem', textTransform: 'capitalize', fontWeight: 600 }}>{g.estrategia}</td>
                    <td style={{ padding: '0.75rem' }}>
                       <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                          {[g.num1, g.num2, g.num3, g.num4, g.num5].map((n, idx) => (
                            <span key={idx} style={{ opacity: 0.9 }}>{n}{idx < 4 ? ',' : ''}</span>
                          ))}
                          <span style={{ color: '#fbbf24', fontWeight: 700 }}> + {g.num6}</span>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '0.7rem', marginTop: '1rem', fontStyle: 'italic', opacity: 0.5 }}>
            * Estos números representan la predicción optimizada para el siguiente sorteo.
          </p>
        </section>
      </div>


    </main>
  );
}
