# Plan de Implementación - Proyecto Contolto (v2)

Este documento detalla el progreso y los siguientes pasos para la migración y evolución del sistema de predicción de Baloto a una arquitectura basada en la nube (Supabase).

## Fase 1: Infraestructura y Datos (Completada ✅)
- [x] Configuración de tablas en Supabase (`historial`, `juegos`, `rendimiento`).
- [x] Migración de datos históricos (1,068 registros).
- [x] Migración de juegos generados previamente (71 registros).
- [x] Cálculo inicial de rendimiento y población de la tabla `rendimiento`.

## Fase 2: Lógica de Negocio en la Nube (En Progreso 🏗️)
- [ ] **2.1: Repositorio de Datos (`db_provider.py`)**: Centralizar las consultas a Supabase. Debe incluir la detección automática de la "Estrategia Ganadora" (MSS).
- [ ] **2.2: Analizador Estadístico Cloud**: Portar la lógica de `analyzer.py` para obtener Números Calientes y Fríos desde la DB.
- [ ] **2.3: Motor de Generación Base**: Implementar las 4 estrategias (Fria, Caliente, Mixta, Balanceada).
- [ ] **2.4: Generador de Estrategia "Real" (Regla 80/20)**: 
    - Tomar el **80% de los números** (4 balotas) de la estrategia con mejor rendimiento actual.
    - Tomar el **20% de los números** (1 balota) de la estrategia "Caliente".
    - Sincronizar la Superbola con la tendencia de la mejor estrategia.
- [ ] **2.5: Sistema de Aprendizaje**: Refinar los pesos basados en el historial acumulado en `rendimiento`.

## Fase 3: Automatización y Reportes
- [ ] **3.1: Actualizador Automático**: Script que descargue los nuevos sorteos (miércoles y sábados) y los suba a Supabase.
- [ ] **3.2: Generador de Dashboard**: Reporte de rendimiento visual (posiblemente en Flet o una vista de Supabase).

## Notas Técnicas
- **Tecnologías**: Python 3.10+, Supabase (PostgreSQL), MCP-Server.
- **Estrategia de Datos**: Se prioriza la lectura de la base de datos sobre archivos CSV locales para mantener una única fuente de verdad.
- **Lógica Real**: Se basa en el principio de Pareto (80/20) combinando estabilidad histórica con tendencia inmediata.
