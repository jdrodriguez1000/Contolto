# 🎱 Contolto v2 - Inteligencia Predictiva para Baloto

Contolto es un sistema avanzado de análisis y recomendación para el sorteo Baloto (Colombia), potenciado por una arquitectura de datos en la nube (Supabase) y algoritmos de tendencia estadística.

## 🚀 Características Principales

- **Conexión Cloud Nactiva**: Integración total con Supabase para almacenamiento histórico y gestión de juegos en tiempo real.
- **Motor Multiestratégica**: Generación de jugadas basadas en 5 perfiles distintos:
  - `CALIENTE`: Basado en números de alta frecuencia.
  - `FRÍA`: Números con mayor tiempo sin salir (Gaps).
  - `MIXTA`: Combinación híbrida de tendencias.
  - `BALANCEADA`: Distribución estadística uniforme por rangos.
  - `REAL`: Estrategia optimizada según el rendimiento histórico real.
- **Scraper Automatizado**: Actualización automática de resultados directamente desde el portal oficial de Baloto.
- **Reportes de Rendimiento**: Seguimiento detallado de aciertos y efectividad de cada estrategia.

## 📁 Estructura del Proyecto

```bash
├── core_v2/                # Motor principal del sistema
│   ├── db_provider.py      # Gestor de conexión a Supabase
│   ├── game_generator.py   # Cerebro predictivo y generador de juegos
│   ├── update_results.py   # Scraper y calificador de rendimiento
│   └── performance_report.py # Generador de informes detallados
├── reports/                # Salidas del sistema (JSON y TXT)
├── requirements.txt        # Dependencias del proyecto
└── .env                    # Variables de entorno (Privado/Protegido)
```

## 🛠️ Instalación y Uso

1. **Clonar el repositorio y entrar:**
   ```bash
   git clone https://github.com/jdrodriguez1000/Contolto.git
   cd Contolto
   ```

2. **Configurar entorno virtual:**
   ```bash
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Variables de Entorno:**
   Crea un archivo `.env` en la raíz con:
   ```env
   SUPABASE_URL=tu_url_aqui
   SUPABASE_ANON_KEY=tu_llave_aqui
   ```

4. **Ejecutar Funciones:**
   - Generar juegos: `python -m core_v2.game_generator`
   - Actualizar resultados: `python -m core_v2.update_results`
   - Ver rendimiento: `python -m core_v2.performance_report`

## 📊 Estrategia Ganadora
El sistema prioriza actualmente la estrategia **REAL**, la cual ha demostrado un promedio de aciertos superior al adaptarse dinámicamente a los últimos comportamientos de la tómbola.

---
*Desarrollado para análisis estadístico. Juega con responsabilidad.*
