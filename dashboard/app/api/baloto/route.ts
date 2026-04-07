import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET() {
  try {
    const response = await fetch('https://www.baloto.com/', {
      next: { revalidate: 60 }, // Revalidate every minute
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    let jackpot = '---';
    
    // Nueva lógica más robusta basada en la estructura actual
    const acc1 = $('.accumulated-1');
    if (acc1.length > 0) {
      const integerEl = acc1.find('.accum-integer').first();
      if (integerEl.length > 0) {
        // Limpiamos espacios, saltos de línea y símbolos
        const raw = integerEl.text().trim().replace(/[\$\n\r]/g, '').trim();
        jackpot = `$${raw} M`;
      }
    }

    // Fallback por si la clase cambió pero el selector genérico funciona
    if (jackpot === '---') {
       const fallback = $('.accum-integer').first().text().trim().replace(/[\$\n\r]/g, '').trim();
       if (fallback) jackpot = `$${fallback} M`;
    }

    return NextResponse.json({ jackpot });
  } catch (error) {
    console.error('Error scraping jackpot:', error);
    return NextResponse.json({ jackpot: '---' });
  }
}
