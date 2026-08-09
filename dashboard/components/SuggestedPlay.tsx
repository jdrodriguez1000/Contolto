'use client';

import { useState, useEffect, useMemo } from 'react';
import { Sparkles, Dices, CalendarDays, Check, Loader2 } from 'lucide-react';
import {
  excludedFromDraws,
  generateHonestPlay,
  getNextDrawDate,
  toYMD,
  type DrawResult,
  type Play,
} from '@/lib/draw';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface Props {
  onSaved?: () => void;
  /** Último sorteo: sus números quedan excluidos de la jugada generada. */
  baloto?: DrawResult | null;
  revancha?: DrawResult | null;
}

export default function SuggestedPlay({ onSaved, baloto, revancha }: Props) {
  const [play, setPlay] = useState<Play | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const excluded = useMemo(() => excludedFromDraws(baloto, revancha), [baloto, revancha]);
  const nextDraw = useMemo(() => getNextDrawDate(), []);
  const fechaYMD = useMemo(() => toYMD(nextDraw), [nextDraw]);
  const fechaTexto = nextDraw.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Se genera en el cliente para evitar desajustes de hidratación
  useEffect(() => {
    setPlay(generateHonestPlay(fechaYMD, excluded));
  }, [fechaYMD, excluded]);

  function regenerate() {
    setPlay(generateHonestPlay(fechaYMD, excluded));
    setSaveState('idle');
  }

  async function savePlay() {
    if (!play) return;
    setSaveState('saving');
    try {
      const res = await fetch('/api/jugada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(play),
      });
      if (!res.ok) throw new Error('Error al guardar');
      setSaveState('saved');
      onSaved?.();
    } catch (e) {
      console.error('Error al guardar la jugada:', e);
      setSaveState('error');
    }
  }

  return (
    <article
      className="card animate-in"
      style={{ padding: '1rem 1.25rem', borderTop: '4px solid #cbd5e1', animationDelay: '0.2s' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.05em' }}>
          <Sparkles size={18} style={{ color: '#cbd5e1' }} /> TU JUGADA (GENERADA AL AZAR)
        </h2>
        <span style={{ fontSize: '0.75rem', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <CalendarDays size={14} /> Próximo sorteo: {fechaTexto}
        </span>
      </div>

      {/* Números */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', margin: '0.85rem 0', flexWrap: 'wrap', minHeight: '36px' }}>
        {play ? (
          <>
            {play.nums.map((n, i) => (
              <span
                key={i}
                className="number-badge"
                style={{ width: '36px', height: '36px', fontSize: '1rem', fontWeight: 'bold', background: 'rgba(148, 163, 184, 0.12)', borderColor: '#94a3b8', color: '#e2e8f0' }}
              >
                {n}
              </span>
            ))}
            <span className="number-badge" style={{ width: '36px', height: '36px', fontSize: '1rem', fontWeight: 'bold', background: '#cbd5e1', borderColor: '#cbd5e1', color: '#1e293b' }}>
              {play.sb}
            </span>
          </>
        ) : (
          <span style={{ opacity: 0.4 }}>Generando…</span>
        )}
      </div>

      {/* Acciones: generar otra (ninguna es mejor) o guardar la jugada elegida */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={regenerate}
          disabled={saveState === 'saving'}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.55rem 1.1rem', borderRadius: '10px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', fontWeight: 600,
            cursor: saveState === 'saving' ? 'default' : 'pointer',
          }}
        >
          <Dices size={15} /> Generar Juego
        </button>

        <button
          onClick={savePlay}
          disabled={!play || saveState === 'saving' || saveState === 'saved'}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.55rem 1.25rem', borderRadius: '10px',
            background: saveState === 'saved' ? 'rgba(203, 213, 225, 0.18)' : '#cbd5e1',
            border: '1px solid #cbd5e1',
            color: saveState === 'saved' ? '#cbd5e1' : '#1e293b',
            fontSize: '0.8rem', fontWeight: 700,
            cursor: saveState === 'saving' || saveState === 'saved' ? 'default' : 'pointer',
            opacity: !play ? 0.5 : 1,
          }}
        >
          {saveState === 'saving' && <><Loader2 size={15} className="animate-spin" /> Guardando…</>}
          {saveState === 'saved' && <><Check size={15} /> Guardada para el sorteo</>}
          {saveState === 'idle' && <><Check size={15} /> Mi Jugada</>}
          {saveState === 'error' && <>Reintentar</>}
        </button>
      </div>

      {saveState === 'error' && (
        <p style={{ fontSize: '0.72rem', color: '#f87171', textAlign: 'center', margin: 0 }}>
          No se pudo guardar. Inténtalo de nuevo.
        </p>
      )}

      {saveState === 'saved' && (
        <p style={{ fontSize: '0.75rem', color: '#cbd5e1', textAlign: 'center', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', lineHeight: 1.5 }}>
          <Check size={14} /> Guardada para el {fechaTexto}. Generar Juego y guardar la reemplazará.
        </p>
      )}
    </article>
  );
}
