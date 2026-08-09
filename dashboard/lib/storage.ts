// Persistencia de la jugada en el navegador.
// No hay backend: cada dispositivo guarda su propia jugada en localStorage.

import type { Play } from './draw';

const KEY = 'contolto:jugada';

/** Valida lo que venga de localStorage antes de confiar en ello. */
function isPlay(value: unknown): value is Play {
  if (typeof value !== 'object' || value === null) return false;
  const { nums, sb, fecha_sorteo } = value as Partial<Play>;

  return (
    Array.isArray(nums) &&
    nums.length === 5 &&
    nums.every((n) => Number.isInteger(n) && n >= 1 && n <= 43) &&
    new Set(nums).size === 5 &&
    Number.isInteger(sb) &&
    (sb as number) >= 1 &&
    (sb as number) <= 16 &&
    typeof fecha_sorteo === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(fecha_sorteo)
  );
}

/** Jugada guardada, o null si no hay ninguna o quedó corrupta. */
export function readPlay(): Play | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isPlay(parsed) ? parsed : null;
  } catch {
    return null; // JSON inválido o localStorage bloqueado
  }
}

/** Guarda la jugada. Lanza si el navegador no deja escribir. */
export function savePlay(play: Play): void {
  window.localStorage.setItem(KEY, JSON.stringify(play));
}
