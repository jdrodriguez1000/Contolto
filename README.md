# 🎱 Contolto v2 - Inteligencia Predictiva para Baloto

Contolto es un sistema avanzado de análisis y recomendación para el sorteo Baloto (Colombia), potenciado por una arquitectura de datos en la nube (Supabase) y una interfaz moderna desplegada en Vercel.

## 🌐 Dashboard Oficial
Accede al panel de control en tiempo real:
👉 **[https://contolto.vercel.app/](https://contolto.vercel.app/)**

---

## 🚀 Características Principales

- **Dashboard Premium Web**: Interfaz profesional desarrollada en Next.js con visualización de KPIs, ranking de estrategias y predicciones en tiempo real.
- **Conexión Cloud Nativa**: Integración total con Supabase para almacenamiento histórico y gestión de juegos.
- **Motor Multiestratégica**: Generación de jugadas basadas en 5 perfiles distintos:
  - `CALIENTE`: Basado en números de alta frecuencia.
  - `FRÍA`: Números con mayor tiempo sin salir (Gaps).
  - `MIXTA`: Combinación híbrida de tendencias.
  - `BALANCEADA`: Distribución estadística uniforme por rangos.
  - `REAL`: Estrategia optimizada según el rendimiento histórico real.
- **Scraper Automatizado**: Actualización de resultados directamente desde el portal oficial de Baloto.
- **CI/CD Integrado**: Automatización mediante GitHub Actions para validar la calidad del código.

## 📁 Estructura del Proyecto

```bash
├── dashboard/              # Aplicación Web (Next.js + Tailwind CSS)
├── core_v2/                # Motor principal (Python)
│   ├── db_provider.py      # Gestor de conexión a Supabase
│   ├── game_generator.py   # Cerebro predictivo
│   ├── update_results.py   # Scraper y calificador
│   └── performance_report.py # Generador de informes
├── .github/workflows/      # Automatización (CI/CD)
├── reports/                # Salidas del sistema (JSON y TXT)
├── requirements.txt        # Dependencias de Python
└── .env                    # Variables de entorno (Protegido)
```

## 🛠️ Instalación y Uso

### 1. Backend (Python)
```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Frontend (Dashboard)
```bash
cd dashboard
npm install
npm run dev
```

## 📊 Estrategia Ganadora
El sistema prioriza actualmente la estrategia **REAL**, la cual se adapta dinámicamente a los últimos comportamientos de la tómbola basándose en el historial de aciertos almacenado en Supabase.

---
*Desarrollado para análisis estadístico. Juega con responsabilidad.*
