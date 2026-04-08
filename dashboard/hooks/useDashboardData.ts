import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Sorteo, RendimientoDetallado } from '../types';
import { formatDateShort } from '../lib/utils';

export function useDashboardData() {
  const [lastSorteo, setLastSorteo] = useState<Sorteo | null>(null);
  const [bestStrategy, setBestStrategy] = useState<string>('Calculando...');
  const [realStrategyEntry, setRealStrategyEntry] = useState<RendimientoDetallado | null>(null);
  const [loading, setLoading] = useState(true);
  const [strategyRanking, setStrategyRanking] = useState<any[]>([]);
  const [detailedRecent, setDetailedRecent] = useState<RendimientoDetallado[]>([]);
  const [nextGames, setNextGames] = useState<any[]>([]);
  const [balotoJackpot, setBalotoJackpot] = useState<string>('...');
  const [realStats, setRealStats] = useState({ total: 0, avg: 0, sb: 0, sbAvg: 0 });
  const [aleatoriaStats, setAleatoriaStats] = useState({ total: 0, avg: 0, sb: 0, sbAvg: 0 });
  const [unicaStats, setUnicaStats] = useState({ total: 0, avg: 0, sb: 0, sbAvg: 0 });
  const [compareData, setCompareData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [cumulativeData, setCumulativeData] = useState<any[]>([]);
  const [numberStats, setNumberStats] = useState<any[]>([]);
  const [sbStats, setSbStats] = useState<any[]>([]);
  const [engineDistribution, setEngineDistribution] = useState<any[]>([]);
  const [lastSorteosHistory, setLastSorteosHistory] = useState<any[]>([]);
  const [topPairs, setTopPairs] = useState<any[]>([]);
  const [topTrios, setTopTrios] = useState<any[]>([]);
  const [selectedCompanionNum, setSelectedCompanionNum] = useState<number | null>(null);
  const [affinityLinks, setAffinityLinks] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({ superiority: 0, efficiency: 0, consistency: 0 });

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
        const { data: sorteoData, error: err1 } = await supabase
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

        let allRankData: any[] = [];
        let from = 0;
        let to = 999;
        let hasMore = true;

        while (hasMore && allRankData.length < 25000) {
          const { data, error } = await supabase
            .from('rendimiento')
            .select('aciertos_principales, acierto_superbalota, created_at, juegos(estrategia, fecha_sorteo, num1, num2, num3, num4, num5, num6)')
            .order('created_at', { ascending: false })
            .order('id', { ascending: false })
            .range(from, to);

          if (error) break;
          if (data && data.length > 0) {
            allRankData = [...allRankData, ...data];
            from += 1000;
            to += 1000;
            if (data.length < 1000) hasMore = false;
          } else {
             hasMore = false;
          }
        }
        const rankData = allRankData;

        if (rankData.length > 0) {
           const stats: any = {};
           rankData.forEach((item: any) => {
              const j = Array.isArray(item.juegos) ? item.juegos[0] : item.juegos;
              const est = (j?.estrategia || '').toLowerCase().trim();
              if (est) {
                 if (!stats[est]) stats[est] = [];
                 stats[est].push(item.aciertos_principales);
              }
           });
           
           let best = 'Caliente';
           let maxAvg = -1;
           Object.entries(stats).forEach(([name, values]: [string, any]) => {
              const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
              if (avg > maxAvg) {
                  maxAvg = avg;
                  best = name.charAt(0).toUpperCase() + name.slice(1);
              }
           });
           setBestStrategy(best);
        }
        
        const realHits = rankData.filter((item: any) => {
          const j = Array.isArray(item.juegos) ? item.juegos[0] : item.juegos;
          return j?.estrategia?.toLowerCase() === 'real';
        });
        const unicaHits = rankData.filter((item: any) => {
          const j = Array.isArray(item.juegos) ? item.juegos[0] : item.juegos;
          const est = j?.estrategia?.toLowerCase() || '';
          return est === 'unica' || est === 'única';
        });
        const aleatoriaHits = rankData.filter((item: any) => {
          const j = Array.isArray(item.juegos) ? item.juegos[0] : item.juegos;
          const est = (j?.estrategia || '').toLowerCase().trim();
          return est.includes('aleatoria') || est.includes('azar');
        });
        
        const getWindowsStats = (hitsArray: any[], windowSize: number = 24) => {
           const byDate: Record<string, any[]> = {};
           hitsArray.forEach(h => {
             const j = Array.isArray(h.juegos) ? h.juegos[0] : h.juegos;
             const f = j?.fecha_sorteo || 'no-date';
             if (!byDate[f]) byDate[f] = [];
             byDate[f].push(h);
           });
           
           const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a)).slice(0, windowSize);
           const subset: any[] = [];
           sortedDates.forEach(d => subset.push(...byDate[d]));
           
           let totalScore = 0;
           let totalSB = 0;
           const dist = [0,0,0,0,0,0];
           
           subset.forEach(h => {
              const s = (h.aciertos_principales || 0) + (h.acierto_superbalota ? 1 : 0);
              totalScore += s;
              if (h.acierto_superbalota) totalSB++;
              if (h.aciertos_principales < 6) dist[h.aciertos_principales]++;
           });
           
           return {
              avg: subset.length > 0 ? totalScore / subset.length : 0,
              sbCount: totalSB,
              sbAvg: subset.length > 0 ? totalSB / subset.length : 0,
              dist: dist,
              count: subset.length
           };
        };

        const winReal = getWindowsStats(realHits, 24);
        const winUnica = getWindowsStats(unicaHits, 24);
        const winAlea = getWindowsStats(aleatoriaHits, 24); 
        
        let realAssigned = false;
        if (latestWinner) {
          const exactReal = realHits.find((h: any) => {
            const j = Array.isArray(h.juegos) ? h.juegos[0] : h.juegos;
            return j?.fecha_sorteo === latestWinner.fecha;
          });

          if (exactReal) {
            const j = Array.isArray(exactReal.juegos) ? exactReal.juegos[0] : exactReal.juegos;
            setRealStrategyEntry({ ...exactReal, juegos: j });
            realAssigned = true; 
          }
        }

        if (!realAssigned && latestWinner) {
           const { data: realJuegoData } = await supabase
             .from('juegos')
             .select('*')
             .ilike('estrategia', 'real')
             .eq('fecha_sorteo', latestWinner.fecha)
             .order('id', { ascending: false })
             .limit(1);

           if (realJuegoData && realJuegoData.length > 0) {
             const j = realJuegoData[0];
             const winNums = [latestWinner.num1, latestWinner.num2, latestWinner.num3, latestWinner.num4, latestWinner.num5];
             const playNums = [j.num1, j.num2, j.num3, j.num4, j.num5];
             const matching = playNums.filter(n => winNums.includes(n)).length;
             const sbMatch = j.num6 === latestWinner.num6;
             
             setRealStrategyEntry({
               aciertos_principales: matching,
               acierto_superbalota: sbMatch,
               juegos: j
             });
             realAssigned = true;
           }
        }

        if (!realAssigned && realHits.length > 0) {
          const latestReal = realHits[0];
          const j = Array.isArray(latestReal.juegos) ? latestReal.juegos[0] : latestReal.juegos;
          setRealStrategyEntry({ ...latestReal, juegos: j });
        }

        setRealStats({
          total: realHits.length,
          avg: winReal.avg,
          sb: winReal.sbCount, 
          sbAvg: winReal.sbAvg
        });
        setUnicaStats({
          total: unicaHits.length,
          avg: winUnica.avg,
          sb: winUnica.sbCount, 
          sbAvg: winUnica.sbAvg
        });
        setAleatoriaStats({
          total: aleatoriaHits.length,
          avg: winAlea.avg,
          sb: winAlea.sbCount, 
          sbAvg: winAlea.sbAvg
        });

        const labels = ['0 Ac', '1 Ac', '2 Ac', '3 Ac', '4 Ac', '5 Ac', 'SB'];
        const totalR = winReal.count || 1;
        const totalU = winUnica.count || 1;
        const totalA = winAlea.count || 1;

        const combined = labels.map((label, i) => {
          if (label === 'SB') {
            return { 
              name: label, 
              real: (winReal.sbCount/totalR)*100, realCount: winReal.sbCount,
              unica: (winUnica.sbCount/totalU)*100, unicaCount: winUnica.sbCount,
              aleatoria: (winAlea.sbCount/totalA)*100, aleatoriaCount: winAlea.sbCount
            };
          }
          return {
            name: label,
            real: (winReal.dist[i]/totalR)*100, realCount: winReal.dist[i],
            unica: (winUnica.dist[i]/totalU)*100, unicaCount: winUnica.dist[i],
            aleatoria: (winAlea.dist[i]/totalA)*100, aleatoriaCount: winAlea.dist[i]
          };
        });
        setCompareData(combined);

        const globalAgg: Record<string, { t: number, s: number }> = {};
        rankData.forEach((item: any) => {
          const juego = Array.isArray(item.juegos) ? item.juegos[0] : item.juegos;
          const e = juego?.estrategia || item.estrategia_nombre || 'DESCONOCIDA';
          
          if(e) { 
            let key = e.toLowerCase().trim();
            if(key === 'única') key = 'unica';
            if(!globalAgg[key]) globalAgg[key]={t:0,s:0}; 
            globalAgg[key].t++; 
            globalAgg[key].s += (item.aciertos_principales || 0) + (item.acierto_superbalota ? 1 : 0); 
          }
        });

        const ranked = Object.entries(globalAgg)
          .filter(([name]) => name !== 'desconocida')
          .map(([name, v]) => {
            const upperName = name.toUpperCase();
            return {
              name: upperName,
              avg: v.s / v.t,
              total: v.t
            };
          })
          .sort((a, b) => b.avg - a.avg);
        
        setStrategyRanking(ranked);
        if (ranked.length > 0) {
          setBestStrategy(ranked[0].name);
          
          const labelsDist = ['0 Ac', '1 Ac', '2 Ac', '3 Ac', '4 Ac', '5 Ac', 'SB'];
          const getDistWithCounts = (strategyName: string) => {
            const hits = rankData.filter((item: any) => {
              const j = Array.isArray(item.juegos) ? item.juegos[0] : item.juegos;
              let est = (j?.estrategia || '').toLowerCase().trim();
              if (est === 'única') est = 'unica';
              if (strategyName === 'azar') return est.includes('aleatoria') || est.includes('azar');
              return est === strategyName;
            });
            const counts = [0,0,0,0,0,0,0];
            hits.forEach(h => {
              if (h.aciertos_principales >= 0 && h.aciertos_principales <= 5) counts[h.aciertos_principales]++;
              if (h.acierto_superbalota) counts[6]++;
            });
            const total = hits.length || 1;
            return {
              avgs: counts.map(c => (c / total) * 100),
              counts: counts
            };
          };

          const balanceada = getDistWithCounts('balanceada');
          const caliente = getDistWithCounts('caliente');
          const elite = getDistWithCounts('elite');
          const fria = getDistWithCounts('fria');
          const mixta = getDistWithCounts('mixta');
          const afinidad = getDistWithCounts('afinidad');

          const engineDistData = labelsDist.map((label, i) => ({
            aciertos: label,
            Balanceada: balanceada.avgs[i],
            BalanceadaCount: balanceada.counts[i],
            Caliente: caliente.avgs[i],
            CalienteCount: caliente.counts[i],
            Elite: elite.avgs[i],
            EliteCount: elite.counts[i],
            Fria: fria.avgs[i],
            FriaCount: fria.counts[i],
            Mixta: mixta.avgs[i],
            MixtaCount: mixta.counts[i],
            Afinidad: afinidad.avgs[i],
            AfinidadCount: afinidad.counts[i],
            isSB: label === 'SB'
          }));
          setEngineDistribution(engineDistData);
        }

        const trendMap: Record<string, any> = {};
        rankData.forEach((item: any) => {
          const j = Array.isArray(item.juegos) ? item.juegos[0] : item.juegos;
          const rawFechaRaw = j?.fecha_sorteo || item.created_at;
          if (!rawFechaRaw) return;
          
          const dObj = new Date(rawFechaRaw);
          const rawDate = dObj.getTime();
          const dateStr = dObj.toISOString().split('T')[0];

          if (!trendMap[dateStr]) {
            trendMap[dateStr] = { 
              dateLabel: formatDateShort(dateStr),
              rawDate: rawDate,
              stats: {} as Record<string, number[]>
            };
          }
          
          let est = (j?.estrategia || '').toLowerCase().trim();
          if (est === 'única') est = 'unica';
          
          const hits = (item.aciertos_principales || 0) + (item.acierto_superbalota ? 1 : 0);
          if (!trendMap[dateStr].stats[est]) trendMap[dateStr].stats[est] = [];
          trendMap[dateStr].stats[est].push(hits);
        });

        const finalTrend = Object.values(trendMap)
          .sort((a:any, b:any) => a.rawDate - b.rawDate)
          .map((t:any) => {
            const row: any = { date: t.dateLabel };
            
            Object.entries(t.stats).forEach(([name, hits]: [string, any]) => {
              const avg = hits.reduce((a:number, b:number) => a + b, 0) / hits.length;
              row[name] = avg;
              
              if (name === 'aleatoria') {
                row.alea_min = Math.min(...hits);
                row.alea_max = Math.max(...hits);
                row.alea_range = [row.alea_min, row.alea_max];
                row.alea_avg = avg;
              }
            });

            const realHitsArr = t.stats['real'] || [];
            const aleaHitsArr = t.stats['aleatoria'] || [];
            
            if (realHitsArr.length > 0 && aleaHitsArr.length > 0) {
              const realVal = realHitsArr[0];
              const totalAlea = aleaHitsArr.length;
              const beaten = aleaHitsArr.filter((h: number) => h < realVal).length;
              const tied = aleaHitsArr.filter((h: number) => h === realVal).length;
              row.superiority = ((beaten + (tied * 0.5)) / totalAlea) * 100;
              row.efficiency = row.alea_avg > 0 ? (realVal / row.alea_avg) : 0;
            } else {
              row.superiority = 0;
              row.efficiency = 0;
            }

            return row;
          })
          .slice(-20);
        
        setTrendData(finalTrend);

        // Calculate aggregate performance metrics
        if (finalTrend.length > 0) {
          const avgSup = finalTrend.reduce((acc, curr) => acc + curr.superiority, 0) / finalTrend.length;
          const avgEff = finalTrend.reduce((acc, curr) => acc + curr.efficiency, 0) / finalTrend.length;
          const consistentDays = finalTrend.filter(t => t.efficiency >= 1).length;
          const consistency = (consistentDays / finalTrend.length) * 100;

          setPerformanceMetrics({
            superiority: avgSup,
            efficiency: avgEff,
            consistency: consistency
          });
        }

        const totalSums: Record<string, { sum: number, total: number }> = {};
        const cumulativeTrend = Object.values(trendMap)
          .sort((a: any, b: any) => a.rawDate - b.rawDate)
          .map((t: any) => {
            const row: any = { date: t.dateLabel };
            Object.entries(t.stats).forEach(([name, hits]: [string, any]) => {
              if (!totalSums[name]) totalSums[name] = { sum: 0, total: 0 };
              totalSums[name].sum += (hits as number[]).reduce((a, b) => a + b, 0);
              totalSums[name].total += (hits as number[]).length;
              row[name] = totalSums[name].sum / totalSums[name].total;
            });
            Object.keys(totalSums).forEach(name => {
              if (row[name] === undefined) {
                row[name] = totalSums[name].sum / totalSums[name].total;
              }
            });
            return row;
          })
          .slice(-30);
        
        setCumulativeData(cumulativeTrend);

        let allFutureGames: any[] = [];
        let f_from = 0;
        let f_to = 999;
        let f_hasMore = true;

        while (f_hasMore && allFutureGames.length < 5000) {
          const { data, error } = await supabase
            .from('juegos')
            .select('*')
            .order('created_at', { ascending: false })
            .range(f_from, f_to);

          if (error) break;
          if (data && data.length > 0) {
            allFutureGames = [...allFutureGames, ...data];
            if (data.length < 1000) f_hasMore = false;
            f_from += 1000;
            f_to += 1000;
          } else {
            f_hasMore = false;
          }
        }
        
        if (allFutureGames.length > 0) {
           const mostRecentDate = allFutureGames[0].fecha_sorteo;
           const gamesToPlay = allFutureGames.filter(g => g.fecha_sorteo === mostRecentDate);
           setNextGames(gamesToPlay);
        }

        const { data: fullHistory } = await supabase
          .from('historial')
          .select('num1, num2, num3, num4, num5, num6, fecha')
          .eq('tipo', 'Baloto')
          .order('fecha', { ascending: false })
          .limit(200);

        if (fullHistory) {
            setLastSorteosHistory(fullHistory);
            
            const stats = Array.from({length: 43}, (_, i) => {
              const num = i + 1;
              // Buscamos cuántas veces ha sido jugado por la IA "Real"
              const playedByIA = rankData.filter((item: any) => {
                const j = Array.isArray(item.juegos) ? item.juegos[0] : item.juegos;
                return (j?.estrategia || '').toLowerCase() === 'real' && 
                       [j.num1, j.num2, j.num3, j.num4, j.num5].includes(num);
              }).length;
              
              const totalRealGames = rankData.filter((item: any) => {
                const j = Array.isArray(item.juegos) ? item.juegos[0] : item.juegos;
                return (j?.estrategia || '').toLowerCase() === 'real';
              }).length || 1;

              return { 
                num, 
                count: 0, 
                last: -1, 
                rawLast: 0,
                lastSeen: 'Nunca',
                avgGap: 0,
                precision: ((playedByIA / totalRealGames) * 100).toFixed(1),
                totalPlayed: playedByIA,
                nextEst: 'Calculando...',
                status: 'FRÍO'
              };
            });

            fullHistory.forEach((s, idx) => {
              [s.num1, s.num2, s.num3, s.num4, s.num5].forEach(n => {
                const stat = stats[n - 1];
                if (stat) {
                  stat.count++;
                  if (stat.last === -1) {
                    stat.last = idx;
                    stat.rawLast = idx;
                    stat.lastSeen = idx === 0 ? '¡Hoy!' : `Hace ${idx} sorteos`;
                  }
                }
              });
            });

            // Post-procesamiento de stats
            stats.forEach(s => {
              s.avgGap = s.count > 0 ? Math.round(fullHistory.length / s.count) : 200;
              
              // Lógica de Estado
              if (s.rawLast <= 5 && s.count > 15) s.status = 'CALIENTE';
              else if (s.rawLast > 15) s.status = 'FRÍO';
              else s.status = 'LATENTE';

              // Estimación Próxima
              const urgency = s.rawLast / (s.avgGap || 1);
              if (urgency > 1.2) s.nextEst = 'Próximamente (Alta Prob)';
              else if (urgency > 0.8) s.nextEst = 'En ventana de salida';
              else s.nextEst = 'En espera';
            });

            setNumberStats(stats);

            const sbASt = Array.from({length: 16}, (_, i) => {
              const num = i + 1;
              const playedByIA = rankData.filter((item: any) => {
                const j = Array.isArray(item.juegos) ? item.juegos[0] : item.juegos;
                return (j?.estrategia || '').toLowerCase() === 'real' && j.num6 === num;
              }).length;
              
              const totalRealGames = rankData.filter((item: any) => {
                const j = Array.isArray(item.juegos) ? item.juegos[0] : item.juegos;
                return (j?.estrategia || '').toLowerCase() === 'real';
              }).length || 1;

              return { 
                num, 
                count: 0, 
                last: -1, 
                rawLast: 0,
                lastSeen: 'Nunca',
                avgGap: 0,
                precision: ((playedByIA / totalRealGames) * 100).toFixed(1),
                totalPlayed: playedByIA,
                nextEst: 'En espera',
                status: 'LATENTE'
              };
            });

            fullHistory.forEach((s, idx) => {
              const n = s.num6;
              const stat = sbASt[n - 1];
              if (stat) {
                stat.count++;
                if (stat.last === -1) {
                  stat.last = idx;
                  stat.rawLast = idx;
                  stat.lastSeen = idx === 0 ? '¡Hoy!' : `Hace ${idx} sorteos`;
                }
              }
            });

            // Post-procesamiento de sbStats
            sbASt.forEach(s => {
              s.avgGap = s.count > 0 ? Math.round(fullHistory.length / s.count) : 200;
              
              if (s.rawLast <= 10 && s.count > 12) s.status = 'CALIENTE';
              else if (s.rawLast > 25) s.status = 'FRÍO';
              else s.status = 'LATENTE';

              const urgency = s.rawLast / (s.avgGap || 1);
              if (urgency > 1.2) s.nextEst = 'Próximamente';
              else if (urgency > 0.8) s.nextEst = 'En ventana';
              else s.nextEst = 'En espera';
            });
            setSbStats(sbASt);

            const pairCounts: Record<string, number> = {};
            const trioCounts: Record<string, number> = {};

            fullHistory.forEach((s: any) => {
              const nums = [s.num1, s.num2, s.num3, s.num4, s.num5].sort((a,b) => a-b);
              for(let i=0; i<nums.length; i++) {
                for(let j=i+1; j<nums.length; j++) {
                  const key = `${nums[i]}-${nums[j]}`;
                  pairCounts[key] = (pairCounts[key] || 0) + 1;
                }
              }
              for(let i=0; i<nums.length; i++) {
                for(let j=i+1; j<nums.length; j++) {
                  for(let k=j+1; k<nums.length; k++) {
                    const key = `${nums[i]}-${nums[j]}-${nums[k]}`;
                    trioCounts[key] = (trioCounts[key] || 0) + 1;
                  }
                }
              }
            });

            setTopPairs(Object.entries(pairCounts).map(([key, count]) => ({ nums: key.split('-').map(Number), count })).sort((a,b) => b.count - a.count).slice(0, 10));
            setTopTrios(Object.entries(trioCounts).map(([key, count]) => ({ nums: key.split('-').map(Number), count })).sort((a,b) => b.count - a.count).slice(0, 5));
            setAffinityLinks(Object.entries(pairCounts).filter(([, count]) => count >= 3).map(([key, count]) => {
                const [a, b] = key.split('-').map(Number);
                return { a, b, count };
            }));
        }

      } catch (err) {
        console.error("CRITICAL DASHBOARD ERROR:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const clusterAnalysis = useMemo(() => {
    if (!selectedCompanionNum || lastSorteosHistory.length === 0) return null;

    const friendsMap: Record<number, number> = {};
    lastSorteosHistory.forEach(s => {
      const row = [s.num1, s.num2, s.num3, s.num4, s.num5];
      if (row.includes(selectedCompanionNum)) {
        row.filter(n => n !== selectedCompanionNum).forEach(n => {
          friendsMap[n] = (friendsMap[n] || 0) + 1;
        });
      }
    });

    const friendsList = Object.entries(friendsMap)
      .sort((a,b) => b[1] - a[1])
      .slice(0, 4)
      .map(([n]) => Number(n));

    const cluster = [selectedCompanionNum, ...friendsList];

    let combo3 = 0, combo4 = 0, combo5 = 0;
    lastSorteosHistory.forEach(s => {
      const row = [s.num1, s.num2, s.num3, s.num4, s.num5];
      const intersect = cluster.filter(n => row.includes(n)).length;
      if (intersect === 3) combo3++;
      if (intersect === 4) combo4++;
      if (intersect === 5) combo5++;
    });

    const evens = cluster.filter(n => n % 2 === 0).length;
    const odds = cluster.length - evens;
    const ranges = { r1: 0, r2: 0, r3: 0, r4: 0 };
    cluster.forEach(n => {
      if (n <= 11) ranges.r1++;
      else if (n <= 22) ranges.r2++;
      else if (n <= 33) ranges.r3++;
      else ranges.r4++;
    });

    const sbMap: Record<number, number> = {};
    lastSorteosHistory.forEach(s => {
      const row = [s.num1, s.num2, s.num3, s.num4, s.num5];
      if (row.includes(selectedCompanionNum)) {
        sbMap[s.num6] = (sbMap[s.num6] || 0) + 1;
      }
    });
    const superballAffinities = Object.entries(sbMap)
      .sort((a,b) => b[1] - a[1])
      .slice(0, 3)
      .map(([n, count]) => ({ num: Number(n), count }));

    return {
      cluster,
      friends: friendsList,
      pairHits: friendsMap,
      combos: { combo3, combo4, combo5 },
      chemistry: { evens, odds, ranges },
      totalWins: combo3 + combo4 + combo5,
      superballAffinities
    };
  }, [selectedCompanionNum, lastSorteosHistory]);

  return {
    lastSorteo,
    bestStrategy,
    realStrategyEntry,
    loading,
    strategyRanking,
    nextGames,
    balotoJackpot,
    realStats,
    aleatoriaStats,
    unicaStats,
    compareData,
    trendData,
    cumulativeData,
    numberStats,
    sbStats,
    engineDistribution,
    topPairs,
    topTrios,
    selectedCompanionNum,
    setSelectedCompanionNum,
    affinityLinks,
    clusterAnalysis,
    performanceMetrics
  };
}
