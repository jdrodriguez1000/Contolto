export interface Sorteo {
  id: number | string;
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
  fecha: string;
  tipo: string;
}

export interface RendimientoDetallado {
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

export type TabType = 'resultados' | 'historico' | 'estrategias' | 'rendimiento' | 'analisis';

