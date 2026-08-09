# 🎱 Contolto - Baloto

App mínima de una sola pantalla para el sorteo Baloto (Colombia). Sin base de datos ni backend: todo corre en Next.js y tu jugada se guarda en el navegador.

## ¿Qué hace?

1. **Último sorteo** — muestra el número ganador oficial, leído en vivo de [baloto.com](https://www.baloto.com/resultados).
2. **Tu jugada** — muestra la jugada que guardaste y, cuando ese sorteo ya salió, cuántos aciertos tuviste (resaltando los números acertados y la Super Balota).
3. **Próxima jugada** — genera una combinación al azar y, con "Mi Jugada", la guarda para el próximo sorteo.

> Una combinación al azar tiene exactamente la misma probabilidad que cualquier "predicción". Lo único que filtramos son patrones que mucha gente juega, para no repartir el premio si llegara a salir.

## Reglas de la jugada generada

- Al menos 2 números mayores a 31 (evita jugadas 100% "de cumpleaños").
- Sin 3 o más números consecutivos.
- La super balota no repite ninguno de los 5 números principales.
- Se excluyen los números y las super balotas del último sorteo.

El sorteo objetivo se calcula en hora de Colombia (lunes, miércoles y sábado) y salta al siguiente pasadas las 11 p.m., para no guardar una jugada contra un sorteo ya realizado.

## Estructura

```
dashboard/
├── app/
│   ├── page.tsx                    # Pantalla única
│   └── api/resultado/route.ts      # Scrapea el último resultado de baloto.com
├── components/SuggestedPlay.tsx    # Generador de la próxima jugada
└── lib/
    ├── draw.ts                     # Generación de jugadas y conteo de aciertos
    └── storage.ts                  # Persistencia en localStorage
```

La jugada se guarda en `localStorage` bajo la clave `contolto:jugada`, así que vive en el navegador de cada dispositivo. No hay estado en el servidor.

## Uso

```bash
cd dashboard
npm install
npm run dev
```

Abre http://localhost:3000

---
*Juega con responsabilidad.*
