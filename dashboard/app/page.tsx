'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';
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
  Share2
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
  const [realDist, setRealDist] = useState<any[]>([]);
  const [realStats, setRealStats] = useState({ total: 0, avg: 0, sb: 0, sbAvg: 0 });
  const [aleatoriaStats, setAleatoriaStats] = useState({ total: 0, avg: 0, sb: 0, sbAvg: 0 });
  const [unicaStats, setUnicaStats] = useState({ total: 0, avg: 0, sb: 0, sbAvg: 0 });
  const [compareData, setCompareData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [cumulativeData, setCumulativeData] = useState<any[]>([]);
  const [numberStats, setNumberStats] = useState<any[]>([]);
  const [sbStats, setSbStats] = useState<any[]>([]);
  const [lastSorteosHistory, setLastSorteosHistory] = useState<any[]>([]);
  const [topPairs, setTopPairs] = useState<any[]>([]);
  const [topTrios, setTopTrios] = useState<any[]>([]);
  const [selectedCompanionNum, setSelectedCompanionNum] = useState<number | null>(null);
  const [affinityLinks, setAffinityLinks] = useState<any[]>([]);
  // NUEVO: Análisis de Cluster (Número seleccionado + 4 mejores amigos)
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

    // Frecuencia e Combinaciones
    let combo3 = 0, combo4 = 0, combo5 = 0;
    lastSorteosHistory.forEach(s => {
      const row = [s.num1, s.num2, s.num3, s.num4, s.num5];
      const intersect = cluster.filter(n => row.includes(n)).length;
      if (intersect === 3) combo3++;
      if (intersect === 4) combo4++;
      if (intersect === 5) combo5++;
    });

    // Distribución Química
    const evens = cluster.filter(n => n % 2 === 0).length;
    const odds = cluster.length - evens;
    const ranges = { r1: 0, r2: 0, r3: 0, r4: 0 };
    cluster.forEach(n => {
      if (n <= 11) ranges.r1++;
      else if (n <= 22) ranges.r2++;
      else if (n <= 33) ranges.r3++;
      else ranges.r4++;
    });

    const totalWins = combo3 + combo4 + combo5;

    // NUEVO: Afinidad con Superbalotas
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
      totalWins,
      superballAffinities
    };
  }, [selectedCompanionNum, lastSorteosHistory]);

  const [activeTab, setActiveTab] = useState<'resultados' | 'historico' | 'analisis' | 'comportamiento'>('resultados');

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
      console.log("DASHBOARD: Iniciando carga de datos...");
      setLoading(true);
      try {
        // 1. Último sorteo ganador
        console.log("DASHBOARD [1/6]: Consultando historial...");
        const { data: sorteoData, error: err1 } = await supabase
          .from('historial')
          .select('*')
          .eq('tipo', 'Baloto')
          .order('fecha', { ascending: false })
          .limit(1);
        
        if (err1) console.error("Error Paso 1:", err1);
        let latestWinner: Sorteo | null = null;
        if (sorteoData && sorteoData.length > 0) {
          latestWinner = sorteoData[0];
          setLastSorteo(latestWinner);
        }

        // 2. Mejor estrategia (last 20)
        console.log("DASHBOARD [2/6]: Consultando mejor estrategia...");
        const { data: rendData, error: err2 } = await supabase
          .from('rendimiento')
          .select(`
            aciertos_principales,
            juegos ( estrategia )
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        if (err2) console.error("Error Paso 2:", err2);
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

        // 4. Ranking (Con paginación para superar el límite de 1,000 de Supabase)
        console.log("DASHBOARD [4/6]: Descargando datos masivos (paginado)...");
        let allRankData: any[] = [];
        let from = 0;
        let to = 999;
        let hasMore = true;

        while (hasMore && allRankData.length < 5000) { // Límite de seguridad
          const { data, error } = await supabase
            .from('rendimiento')
            .select('aciertos_principales, acierto_superbalota, created_at, juegos(estrategia, fecha_sorteo, num1, num2, num3, num4, num5, num6)')
            .order('created_at', { ascending: false })
            .range(from, to);

          if (error) {
             console.error("Error en paginación:", error);
             break;
          }
          if (data && data.length > 0) {
            allRankData = [...allRankData, ...data];
            if (data.length < 1000) hasMore = false;
            from += 1000;
            to += 1000;
          } else {
            hasMore = false;
          }
        }
             const rankData = allRankData;
        if (rankData && rankData.length > 0) {
          // Filtrado de las tres estrategias clave
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
            return j?.estrategia?.toLowerCase() === 'aleatoria';
          });
          console.log(`DASHBOARD: Encontrados ${realHits.length} Real, ${unicaHits.length} Única, ${aleatoriaHits.length} Aleatoria.`);

          // Distribuciones y conteos de Superbalota
          const distR = [0,0,0,0,0,0]; let sbR = 0;
          realHits.forEach((h: any) => { if(h.aciertos_principales < 6) distR[h.aciertos_principales]++; if(h.acierto_superbalota) sbR++; });
          
          const distU = [0,0,0,0,0,0]; let sbU = 0;
          unicaHits.forEach((h: any) => { if(h.aciertos_principales < 6) distU[h.aciertos_principales]++; if(h.acierto_superbalota) sbU++; });
          
          const distA = [0,0,0,0,0,0]; let sbA = 0;
          aleatoriaHits.forEach((h: any) => { if(h.aciertos_principales < 6) distA[h.aciertos_principales]++; if(h.acierto_superbalota) sbA++; });

          // Actualizar Estados de Estadísticas (Ahorro unificado 0-6)
          setRealStats({
            total: realHits.length,
            avg: realHits.length > 0 ? (realHits.reduce((a: number, b: any) => a + (b.aciertos_principales + (b.acierto_superbalota ? 1 : 0)), 0) / realHits.length) : 0,
            sb: sbR, 
            sbAvg: realHits.length > 0 ? (sbR / realHits.length) : 0
          });
          setUnicaStats({
            total: unicaHits.length,
            avg: unicaHits.length > 0 ? (unicaHits.reduce((a: number, b: any) => a + (b.aciertos_principales + (b.acierto_superbalota ? 1 : 0)), 0) / unicaHits.length) : 0,
            sb: sbU, 
            sbAvg: unicaHits.length > 0 ? (sbU / unicaHits.length) : 0
          });
          setAleatoriaStats({
            total: aleatoriaHits.length,
            avg: aleatoriaHits.length > 0 ? (aleatoriaHits.reduce((a: number, b: any) => a + (b.aciertos_principales + (b.acierto_superbalota ? 1 : 0)), 0) / aleatoriaHits.length) : 0,
            sb: sbA, 
            sbAvg: aleatoriaHits.length > 0 ? (sbA / aleatoriaHits.length) : 0
          });

          // Preparar datos para la gráfica (Porcentajes)
          const labels = ['0 Ac', '1 Ac', '2 Ac', '3 Ac', '4 Ac', '5 Ac', 'SB'];
          const totalR = realHits.length || 1;
          const totalU = unicaHits.length || 1;
          const totalA = aleatoriaHits.length || 1;

          const combined = labels.map((label, i) => {
            if (label === 'SB') {
              return { 
                name: label, 
                real: (sbR/totalR)*100, realCount: sbR,
                unica: (sbU/totalU)*100, unicaCount: sbU,
                aleatoria: (sbA/totalA)*100, aleatoriaCount: sbA
              };
            }
            return {
              name: label,
              real: (distR[i]/totalR)*100, realCount: distR[i],
              unica: (distU[i]/totalU)*100, unicaCount: distU[i],
              aleatoria: (distA[i]/totalA)*100, aleatoriaCount: distA[i]
            };
          });
          setCompareData(combined);

          // NUEVO: Ranking Global de TODAS las estrategias (Leaderboard) - REFORZADO
          const globalAgg: Record<string, { t: number, s: number }> = {};
          rankData.forEach((item: any) => {
            // Intentar extraer estrategia de varias formas posibles para evitar nulos
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
              // Guardamos los hits crudos solo para las estrategias que vamos a graficar (ahorrar memoria)
              const needsRaw = ['CALIENTE', 'MIXTA', 'FRIA', 'BALANCEADA', 'ELITE', 'REAL', 'UNICA', 'ALEATORIA'].includes(upperName);
              const rawHits = needsRaw ? rankData.filter((item: any) => {
                 const j = Array.isArray(item.juegos) ? item.juegos[0] : item.juegos;
                 return (j?.estrategia?.toLowerCase() || '') === name;
              }) : [];

              return {
                name: upperName,
                avg: v.s / v.t,
                total: v.t,
                rawHits: rawHits
              };
            })
            .sort((a, b) => b.avg - a.avg);
          
          console.log("DASHBOARD: Ranking procesado:", ranked);
          setStrategyRanking(ranked);
          if (ranked.length > 0) {
            setBestStrategy(ranked[0].name);
          }

          // NUEVO: Procesar Tendencia Temporal - REFORZADO con Estadísticas de Grupo (1 vs 300)
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
            .sort((a, b) => a.rawDate - b.rawDate)
            .map(t => {
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

              // Métricas Avanzadas (Real vs Aleatoria)
              const realHitsArr = t.stats['real'] || [];
              const aleaHitsArr = t.stats['aleatoria'] || [];
              
              if (realHitsArr.length > 0 && aleaHitsArr.length > 0) {
                const realVal = realHitsArr[0]; // Tomamos el primer juego real del día
                const totalAlea = aleaHitsArr.length;
                
                // Superioridad: ¿A cuántos del azar vencimos?
                const beaten = aleaHitsArr.filter((h: number) => h < realVal).length;
                const tied = aleaHitsArr.filter((h: number) => h === realVal).length;
                row.superiority = ((beaten + (tied * 0.5)) / totalAlea) * 100;
                
                // Eficiencia: (Real / Promedio Azar) - Cuántas veces mejor es la IA
                row.efficiency = row.alea_avg > 0 ? (realVal / row.alea_avg) : 0;
              } else {
                row.superiority = 0;
                row.efficiency = 0;
              }

              return row;
            })
            .slice(-20); // Mostrar más puntos si hay datos
          
          console.log("DASHBOARD: Datos de tendencia:", finalTrend);
          setTrendData(finalTrend);

          // NUEVO: Procesar Promedio Acumulado (Cumulative Average) - MULTIESTRATEGIA
          const totalSums: Record<string, { sum: number, total: number }> = {};

          const cumulativeTrend = Object.values(trendMap)
            .sort((a: any, b: any) => a.rawDate - b.rawDate)
            .map((t: any) => {
              const row: any = { date: t.dateLabel };
              
              // Recorrer todas las estrategias que existan en este punto del tiempo
              Object.entries(t.stats).forEach(([name, hits]: [string, any]) => {
                if (!totalSums[name]) totalSums[name] = { sum: 0, total: 0 };
                totalSums[name].sum += (hits as number[]).reduce((a, b) => a + b, 0);
                totalSums[name].total += (hits as number[]).length;
                row[name] = totalSums[name].sum / totalSums[name].total;
              });

              // Asegurar que las estrategias previas mantengan su valor acumulado si no hay datos hoy
              Object.keys(totalSums).forEach(name => {
                if (row[name] === undefined) {
                  row[name] = totalSums[name].sum / totalSums[name].total;
                }
              });

              return row;
            })
            .slice(-30);
          
          setCumulativeData(cumulativeTrend);
        }

        // 5. Último Juego Integrado (Solo Real)
        console.log("DASHBOARD [5/6]: Buscando juego REAL jugado...");
        const { data: recentEntries, error: err5 } = await supabase
          .from('rendimiento')
          .select(`
            aciertos_principales,
            acierto_superbalota,
            juegos (
              estrategia, num1, num2, num3, num4, num5, num6, fecha_sorteo
            )
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (err5) console.error("Error Paso 5:", err5);
        if (recentEntries && recentEntries.length > 0) {
          const getJuego = (r: any) => Array.isArray(r.juegos) ? r.juegos[0] : r.juegos;
          const mappedGames = recentEntries.map(g => ({ ...g, juegos: getJuego(g) }));
          const real = mappedGames.find(g => g.juegos?.estrategia?.toLowerCase() === 'real');
          if (real) setRealStrategyEntry(real);
        }

        // 6. Próximos Juegos (Con paginación para superar el límite de 1,000)
        console.log("DASHBOARD [6/6]: Buscando próximos juegos (paginado)...");
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

          if (error) {
            console.error("Error Paso 6:", error);
            break;
          }
          if (data && data.length > 0) {
            allFutureGames = [...allFutureGames, ...data];
            if (data.length < 1000) f_hasMore = false;
            f_from += 1000;
            f_to += 1000;
          } else {
            f_hasMore = false;
          }
        }
        
        const latestGames = allFutureGames;
        if (latestGames && latestGames.length > 0) {
           const mostRecentDate = latestGames[0].fecha_sorteo;
           const gamesToPlay = latestGames.filter(g => g.fecha_sorteo === mostRecentDate);
           setNextGames(gamesToPlay);
        }
        console.log("DASHBOARD: Carga de juegos exitosa.");

        // 7. ANALISIS DE FRECUENCIA Y RECENCIA (Mapa de Calor de Números 1-43)
        console.log("DASHBOARD [7/7]: Analizando historial de números (1-43)...");
        const { data: fullHistory, error: historyError } = await supabase
          .from('historial')
          .select('num1, num2, num3, num4, num5, num6, fecha')
          .eq('tipo', 'Baloto')
          .order('fecha', { ascending: false })
          .limit(200);

        if (fullHistory && !historyError) {
            setLastSorteosHistory(fullHistory);
            
            // 1. Mapa de resultados reales para cruce rápido
            const resultsMap: Record<string, number[]> = {};
            fullHistory.forEach((r: any) => {
              resultsMap[r.fecha] = [r.num1, r.num2, r.num3, r.num4, r.num5];
            });

            // 2. Cálculo de Precisión IA por cada número de BALOTA (1-43)
            const ballPerformance: Record<number, { hits: number, total: number }> = {};
            rankData.forEach((item: any) => {
              const j = Array.isArray(item.juegos) ? item.juegos[0] : item.juegos;
              if (!j) return;
              const predictedNums = [j.num1, j.num2, j.num3, j.num4, j.num5];
              const actualNums = resultsMap[j.fecha_sorteo] || [];

              predictedNums.forEach(p => {
                if (p >= 1 && p <= 43) {
                  if(!ballPerformance[p]) ballPerformance[p] = { hits: 0, total: 0 };
                  ballPerformance[p].total++;
                  if (actualNums.includes(p)) ballPerformance[p].hits++;
                }
              });
            });

            // 3. Generar estadísticas finales para 1-43
            const stats = [];
            for(let i=1; i<=43; i++) {
              let lastIdx = -1; let occurrences = 0; let gaps: number[] = []; let prevIdx = -1;
              fullHistory.forEach((s: any, idx: number) => {
                if([s.num1, s.num2, s.num3, s.num4, s.num5].includes(i)) {
                  if(lastIdx === -1) lastIdx = idx; occurrences++;
                  if(prevIdx !== -1) gaps.push(idx - prevIdx); prevIdx = idx;
                }
              });
              const avgGap = gaps.length > 0 ? gaps.reduce((a,b) => a+b,0)/gaps.length : 12;
              const nextEstimate = Math.max(0, Math.round(avgGap - lastIdx));
              
              const perf = ballPerformance[i] || { hits: 0, total: 0 };
              const precision = perf.total > 0 ? (perf.hits / perf.total) * 100 : 0;

              stats.push({
                num: i, lastSeen: lastIdx === -1 ? 'N/A' : (lastIdx === 0 ? 'Hoy' : `Hace ${lastIdx} sorteos`),
                rawLast: lastIdx, count: occurrences, avgGap: avgGap.toFixed(1),
                rawNext: lastIdx === -1 ? 999 : nextEstimate,
                nextEst: nextEstimate <= 0 || lastIdx === -1 ? 'Próximamente' : `En ${nextEstimate} sorteos`,
                status: lastIdx === -1 ? 'INACTIVO' : (lastIdx > (avgGap * 1.8) ? 'LATENTE' : (lastIdx < 3 ? 'CALIENTE' : 'ESTABLE')),
                precision: precision.toFixed(1),
                totalPlayed: perf.total
              });
            }
            setNumberStats(stats.sort((a,b) => a.num - b.num));

            // 4. ANALISIS 1-16 (Superbalotas)
            const sbPerformance: Record<number, { hits: number, total: number }> = {};
            rankData.forEach((item: any) => {
              const j = Array.isArray(item.juegos) ? item.juegos[0] : item.juegos;
              const predictedSB = j?.num6;
              if (predictedSB >= 1 && predictedSB <= 16) {
                if(!sbPerformance[predictedSB]) sbPerformance[predictedSB] = { hits: 0, total: 0 };
                sbPerformance[predictedSB].total++;
                if (item.acierto_superbalota) sbPerformance[predictedSB].hits++;
              }
            });

            const sbASt = [];
            for(let i=1; i<=16; i++) {
              let lastIdx = -1; let occurrences = 0; let gaps: number[] = []; let prevIdx = -1;
              fullHistory.forEach((s: any, idx: number) => {
                if(s.num6 === i) {
                  if(lastIdx === -1) lastIdx = idx; occurrences++;
                  if(prevIdx !== -1) gaps.push(idx - prevIdx); prevIdx = idx;
                }
              });
              const avgGap = gaps.length > 0 ? gaps.reduce((a,b) => a+b,0)/gaps.length : 16;
              const nextEstimate = Math.max(0, Math.round(avgGap - lastIdx));
              
              const perf = sbPerformance[i] || { hits: 0, total: 0 };
              const precision = perf.total > 0 ? (perf.hits / perf.total) * 100 : 0;

              sbASt.push({
                num: i, lastSeen: lastIdx === -1 ? 'N/A' : (lastIdx === 0 ? 'Hoy' : `Hace ${lastIdx} sorteos`),
                rawLast: lastIdx, count: occurrences, avgGap: avgGap.toFixed(1),
                rawNext: lastIdx === -1 ? 999 : nextEstimate,
                nextEst: nextEstimate <= 0 || lastIdx === -1 ? 'Próximamente' : `En ${nextEstimate} sorteos`,
                status: lastIdx === -1 ? 'INACTIVO' : (lastIdx > (avgGap * 1.8) ? 'LATENTE' : (lastIdx < 4 ? 'CALIENTE' : 'ESTABLE')),
                precision: precision.toFixed(1),
                totalPlayed: perf.total
              });
            }
            setSbStats(sbASt.sort((a,b) => a.num - b.num));

            // 5. NUEVO: ANALISIS DE AFINIDADES (Pares y Tríos)
            console.log("DASHBOARD: Calculando afinidades de pares y tríos...");
            const pairCounts: Record<string, number> = {};
            const trioCounts: Record<string, number> = {};

            fullHistory.forEach((s: any) => {
              const nums = [s.num1, s.num2, s.num3, s.num4, s.num5].sort((a,b) => a-b);
              
              // Generar Pares (C(5,2) = 10 combinaciones)
              for(let i=0; i<nums.length; i++) {
                for(let j=i+1; j<nums.length; j++) {
                  const key = `${nums[i]}-${nums[j]}`;
                  pairCounts[key] = (pairCounts[key] || 0) + 1;
                }
              }

              // Generar Tríos (C(5,3) = 10 combinaciones)
              for(let i=0; i<nums.length; i++) {
                for(let j=i+1; j<nums.length; j++) {
                  for(let k=j+1; k<nums.length; k++) {
                    const key = `${nums[i]}-${nums[j]}-${nums[k]}`;
                    trioCounts[key] = (trioCounts[key] || 0) + 1;
                  }
                }
              }
            });

            const sortedPairs = Object.entries(pairCounts)
              .map(([key, count]) => ({ nums: key.split('-').map(Number), count }))
              .sort((a,b) => b.count - a.count)
              .slice(0, 10);

            const sortedTrios = Object.entries(trioCounts)
              .map(([key, count]) => ({ nums: key.split('-').map(Number), count }))
              .sort((a,b) => b.count - a.count)
              .slice(0, 5);

            setTopPairs(sortedPairs);
            setTopTrios(sortedTrios);

            // Guardar todos los enlaces para el Mapa Social (afinidades fuertes)
            const links = Object.entries(pairCounts)
              .filter(([, count]) => count >= 3)
              .map(([key, count]) => {
                const [a, b] = key.split('-').map(Number);
                return { a, b, count };
              });
            setAffinityLinks(links);
        }

      } catch (err) {
        console.error("CRITICAL DASHBOARD ERROR:", err);
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

  return (
    <main className="dashboard-container">
      <header className="header animate-in">
        <Sparkles style={{ color: '#fbbf24' }} size={32} />
        <h1 style={{ letterSpacing: '-0.04em', fontWeight: '900', fontSize: '2.2rem', margin: 0 }}>
          CONTOLTO <span style={{ color: '#fbbf24', textShadow: '0 0 15px rgba(251, 191, 36, 0.3)' }}>PROFESIONAL</span>
        </h1>
      </header>

      <nav className="tabs-container animate-in" style={{ animationDelay: '0.1s' }}>
        <button 
          onClick={() => setActiveTab('resultados')}
          className={`tab-button ${activeTab === 'resultados' ? 'active' : ''}`}
        >
          <Activity size={16} /> RESULTADOS
        </button>
        <button 
          onClick={() => setActiveTab('historico')}
          className={`tab-button ${activeTab === 'historico' ? 'active' : ''}`}
        >
          <History size={16} /> HISTÓRICO
        </button>
        <button 
          onClick={() => setActiveTab('comportamiento')}
          className={`tab-button ${activeTab === 'comportamiento' ? 'active' : ''}`}
        >
          <TrendingUp size={16} /> COMPORTAMIENTO
        </button>
        <button 
          onClick={() => setActiveTab('analisis')}
          className={`tab-button ${activeTab === 'analisis' ? 'active' : ''}`}
        >
          <Share2 size={16} /> PERSONALIZADO
        </button>
      </nav>

      {activeTab === 'resultados' && (
        <>
          <section className="grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
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
                          background: isHit ? '#10b981' : 'rgba(255,255,255,0.05)',
                          color: isHit ? '#fff' : 'rgba(255,255,255,0.6)',
                          border: isHit ? 'none' : '1px solid rgba(255,255,255,0.1)',
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

        <article className="card animate-in" style={{ animationDelay: '0.2s', borderTop: '4px solid #f59e0b', padding: '0.75rem' }}>
          <div className="card-title" style={{ fontSize: '0.7rem' }}>
            <Activity size={14} /> SORTEO ({lastSorteo ? formatDateShort(lastSorteo.fecha) : '...'})
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
        <article className="card animate-in" style={{ animationDelay: '0.3s', borderTop: '4px solid #3b82f6', padding: '0.75rem' }}>
          <div className="card-title" style={{ fontSize: '0.7rem' }}>
            <TrendingUp size={14} /> ACIERTOS
          </div>
          <div className="card-value" style={{ color: '#3b82f6', fontSize: '1.2rem', marginTop: '0.2rem' }}>
            {realStrategyEntry ? (
              <>
                {realStrategyEntry.aciertos_principales}
                <span style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: '900',
                  color: '#f59e0b',
                  marginLeft: '0.3rem',
                  display: realStrategyEntry.acierto_superbalota ? 'inline' : 'none',
                  textShadow: '0 0 10px rgba(245, 158, 11, 0.4)'
                }}>
                  + SB
                </span>
              </>
            ) : '--'}
          </div>
        </article>

        <article className="card animate-in" style={{ animationDelay: '0.4s', borderTop: '4px solid #fbbf24', padding: '0.75rem' }}>
          <div className="card-title" style={{ fontSize: '0.7rem' }}>
            <Trophy size={14} /> ACUMULADO
          </div>
          <div className="card-value" style={{ color: '#fbbf24', fontSize: '1.1rem', marginTop: '0.2rem' }}>
            {balotoJackpot}
          </div>
        </article>

        <article className="card animate-in" style={{ animationDelay: '0.5s', borderTop: '4px solid #10b981', padding: '0.75rem' }}>
          <div className="card-title" style={{ fontSize: '0.7rem' }}>
            <Sparkles size={14} aria-label="Nuevo Juego" /> NUEVO
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

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(280px, 1fr)', gap: '1rem', marginTop: '1rem' }}>
        {/* Gráfica Comparativa */}
        <article className="card animate-in" style={{ padding: '1.5rem', animationDelay: '0.6s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', color: 'var(--foreground-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} /> IA (REAL) VS AZAR (ALEATORIA)
            </h2>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: 10, height: 10, background: 'var(--primary)', borderRadius: '2px' }} /> REAL
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: 10, height: 10, background: '#f97316', borderRadius: '2px' }} /> ÚNICA
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: 10, height: 10, background: '#64748b', borderRadius: '2px' }} /> ALEATORIA
              </div>
            </div>
          </div>
          <div style={{ width: '100%', height: 320, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compareData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                <Tooltip 
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                  formatter={(value: any, name: any, props: any) => {
                    const isReal = name === 'Real';
                    const isUnica = name === 'Única';
                    const count = isReal ? props.payload.realCount : (isUnica ? props.payload.unicaCount : props.payload.aleatoriaCount);
                    return [`${Number(value).toFixed(2)}% (n=${count})`, `Estrategia: ${name}`];
                  }}
                />
                <Bar dataKey="real" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Real" />
                <Bar dataKey="unica" fill="#f97316" radius={[4, 4, 0, 0]} name="Única" />
                <Bar dataKey="aleatoria" fill="#64748b" radius={[4, 4, 0, 0]} name="Aleatoria" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Panel Lateral de Comparación Triple */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          
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

          {/* Fila 4: COMPARACIÓN GLOBAL */}
          <article className="card animate-in" style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
             <div className="card-title" style={{ fontSize: '0.7rem', color: '#10b981', marginBottom: '0.5rem' }}>
               <Sparkles size={14} /> VENTAJA COMPETITIVA (IA)
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                   <span>vs Azar</span>
                   <span style={{ fontWeight: 'bold' }}>+{(((realStats.avg / (aleatoriaStats.avg || 1)) - 1) * 100).toFixed(1)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                   <span>vs Única</span>
                   <span style={{ fontWeight: 'bold' }}>+{(((realStats.avg / (unicaStats.avg || 1)) - 1) * 100).toFixed(1)}%</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '0.4rem', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (realStats.avg/0.5)*100)}%`, height: '100%', background: '#10b981' }} />
                </div>
             </div>
          </article>
        </div>
      </section>
    </>
  )}

      {activeTab === 'historico' && (
        <>
          {/* Ranking Global de Estrategias (Leaderboard) */}
          <section className="animate-in" style={{ marginTop: '0.5rem', animationDelay: '0.4s' }}>
        <article className="card" style={{ padding: '1.25rem' }}>
          <div className="card-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={18} style={{ color: '#fbbf24' }} /> LEADERBOARD: MEJORES ESTRATEGIAS GLOBAL
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {strategyRanking.slice(0, 8).map((strat, idx) => (
              <div key={idx} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                   <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: idx === 0 ? '#fbbf24' : '#fff' }}>
                     {idx === 0 ? '👑 ' : ''}{strat.name}
                   </span>
                   <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>n={strat.total}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                   <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (strat.avg / 6) * 100)}%`, height: '100%', background: idx === 0 ? '#fbbf24' : 'var(--primary)' }} />
                   </div>
                   <div style={{ fontSize: '0.9rem', fontWeight: '800' }}>{strat.avg.toFixed(3)}</div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* PROMEDIO ACUMULADO (ESTABILIDAD A LARGO PLAZO) - REUBICADO */}
      <section className="animate-in" style={{ marginTop: '1.5rem', marginBottom: '2rem', animationDelay: '0.45s' }}>
        <article className="card" style={{ padding: '1.5rem', borderTop: '4px solid #3b82f6' }}>
          <div className="card-title" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} style={{ color: '#3b82f6' }} /> PROMEDIO ACUMULADO (ESTABILIDAD A LARGO PLAZO)
          </div>
          <div style={{ height: '350px', width: '100%', minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumulativeData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(value: any, name: any) => [
                    `${Number(value).toFixed(4)} Ac`, 
                    `Estr: ${(name || '').toString().charAt(0).toUpperCase() + (name || '').toString().slice(1)}`
                  ]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="real" name="IA Real" stroke="#3b82f6" strokeWidth={3} dot={false} connectNulls />
                <Line type="monotone" dataKey="elite" name="Elite" stroke="#fbbf24" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="aleatoria" name="Azar" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls />
                <Line type="monotone" dataKey="unica" name="Única" stroke="#f97316" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="balanceada" name="Balanceada" stroke="#10b981" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="caliente" name="Caliente" stroke="#ef4444" strokeWidth={1} dot={false} connectNulls opacity={0.6} />
                <Line type="monotone" dataKey="mixta" name="Mixta" stroke="#8b5cf6" strokeWidth={1} dot={false} connectNulls opacity={0.6} />
                <Line type="monotone" dataKey="fria" name="Fría" stroke="#a78bfa" strokeWidth={1} dot={false} connectNulls opacity={0.6} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      {/* NUEVO: Comparativa Detallada de Motores (Distribución de Aciertos) */}
      <section className="animate-in" style={{ marginTop: '1.5rem', animationDelay: '0.5s', marginBottom: '2rem' }}>
        <article className="card" style={{ padding: '1.25rem' }}>
          <div className="card-title" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} style={{ color: 'var(--primary)' }} /> DISTRIBUCIÓN COMPARATIVA: MOTORES PRINCIPALES (%)
          </div>
          <div style={{ height: '350px', width: '100%', minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(() => {
                const labels = ['0 Ac', '1 Ac', '2 Ac', '3 Ac', '4 Ac', '5 Ac', 'SB'];
                const targets = ['CALIENTE', 'MIXTA', 'FRIA', 'BALANCEADA', 'ELITE'];
                
                return labels.map((label, i) => {
                  const row: any = { name: label };
                  targets.forEach(target => {
                    // Accedemos a los datos procesados previamente o recalculamos rápido
                    const filterHits = (strategyRanking.find(s => s.name === target)?.rawHits || []);
                    const total = filterHits.length || 1;
                    if (label === 'SB') {
                      const count = filterHits.filter((h: any) => h.acierto_superbalota).length;
                      row[target.toLowerCase()] = (count / total) * 100;
                    } else {
                      const count = filterHits.filter((h: any) => h.aciertos_principales === i).length;
                      row[target.toLowerCase()] = (count / total) * 100;
                    }
                  });
                  return row;
                });
              })()}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(value: any, name: any) => [
                    `${Number(value).toFixed(2)}%`, 
                    `Estrategia: ${name || 'N/A'}`
                  ]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar dataKey="caliente" name="Caliente" fill="#ef4444" radius={[2, 2, 0, 0]} />
                <Bar dataKey="mixta" name="Mixta" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="fria" name="Fría" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="balanceada" name="Balanceada" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="elite" name="Elite" fill="#fbbf24" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
      {/* SECCIÓN DE GRÁFICAS AVANZADAS DE RENDIMIENTO */}
      <section className="animate-in" style={{ marginTop: '1.5rem', marginBottom: '3rem', animationDelay: '0.6s', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Gráfica 1: Área de Probabilidad (1 vs 300) */}
        <article className="card" style={{ padding: '1.5rem' }}>
          <div className="card-title" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} style={{ color: '#3b82f6' }} /> IA REAL VS RANGO DE AZAR (1 VS 300)
            </div>
            <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Franja gris representa el rango (Min-Max) de 300 juegos aleatorios</div>
          </div>
          <div style={{ height: '300px', width: '100%', minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="alea_range" name="Rango Azar (Min-Max)" fill="rgba(255,255,255,0.05)" stroke="transparent" />
                <Line type="monotone" dataKey="alea_avg" name="Promedio Azar" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="real" name="IA Real" stroke="#3b82f6" strokeWidth={4} dot={{ r: 5, fill: '#3b82f6' }} activeDot={{ r: 8 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </article>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {/* Gráfica 2: Índice de Superioridad (Percentil) */}
          <article className="card" style={{ padding: '1.5rem' }}>
            <div className="card-title" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <Target size={18} style={{ color: '#10b981' }} /> ÍNDICE DE SUPERIORIDAD (%)
            </div>
            <div style={{ height: '250px', width: '100%', minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorSup" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(v: any) => [`${Number(v).toFixed(1)}%`, 'Superior a']}
                  />
                  <Area type="monotone" dataKey="superiority" name="Superioridad vs Azar" stroke="#10b981" fillOpacity={1} fill="url(#colorSup)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '1rem', textAlign: 'center' }}>
              Indica a qué porcentaje de los 300 juegos aleatorios superó la IA en cada fecha.
            </p>
          </article>

          {/* Gráfica 3: Eficiencia de la IA (Factor Multiplicador) */}
          <article className="card" style={{ padding: '1.5rem' }}>
            <div className="card-title" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <Activity size={18} style={{ color: '#fbbf24' }} /> FACTOR DE EFICIENCIA IA
            </div>
            <div style={{ height: '250px', width: '100%', minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}x`} />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(v: any) => [`${Number(v).toFixed(2)}x`, 'Eficiencia']}
                  />
                  <Bar dataKey="efficiency" name="Eficiencia x Tirada" fill="#fbbf24" radius={[4, 4, 0, 0]}>
                    {trendData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={_entry.efficiency >= 1 ? '#fbbf24' : '#ef4444'} opacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '1rem', textAlign: 'center' }}>
              Muestra cuántas veces mejor rindió la IA comparada con el promedio esperado del azar.
            </p>
          </article>
        </div>
      </section>
        </>
      )}

      {activeTab === 'analisis' && (
        <>
          {/* SECCIÓN selector moved up since pairs/trios moved to Comportamiento */}
          <section className="animate-in" style={{ marginTop: '0.5rem', marginBottom: '2.5rem', animationDelay: '0.1s' }}>
            
            {/* SELECTOR SUPERIOR */}
            <article className="card" style={{ padding: '1rem 1.5rem', marginBottom: '1.25rem', borderBottom: '2px solid rgba(251, 191, 36, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  <Settings size={18} style={{ color: '#fbbf24' }} /> SELECTOR DE NÚCLEO PARA ANÁLISIS
                </div>
                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Selecciona un número para ver sus conexiones y clusters</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: '6px' }}>
                {Array.from({ length: 43 }, (_, i) => i + 1).map(n => (
                  <div 
                    key={n}
                    onClick={() => setSelectedCompanionNum(n)}
                    style={{
                      padding: '8px 0', fontSize: '0.8rem', textAlign: 'center', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
                      background: selectedCompanionNum === n ? '#fbbf24' : 'rgba(255,255,255,0.03)',
                      color: selectedCompanionNum === n ? '#000' : '#fff',
                      border: '1px solid rgba(255,255,255,0.05)', 
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: selectedCompanionNum === n ? '0 0 15px rgba(251, 191, 36, 0.3)' : 'none',
                      transform: selectedCompanionNum === n ? 'scale(1.05)' : 'none'
                    }}
                  >
                    {n}
                  </div>
                ))}
              </div>
            </article>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem', alignItems: 'stretch' }}>
              
              {/* Col 1: Mapa Social */}
              <article className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
                
                <div className="card-title" style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Share2 size={18} style={{ color: '#3b82f6' }} /> RED DE AFINIDAD CRONOLÓGICA
                  </div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.6, background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px' }}>
                    Afinidad {'>='} 3 hits
                  </div>
                </div>
                
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '450px' }}>
                  <svg viewBox="0 0 600 600" style={{ width: '100%', maxWidth: '560px', height: 'auto' }}>
                    <defs>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Enlaces (Links) Activos - Encima de los grises */}
                    {affinityLinks.map((link) => {
                      const radius = 260, cx = 300, cy = 300;
                      const angleA = (link.a - 1) * (360 / 43) * (Math.PI / 180) - Math.PI / 2;
                      const angleB = (link.b - 1) * (360 / 43) * (Math.PI / 180) - Math.PI / 2;
                      const x1 = cx + radius * Math.cos(angleA), y1 = cy + radius * Math.sin(angleA);
                      const x2 = cx + radius * Math.cos(angleB), y2 = cy + radius * Math.sin(angleB);
                      const isActive = selectedCompanionNum === link.a || selectedCompanionNum === link.b;
                      
                      return isActive && (
                        <line 
                          key={`${link.a}-${link.b}-active`} 
                          x1={x1} y1={y1} x2={x2} y2={y2} 
                          stroke="#fbbf24" 
                          strokeWidth={2.5}
                          style={{ transition: 'all 0.4s ease', filter: 'url(#glow)', opacity: 0.7 }} 
                        />
                      );
                    })}
                    
                    {/* Enlaces base (todos los >= 3) */}
                    {affinityLinks.map((link) => {
                      const radius = 260, cx = 300, cy = 300;
                      const angleA = (link.a - 1) * (360 / 43) * (Math.PI / 180) - Math.PI / 2;
                      const angleB = (link.b - 1) * (360 / 43) * (Math.PI / 180) - Math.PI / 2;
                      const x1 = cx + radius * Math.cos(angleA), y1 = cy + radius * Math.sin(angleA);
                      const x2 = cx + radius * Math.cos(angleB), y2 = cy + radius * Math.sin(angleB);
                      
                      return (
                        <line 
                          key={`${link.a}-${link.b}`} 
                          x1={x1} y1={y1} x2={x2} y2={y2} 
                          stroke="rgba(255,255,255,0.04)" 
                          strokeWidth={1}
                        />
                      );
                    })}

                    {/* Nodos (Círculos) */}
                    {Array.from({ length: 43 }, (_, i) => i + 1).map(n => {
                       const radius = 260, cx = 300, cy = 300;
                       const angle = (n - 1) * (360 / 43) * (Math.PI / 180) - Math.PI / 2;
                       const x = cx + radius * Math.cos(angle), y = cy + radius * Math.sin(angle);
                       const isSelected = selectedCompanionNum === n;
                       const isFriend = clusterAnalysis?.friends.includes(n);

                       return (
                         <g key={n} style={{ cursor: 'pointer' }} onClick={() => setSelectedCompanionNum(n)}>
                            {isSelected && <circle cx={x} cy={y} r={22} fill="rgba(251, 191, 36, 0.15)" className="animate-pulse" />}
                            <circle 
                              cx={x} cy={y} 
                              r={isSelected ? 15 : (isFriend ? 12 : 9)} 
                              fill={isSelected ? '#fbbf24' : (isFriend ? '#3b82f6' : '#0f172a')} 
                              stroke={isSelected ? '#fff' : (isFriend ? 'rgba(59, 130, 246, 0.6)' : 'rgba(255,255,255,0.2)')} 
                              strokeWidth={isSelected ? 3 : 1.5} 
                              style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} 
                            />
                            <text 
                              x={x} y={y + 4} 
                              textAnchor="middle" 
                              fontSize={isSelected ? '10' : '8'} 
                              fontWeight="bold" 
                              fill={isSelected ? '#000' : '#fff'} 
                              style={{ pointerEvents: 'none' }}
                            >
                              {n}
                            </text>
                         </g>
                       );
                    })}
                  </svg>
                  
                  <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    <div style={{ fontSize: '0.6rem', opacity: 0.3, textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '-5px' }}>Fuerzas de</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'rgba(255,255,255,0.03)', letterSpacing: '4px' }}>CONFLUENCIA</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.65rem', opacity: 0.6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24' }} /> Seleccionado
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} /> Mejores Amigos
                  </div>
                </div>
              </article>

              {/* Col 2: Análisis */}
              <article className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #fbbf24', display: 'flex', flexDirection: 'column' }}>
                {selectedCompanionNum && clusterAnalysis ? (
                  <div className="animate-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                       <div className="number-badge" style={{ width: '50px', height: '50px', fontSize: '1.4rem', background: 'transparent', borderColor: '#fbbf24', color: '#fbbf24', borderWidth: '2px' }}>{selectedCompanionNum}</div>
                       <div>
                         <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' }}>ANÁLISIS DE CLUSTER</div>
                         <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Número base + 4 acompañantes</div>
                       </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.75rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Trophy size={14} style={{ color: '#3b82f6' }} /> AFINIDAD DIRECTA (MEJORES AMIGOS)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                         {clusterAnalysis.friends.map(n => (
                           <div key={n} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(59, 130, 246, 0.05)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                             <div className="number-badge" style={{ width: '26px', height: '26px', fontSize: '0.8rem', background: '#3b82f6', border: 'none' }}>{n}</div>
                             <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff' }}>{clusterAnalysis.pairHits[n]} hits</div>
                           </div>
                         ))}
                      </div>

                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '1rem', opacity: 0.8 }}>RENDIMIENTO DEL COMBO (HISTÓRICO)</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                           <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                             <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981' }}>{clusterAnalysis.combos.combo3}</div>
                             <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>3 Hits</div>
                           </div>
                           <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                             <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#3b82f6' }}>{clusterAnalysis.combos.combo4}</div>
                             <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>4 Hits</div>
                           </div>
                           <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(251, 191, 36, 0.08)', borderRadius: '10px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                             <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fbbf24' }}>{clusterAnalysis.combos.combo5}</div>
                             <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>5 Hits</div>
                           </div>
                        </div>
                        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{clusterAnalysis.totalWins} premios totales acumulados</div>
                        </div>
                      </div>

                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '1rem', opacity: 0.8 }}>BALANCE QUÍMICO DEL GRUPO</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 2fr', gap: '0.75rem' }}>
                          <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{clusterAnalysis.chemistry.evens}P / {clusterAnalysis.chemistry.odds}I</div>
                            <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>Pares/Impares</div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem' }}>
                             {[{l:'R1',v:clusterAnalysis.chemistry.ranges.r1},{l:'R2',v:clusterAnalysis.chemistry.ranges.r2},{l:'R3',v:clusterAnalysis.chemistry.ranges.r3},{l:'R4',v:clusterAnalysis.chemistry.ranges.r4}].map(r => (
                               <div key={r.l} style={{ textAlign: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                 <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{r.v}</div>
                                 <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>{r.l}</div>
                               </div>
                             ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '1rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           <Trophy size={14} style={{ color: '#f59e0b' }} /> TRINIDAD DE SUPERBALOTAS (AFINIDAD)
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                           {clusterAnalysis.superballAffinities.map((sb, i) => (
                             <div key={i} style={{ 
                               textAlign: 'center', padding: '0.75rem', background: 'rgba(245, 158, 11, 0.05)', 
                               borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.1)',
                               position: 'relative'
                             }}>
                               <div style={{ fontSize: '0.55rem', position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', background: '#1e293b', padding: '0 5px', color: '#f59e0b', fontWeight: 'bold', borderRadius: '4px' }}>
                                 {i === 0 ? 'ESTELAR' : (i === 1 ? 'ALTA' : 'MEDIA')}
                               </div>
                               <div className="number-badge" style={{ margin: '0 auto 0.5rem', width: '32px', height: '32px', fontSize: '1rem', background: 'transparent', borderColor: '#f59e0b', color: '#f59e0b', borderWidth: '1.5px' }}>{sb.num}</div>
                               <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#fff' }}>{sb.count} hits</div>
                             </div>
                           ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '0.9rem', opacity: 0.3, textAlign: 'center', padding: '3rem' }}>
                    Selecciona un número del selector superior para iniciar el análisis profundo de afinidades
                  </div>
                )}
              </article>
            </div>
          </section>
        </>
      )}

{activeTab === 'comportamiento' && (
  <>
    {/* TABLA DE ANÁLISIS DE FRECUENCIA Y RECENCIA (1-43) */}
    <section className="animate-in" style={{ marginTop: '0.5rem', marginBottom: '2.5rem', animationDelay: '0.1s' }}>
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
              {numberStats.map((s, idx) => (
                <tr key={idx} 
                  onClick={() => setSelectedCompanionNum(s.num)}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s', cursor: 'pointer', background: selectedCompanionNum === s.num ? 'rgba(251, 191, 36, 0.1)' : 'transparent' }}>
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

      {/* MAPA DE CALOR: SUPERBALOTA (1-16) */}
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
              {sbStats.map((s, idx) => (
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

      {/* AFINIDADES ESTÁTICAS - MOVIDAS DESDE ANÁLISIS POR PETICIÓN DEL USUARIO */}
      <section className="animate-in" style={{ marginTop: '1.5rem', marginBottom: '2.5rem', animationDelay: '0.3s' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          <article className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
            <div className="card-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} style={{ color: '#10b981' }} /> PAREJAS DE ORO
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {topPairs.slice(0, 10).map((p, idx) => (
                <div key={idx} style={{ 
                  padding: '0.6rem', background: 'rgba(16, 185, 129, 0.05)', 
                  borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.1)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                   <div style={{ display: 'flex', gap: '0.4rem' }}>
                     {p.nums.map((n: number) => (
                       <span key={n} className="number-badge" style={{ width: '22px', height: '22px', fontSize: '0.7rem', background: '#10b981', color: '#fff', border: 'none' }}>{n}</span>
                     ))}
                   </div>
                   <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{p.count}v</div>
                </div>
              ))}
            </div>
          </article>

          <article className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #8b5cf6' }}>
            <div className="card-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trophy size={18} style={{ color: '#8b5cf6' }} /> TRÍOS DE PODER
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {topTrios.slice(0, 5).map((t, idx) => (
                <div key={idx} style={{ 
                  padding: '0.6rem', background: 'rgba(139, 92, 246, 0.05)', 
                  borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.1)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                   <div style={{ display: 'flex', gap: '0.4rem' }}>
                     {t.nums.map((n: number) => (
                       <span key={n} className="number-badge" style={{ width: '22px', height: '22px', fontSize: '0.7rem', background: '#8b5cf6', color: '#fff', border: 'none' }}>{n}</span>
                     ))}
                   </div>
                   <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{t.count}v</div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </section>
  </>
)}
    </main>
  );
}
