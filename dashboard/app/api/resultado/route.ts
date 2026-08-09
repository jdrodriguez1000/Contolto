import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import type { DrawResult } from '@/lib/draw';

const MESES: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

/** Convierte "Sábado 7 de Junio 2025" -> "2025-06-07". */
function parseFecha(texto: string): string | null {
  const tokens = texto.replace(/de /gi, '').trim().split(/\s+/).filter(Boolean);
  for (let i = 0; i < tokens.length - 2; i++) {
    const dia = parseInt(tokens[i], 10);
    const mes = MESES[tokens[i + 1]?.toLowerCase()];
    const anio = parseInt(tokens[i + 2], 10);
    if (dia && mes && anio) {
      return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    }
  }
  return null;
}

export async function GET() {
  try {
    const response = await fetch('https://www.baloto.com/resultados', {
      next: { revalidate: 300 }, // cache 5 min
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Tomamos el más reciente de cada juego (la tabla viene de más nuevo a más viejo).
    let baloto: DrawResult | null = null;
    let revancha: DrawResult | null = null;

    $('#results-table tbody tr').each((_, row) => {
      if (baloto && revancha) return;

      const cols = $(row).find('td');
      if (cols.length < 3) return;

      const src = $(cols[0]).find('img').attr('src') || '';
      const esBaloto = src.includes('baloto-kind.png');
      const esRevancha = src.includes('revancha-kind.png');
      if (!esBaloto && !esRevancha) return;
      if (esBaloto && baloto) return;
      if (esRevancha && revancha) return;

      const fecha = parseFecha($(cols[1]).text());
      const numsRaw = $(cols[2]).text().trim().split('-').map((n) => parseInt(n.trim(), 10));

      if (fecha && numsRaw.length === 6 && numsRaw.every((n) => !isNaN(n))) {
        const result: DrawResult = {
          fecha,
          nums: numsRaw.slice(0, 5).sort((a, b) => a - b),
          sb: numsRaw[5],
        };
        if (esBaloto) baloto = result;
        else revancha = result;
      }
    });

    if (!baloto && !revancha) {
      return NextResponse.json(
        { error: 'No se pudo leer el último resultado de baloto.com' },
        { status: 502 },
      );
    }

    // Acumulado del próximo sorteo (banner inferior): mapeamos por título
    // para no depender del orden ("BALOTO" $42.800 · "REVANCHA" $5.400).
    $('.next-contest-new').each((_, el) => {
      const $el = $(el);
      const valor = $el.text().trim();             // p. ej. "$42.800"
      const titulo = $el
        .closest('.text-center')
        .find('.title-next-contest')
        .text()
        .trim()
        .toUpperCase();
      if (!valor) return;

      const premio = `${valor} M`;                 // "$42.800 M"
      if (titulo.includes('REVANCHA') && revancha) revancha.premio = premio;
      else if (titulo.includes('BALOTO') && baloto) baloto.premio = premio;
    });

    return NextResponse.json({ baloto, revancha });
  } catch (error) {
    console.error('Error scraping resultado:', error);
    return NextResponse.json(
      { error: 'Error al consultar baloto.com' },
      { status: 500 },
    );
  }
}
