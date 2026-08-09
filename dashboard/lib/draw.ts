// Lógica de jugadas de Baloto, compartida entre la UI y las rutas API.

export interface Play {
  nums: number[];
  sb: number;
  /** Sorteo (YYYY-MM-DD) para el que se hizo esta jugada. */
  fecha_sorteo: string;
}

export interface DrawResult {
  /** Fecha del sorteo en formato YYYY-MM-DD. */
  fecha: string;
  nums: number[];
  sb: number;
  /** Acumulado del próximo sorteo, ya formateado (p. ej. "$42.800 M"). */
  premio?: string;
}

/** Formatea una fecha local a YYYY-MM-DD (sin desfase de zona horaria). */
export function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Números que la jugada generada debe evitar (los del último sorteo). */
export interface Excluded {
  /** No pueden salir entre los 5 principales. */
  nums?: number[];
  /** No puede salir como super balota. */
  sb?: number[];
}

/** Reúne los números del último sorteo de Baloto y Revancha para excluirlos. */
export function excludedFromDraws(...draws: (DrawResult | null | undefined)[]): Excluded {
  const nums = new Set<number>();
  const sb = new Set<number>();
  for (const d of draws) {
    if (!d) continue;
    d.nums.forEach((n) => nums.add(n));
    sb.add(d.sb);
  }
  return { nums: [...nums], sb: [...sb] };
}

/** Devuelve 1..max quitando los excluidos; si queda muy corto, ignora la exclusión. */
function pool(max: number, excluded: number[] | undefined, minSize: number): number[] {
  const all = Array.from({ length: max }, (_, i) => i + 1);
  if (!excluded?.length) return all;
  const filtered = all.filter((n) => !excluded.includes(n));
  return filtered.length >= minSize ? filtered : all;
}

/** Toma `count` elementos distintos al azar de `from`. */
function sample(from: number[], count: number): number[] {
  const rest = [...from];
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    out.push(...rest.splice(Math.floor(Math.random() * rest.length), 1));
  }
  return out.sort((a, b) => a - b);
}

/**
 * Genera una jugada al azar (combinación uniforme sobre los números permitidos).
 * No existe forma de "ganar más": solo evitamos patrones que mucha
 * gente juega (todo <= 31, secuencias largas) para no repartir el premio,
 * y los números que ya salieron en el último sorteo si se pasan en `excluded`.
 */
export function generateHonestPlay(fecha_sorteo: string, excluded?: Excluded): Play {
  const numPool = pool(43, excluded?.nums, 5);
  // Sin al menos 2 números altos disponibles, la regla de "no todo <= 31"
  // sería imposible de cumplir dentro del pool filtrado.
  const numPoolFinal = numPool.filter((n) => n > 31).length >= 2
    ? numPool
    : Array.from({ length: 43 }, (_, i) => i + 1);

  let nums: number[] = [];
  for (let intento = 0; intento < 500; intento++) {
    nums = sample(numPoolFinal, 5);

    // Evita jugadas 100% "de cumpleaños" (todos <= 31)
    if (nums.filter((n) => n > 31).length < 2) continue;

    // Evita secuencias largas (3+ consecutivos), muy populares
    let run = 1;
    let maxRun = 1;
    for (let i = 1; i < nums.length; i++) {
      run = nums[i] - nums[i - 1] === 1 ? run + 1 : 1;
      if (run > maxRun) maxRun = run;
    }
    if (maxRun < 3) break;
  }

  // La super balota no repite los 5 principales ni las del último sorteo.
  const sbPool = pool(16, [...(excluded?.sb ?? []), ...nums], 1);
  const [sb] = sample(sbPool, 1);

  return { nums, sb, fecha_sorteo };
}

/** Días de sorteo: lunes (1), miércoles (3) y sábado (6). */
const DRAW_DAYS = [1, 3, 6];

/** Hora (Colombia) a partir de la cual el sorteo del día ya se considera realizado. */
const DRAW_HOUR = 23;

/**
 * Fecha y hora actuales en Colombia, sin depender de la zona horaria del
 * dispositivo (el sorteo es a las 11 p.m. hora de Bogotá).
 */
function bogotaNow(): { y: number; m: number; d: number; hour: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { y: get('year'), m: get('month'), d: get('day'), hour: get('hour') };
}

/**
 * Próximo sorteo pendiente. Si hoy es día de sorteo pero ya pasó la hora,
 * salta al siguiente para no guardar una jugada contra un sorteo ya realizado.
 */
export function getNextDrawDate(): Date {
  const { y, m, d, hour } = bogotaNow();
  const desde = hour >= DRAW_HOUR ? 1 : 0;
  for (let i = desde; i <= desde + 7; i++) {
    const cand = new Date(y, m - 1, d + i);
    if (DRAW_DAYS.includes(cand.getDay())) return cand;
  }
  return new Date(y, m - 1, d);
}

/** Compara una jugada contra el resultado: aciertos principales y super balota. */
export function countHits(play: Play, result: DrawResult) {
  const mainHits = play.nums.filter((n) => result.nums.includes(n));
  const sbHit = play.sb === result.sb;
  return { mainHits, sbHit, total: mainHits.length + (sbHit ? 1 : 0) };
}
