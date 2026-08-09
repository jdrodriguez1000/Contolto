# 🎱 Contolto - Baloto

App mínima de una sola pantalla para el sorteo Baloto (Colombia). Sin base de datos ni backend: todo corre en Next.js y guarda tu jugada en un archivo JSON local.

## ¿Qué hace?

1. **Último sorteo** — muestra el número ganador oficial, leído en vivo de [baloto.com](https://www.baloto.com/resultados).
2. **Tu jugada** — muestra la jugada que guardaste y, cuando ese sorteo ya salió, cuántos aciertos tuviste (resaltando los números acertados y la Super Balota).
3. **Próxima jugada** — genera una combinación al azar y, con "Jugué esta", la guarda para el próximo sorteo.

> Una combinación al azar tiene exactamente la misma probabilidad que cualquier "predicción". Lo único que filtramos son patrones que mucha gente juega (todo ≤ 31, secuencias largas), para no repartir el premio si llegara a salir.

## Estructura

```
dashboard/
├── app/
│   ├── page.tsx                # Pantalla única
│   └── api/
│       ├── resultado/route.ts  # Scrapea el último resultado de baloto.com
│       └── jugada/route.ts      # Lee/guarda la jugada en data/jugada.json
├── components/SuggestedPlay.tsx # Generador de la próxima jugada
└── lib/draw.ts                  # Generación de jugadas y conteo de aciertos
```

La jugada guardada vive en `dashboard/data/jugada.json` (ignorado por git, es estado local).

## Uso

```bash
cd dashboard
npm install
npm run dev
```

Abre http://localhost:3000

---
*Juega con responsabilidad.*
