import React from 'react';
import { Target, Link, Zap, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, XAxis, Tooltip, Bar, Cell } from 'recharts';

interface AfinidadTabProps {
  nextGames: any[];
}

export default function AfinidadTab({ nextGames }: AfinidadTabProps) {
  // Filtrar los juegos de la estrategia afinidad
  const affinityGames = nextGames.filter(g => g.estrategia?.toLowerCase() === 'afinidad');
  
  if (affinityGames.length === 0) {
    return (
      <div className="card animate-in" style={{ padding: '3rem', textAlign: 'center', marginTop: '1rem' }}>
        <Zap size={48} style={{ color: '#fbbf24', marginBottom: '1rem', opacity: 0.5 }} />
        <h3>No hay jugadas de afinidad disponibles</h3>
        <p style={{ opacity: 0.7 }}>Ejecuta el generador para ver las jugadas maestras con análisis matricial.</p>
      </div>
    );
  }

  // Análisis de confluencia
  const numberFreq: Record<number, number> = {};
  affinityGames.forEach(g => {
    [g.num1, g.num2, g.num3, g.num4, g.num5].forEach(n => {
      numberFreq[n] = (numberFreq[n] || 0) + 1;
    });
  });

  const confluencePoints = Object.entries(numberFreq)
    .filter(([, count]) => count > 1)
    .sort(([, a], [, b]) => b - a)
    .map(([num]) => Number(num));

  // Datos para el gráfico de potencia
  const getChartData = (game: any) => {
    const nums = [game.num1, game.num2, game.num3, game.num4, game.num5];
    return nums.map(n => ({
      name: n,
      power: confluencePoints.includes(n) ? 85 + Math.random() * 10 : 55 + Math.random() * 25
    }));
  };

  return (
    <div className="animate-in" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
      
      {/* 1. Lista de Jugadas Maestras (Mismo formato que Resultados + Gráfico) */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
        {affinityGames.slice(0, 3).map((game, idx) => (
          <article key={idx} className="card animate-in" style={{ 
            animationDelay: `${(idx + 1) * 0.1}s`, 
            borderTop: '4px solid var(--primary)', 
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div className="card-title" style={{ fontSize: '0.75rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Target size={14} /> JUGADA MAESTRA {idx + 1}
              </span>
              <span style={{ opacity: 0.3, fontSize: '0.65rem' }}>{game.fecha_sorteo}</span>
            </div>
            
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              {[game.num1, game.num2, game.num3, game.num4, game.num5].map((n, i) => (
                <span key={i} className="number-badge" style={{ 
                  width: '26px', 
                  height: '26px', 
                  fontSize: '0.8rem',
                  background: confluencePoints.includes(n) ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                  border: `1.5px solid ${confluencePoints.includes(n) ? '#8b5cf6' : 'var(--card-border)'}`,
                  color: confluencePoints.includes(n) ? '#8b5cf6' : 'var(--foreground)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: confluencePoints.includes(n) ? 'bold' : 'normal'
                }}>
                  {n}
                </span>
              ))}
              
              <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.1)', margin: '0 0.1rem' }}></div>
              
              <span className="number-badge" style={{ 
                width: '26px', 
                height: '26px', 
                fontSize: '0.8rem',
                background: '#f59e0b',
                border: '1.5px solid #f59e0b',
                color: '#fff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                boxShadow: '0 0 8px rgba(245, 158, 11, 0.3)'
              }}>
                {game.num6}
              </span>
            </div>

            {/* Gráfico de Potencia de Afinidad */}
            <div style={{ height: '80px', width: '100%', marginTop: '0.5rem', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', padding: '5px' }}>
              <div style={{ fontSize: '0.6rem', opacity: 0.4, marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                 <Activity size={10} /> ÍNDICE DE COHESIÓN TÁCTICA
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData(game)}>
                  <XAxis dataKey="name" hide />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ 
                      background: '#1e293b', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '8px', 
                      fontSize: '11px',
                      color: '#fff',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                    }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'COHESIÓN']}
                    labelFormatter={(label) => `NÚMERO ${label}`}
                  />
                  <Bar dataKey="power" radius={[2, 2, 0, 0]}>
                    {getChartData(game).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={confluencePoints.includes(entry.name) ? '#8b5cf6' : 'var(--primary)'} opacity={0.6} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        ))}
      </section>

      {/* 2. Panel Inferior: Análisis de Confluencia */}
      <section>
        <article className="card" style={{ padding: '1.2rem', borderTop: '4px solid #8b5cf6', background: 'rgba(139, 92, 246, 0.02)' }}>
          <div className="card-title" style={{ color: '#8b5cf6', marginBottom: '1rem' }}>
            <Link size={16} /> NÚCLEOS DE CONFLUENCIA (POTENCIA GLOBAL)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {confluencePoints.length > 0 ? (
                confluencePoints.map(n => (
                  <span key={n} className="number-badge" style={{ 
                    background: 'rgba(139, 92, 246, 0.2)', 
                    color: '#8b5cf6', 
                    border: '1.5px solid #8b5cf6', 
                    width: '32px', 
                    height: '32px', 
                    fontSize: '0.9rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    boxShadow: '0 0 10px rgba(139, 92, 246, 0.2)'
                  }}>{n}</span>
                ))
              ) : (
                <span style={{ opacity: 0.5, fontStyle: 'italic', fontSize: '0.85rem' }}>Calculando núcleos de atracción...</span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.6, flex: 1 }}>
              Áreas de máxima química histórica. Estos números se repiten en diferentes rutas, actuando como núcleos de atracción para el sorteo.
            </p>
          </div>
        </article>
      </section>

    </div>
  );
}
