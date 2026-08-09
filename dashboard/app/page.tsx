'use client';

import { useState, useEffect, useCallback } from 'react';
import { Activity, Target, Sparkles, Clock, CalendarX } from 'lucide-react';
import { countHits, type DrawResult, type Play } from '@/lib/draw';
import { readPlay } from '@/lib/storage';
import SuggestedPlay from '@/components/SuggestedPlay';

interface Resultado {
  baloto: DrawResult | null;
  revancha: DrawResult | null;
}

function formatFecha(ymd: string): string {
  const d = new Date(ymd + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** Fila del número ganador oficial (Baloto o Revancha). */
function WinningRow({ label, draw }: { label: string; draw: DrawResult }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--foreground-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {label}
        {draw.premio && (
          <span style={{ fontWeight: 700, letterSpacing: 0 }}>
            -&nbsp;{draw.premio}
          </span>
        )}
      </span>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {draw.nums.map((n, i) => (
          <span key={i} className="number-badge" style={{ width: '36px', height: '36px', fontSize: '1rem', fontWeight: 'bold', background: 'rgba(245, 158, 11, 0.12)', borderColor: '#f59e0b', color: '#f59e0b' }}>
            {n}
          </span>
        ))}
        <span className="number-badge" style={{ width: '36px', height: '36px', fontSize: '1rem', fontWeight: 'bold', background: '#f59e0b', borderColor: '#f59e0b', color: '#1e293b', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)' }}>
          {draw.sb}
        </span>
      </div>
    </div>
  );
}

/** Color del marcador (X/6) según la cantidad de aciertos. */
function scoreColor(total: number): string {
  if (total >= 6) return '#22c55e'; // verde fuerte
  if (total >= 4) return '#f97316'; // naranja fuerte
  if (total >= 2) return '#facc15'; // amarillo
  return '#ffffff';                 // blanco (0 o 1)
}

/** Compara tu jugada contra un sorteo y resalta los aciertos. */
function ComparisonRow({ label, play, draw }: { label: string; play: Play; draw: DrawResult }) {
  const { mainHits, sbHit, total } = countHits(play, draw);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--foreground-muted)' }}>
        {label} <span style={{ color: scoreColor(total) }}>({total}/6)</span>
      </span>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {play.nums.map((n, i) => {
          const isHit = mainHits.includes(n);
          return (
            <span key={i} className="number-badge" style={{
              width: '36px', height: '36px', fontSize: '1rem', fontWeight: isHit ? 'bold' : 'normal',
              background: isHit ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              borderColor: isHit ? '#10b981' : 'var(--card-border)',
              color: isHit ? '#10b981' : 'var(--foreground-muted)',
            }}>
              {n}
            </span>
          );
        })}
        <span className="number-badge" style={{
          width: '36px', height: '36px', fontSize: '1rem', fontWeight: 'bold',
          background: sbHit ? '#3b82f6' : 'transparent',
          borderColor: '#3b82f6', color: sbHit ? '#fff' : '#3b82f6',
        }}>
          {play.sb}
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const [resultado, setResultado] = useState<Resultado>({ baloto: null, revancha: null });
  const [play, setPlay] = useState<Play | null>(null);
  const [loading, setLoading] = useState(true);

  const loadJugada = useCallback(() => {
    setPlay(readPlay());
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const res = await fetch('/api/resultado');
        if (res.ok) setResultado(await res.json());
      } catch {
        setResultado({ baloto: null, revancha: null });
      }
      loadJugada();
      setLoading(false);
    }
    init();
  }, [loadJugada]);

  if (loading) {
    return (
      <main className="dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="animate-pulse" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎱</div>
          <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>CARGANDO…</div>
        </div>
      </main>
    );
  }

  const { baloto, revancha } = resultado;
  const fechaRef = baloto?.fecha ?? revancha?.fecha ?? null;
  // Solo comparamos si el resultado cargado es exactamente el del sorteo
  // para el que se guardó la jugada.
  const yaSorteada = !!(play && fechaRef && fechaRef === play.fecha_sorteo);
  // El sorteo objetivo ya pasó, pero el resultado que tenemos es de otro más
  // reciente: no hay contra qué comparar sin inventar aciertos.
  const vencida = !!(play && fechaRef && fechaRef > play.fecha_sorteo);

  return (
    <main className="dashboard-container" style={{ maxWidth: '640px', margin: '0 auto', padding: '0.75rem 1rem' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.9rem' }}>
        <Sparkles style={{ color: '#fbbf24' }} size={22} />
        <h1 style={{ letterSpacing: '-0.04em', fontWeight: 900, fontSize: '1.4rem', margin: 0 }}>
          CONTOLTO <span style={{ color: '#fbbf24' }}>BALOTO</span>
        </h1>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* BLOQUE 1: Último sorteo oficial (Baloto + Revancha) */}
        <article className="card animate-in" style={{ padding: '1rem 1.25rem', borderTop: '4px solid #f59e0b', animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h2 style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.05em' }}>
              <Activity size={18} style={{ color: '#f59e0b' }} /> ÚLTIMO SORTEO {fechaRef ? `· ${formatFecha(fechaRef)}` : ''}
            </h2>
            <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>Números ganadores oficiales</span>
          </div>

          {baloto || revancha ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {baloto && <WinningRow label="BALOTO" draw={baloto} />}
              {revancha && <WinningRow label="REVANCHA" draw={revancha} />}
            </div>
          ) : (
            <span style={{ opacity: 0.5 }}>No se pudo cargar el resultado de baloto.com</span>
          )}
        </article>

        {/* BLOQUE 2: Tu jugada comparada contra ambos sorteos */}
        {play && (
          <article className="card animate-in" style={{ padding: '1rem 1.25rem', borderTop: '4px solid #3b82f6', animationDelay: '0.15s' }}>
            <h2 style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)', margin: '0 0 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.05em' }}>
              <Target size={18} style={{ color: '#3b82f6' }} /> TU JUGADA · sorteo {formatFecha(play.fecha_sorteo)}
            </h2>

            {yaSorteada ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {baloto && <ComparisonRow label="BALOTO" play={play} draw={baloto} />}
                {revancha && <ComparisonRow label="REVANCHA" play={play} draw={revancha} />}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  {play.nums.map((n, i) => (
                    <span key={i} className="number-badge" style={{ width: '36px', height: '36px', fontSize: '1rem', border: '1.5px solid var(--card-border)', color: 'var(--foreground-muted)' }}>
                      {n}
                    </span>
                  ))}
                  <span className="number-badge" style={{ width: '36px', height: '36px', fontSize: '1rem', border: '1.5px solid #3b82f6', color: '#3b82f6', fontWeight: 'bold' }}>
                    {play.sb}
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', textAlign: 'center', margin: 0, color: 'var(--foreground-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', lineHeight: 1.5 }}>
                  {vencida ? (
                    <>
                      <CalendarX size={14} /> El sorteo del {formatFecha(play.fecha_sorteo)} ya pasó y no
                      tenemos su resultado para compararlo.
                    </>
                  ) : (
                    <>
                      <Clock size={14} /> Esperando el sorteo del {formatFecha(play.fecha_sorteo)}
                    </>
                  )}
                </p>
              </>
            )}
          </article>
        )}

        {/* BLOQUE 3: Generar la próxima jugada */}
        <SuggestedPlay onSaved={loadJugada} baloto={baloto} revancha={revancha} />
      </div>
    </main>
  );
}
