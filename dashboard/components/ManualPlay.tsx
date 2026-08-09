'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { listDrawDates, toYMD, getNextDrawDate } from '@/lib/draw';
import { savePlay } from '@/lib/storage';

const ACCENT = '#3b82f6';

function formatFecha(ymd: string): string {
  const d = new Date(ymd + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
}

interface Props {
  onSaved: () => void;
  onCancel: () => void;
}

/**
 * Ingreso manual de la jugada que realmente compraste.
 * A diferencia del generador, aquí no se aplica ningún filtro: si eso
 * fue lo que jugaste, eso es lo que hay que registrar.
 */
export default function ManualPlay({ onSaved, onCancel }: Props) {
  const [nums, setNums] = useState<number[]>([]);
  const [sb, setSb] = useState<number | null>(null);
  const [fecha, setFecha] = useState<string>(toYMD(getNextDrawDate()));
  const [error, setError] = useState<string | null>(null);

  const fechas = listDrawDates();
  const completa = nums.length === 5 && sb !== null;

  function toggleNum(n: number) {
    setNums((prev) => {
      if (prev.includes(n)) return prev.filter((x) => x !== n);
      if (prev.length >= 5) return prev; // ya hay 5
      return [...prev, n].sort((a, b) => a - b);
    });
  }

  function guardar() {
    if (!completa) return;
    try {
      savePlay({ nums: [...nums].sort((a, b) => a - b), sb: sb as number, fecha_sorteo: fecha });
      onSaved();
    } catch (e) {
      console.error('Error al guardar la jugada:', e);
      setError('No se pudo guardar en este navegador.');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      {/* Sorteo al que pertenece la jugada */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--foreground-muted)', flexWrap: 'wrap' }}>
        Sorteo:
        <select
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.05)', color: 'var(--foreground)',
            border: '1px solid var(--card-border)', borderRadius: '8px',
            padding: '0.35rem 0.5rem', fontSize: '0.78rem', fontFamily: 'inherit',
          }}
        >
          {[...fechas].reverse().map((f) => (
            <option key={f} value={f} style={{ background: '#0f172a' }}>
              {formatFecha(f)}
            </option>
          ))}
        </select>
      </label>

      {/* Los 5 números */}
      <div>
        <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', margin: '0 0 0.5rem' }}>
          Tus 5 números ({nums.length}/5)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(38px, 1fr))', gap: '0.35rem' }}>
          {Array.from({ length: 43 }, (_, i) => i + 1).map((n) => {
            const sel = nums.includes(n);
            const lleno = nums.length >= 5 && !sel;
            return (
              <button
                key={n}
                type="button"
                onClick={() => toggleNum(n)}
                disabled={lleno}
                style={{
                  aspectRatio: '1', borderRadius: '50%', fontFamily: "'Fira Code', monospace",
                  fontSize: '0.8rem', fontWeight: sel ? 700 : 500,
                  background: sel ? ACCENT : 'transparent',
                  border: `1.5px solid ${sel ? ACCENT : 'var(--card-border)'}`,
                  color: sel ? '#fff' : 'var(--foreground-muted)',
                  opacity: lleno ? 0.3 : 1,
                  cursor: lleno ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      {/* Super balota */}
      <div>
        <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', margin: '0 0 0.5rem' }}>
          Super balota
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(38px, 1fr))', gap: '0.35rem' }}>
          {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => {
            const sel = sb === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setSb(sel ? null : n)}
                style={{
                  aspectRatio: '1', borderRadius: '50%', fontFamily: "'Fira Code', monospace",
                  fontSize: '0.8rem', fontWeight: sel ? 700 : 500,
                  background: sel ? ACCENT : 'transparent',
                  border: `1.5px solid ${sel ? ACCENT : 'var(--card-border)'}`,
                  color: sel ? '#fff' : 'var(--foreground-muted)',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p style={{ fontSize: '0.72rem', color: '#f87171', textAlign: 'center', margin: 0 }}>{error}</p>
      )}

      {/* Acciones */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.55rem 1.1rem', borderRadius: '10px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
          }}
        >
          <X size={15} /> Cancelar
        </button>
        <button
          type="button"
          onClick={guardar}
          disabled={!completa}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.55rem 1.25rem', borderRadius: '10px',
            background: ACCENT, border: `1px solid ${ACCENT}`, color: '#fff',
            fontSize: '0.8rem', fontWeight: 700,
            cursor: completa ? 'pointer' : 'not-allowed',
            opacity: completa ? 1 : 0.4,
          }}
        >
          <Check size={15} /> Guardar mi jugada
        </button>
      </div>
    </div>
  );
}
