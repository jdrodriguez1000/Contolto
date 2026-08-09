// Persistencia de la jugada en el navegador.
// No hay backend: cada dispositivo guarda su propia jugada en localStorage.

import type { DrawResult, Play } from './draw';

const KEY = 'contolto:jugada';

/** Resultado de un sorteo, con sus dos juegos. */
export interface DrawPair {
  baloto: DrawResult | null;
  revancha: DrawResult | null;
}

export interface SavedPlay {
  play: Play;
  /**
   * Resultado del sorteo objetivo, congelado la primera vez que se pudo
   * comparar. Sin esto, la comparación se perdería en cuanto baloto.com
   * pasara a mostrar el sorteo siguiente.
   */
  result?: DrawPair;
}

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

function isDrawResult(value: unknown): value is DrawResult {
  if (typeof value !== 'object' || value === null) return false;
  const { fecha, nums, sb } = value as Partial<DrawResult>;

  return (
    typeof fecha === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(fecha) &&
    Array.isArray(nums) &&
    nums.length === 5 &&
    nums.every((n) => Number.isInteger(n)) &&
    Number.isInteger(sb)
  );
}

function isDrawPair(value: unknown): value is DrawPair {
  if (typeof value !== 'object' || value === null) return false;
  const { baloto, revancha } = value as Partial<DrawPair>;
  const ok = (d: unknown) => d === null || d === undefined || isDrawResult(d);
  return ok(baloto) && ok(revancha) && !!(baloto || revancha);
}

/** Jugada guardada, o null si no hay ninguna o quedó corrupta. */
export function readSaved(): SavedPlay | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);

    // Formato anterior: la jugada suelta, sin resultado adjunto.
    if (isPlay(parsed)) return { play: parsed };

    if (typeof parsed === 'object' && parsed !== null) {
      const { play, result } = parsed as Partial<SavedPlay>;
      if (isPlay(play)) {
        return isDrawPair(result) ? { play, result } : { play };
      }
    }
    return null;
  } catch {
    return null; // JSON inválido o localStorage bloqueado
  }
}

/** Guarda una jugada nueva. Descarta cualquier resultado del sorteo anterior. */
export function savePlay(play: Play): void {
  window.localStorage.setItem(KEY, JSON.stringify({ play } satisfies SavedPlay));
}

/**
 * Congela el resultado del sorteo junto a la jugada, para que la
 * comparación siga disponible cuando baloto.com avance al siguiente.
 */
export function attachResult(result: DrawPair): void {
  const saved = readSaved();
  if (!saved) return;
  window.localStorage.setItem(KEY, JSON.stringify({ play: saved.play, result } satisfies SavedPlay));
}
