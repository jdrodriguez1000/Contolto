# new_game.py - VERSIÓN 3.0: USANDO DATOS DINÁMICOS DEL ANÁLISIS
# ============================================================================

"""
new_game.py - Generador optimizado que usa datos REALES del análisis
Versión 3.0: Dinámico - usa números frecuentes actuales del análisis JSON
"""

import random
import csv
import os
import json
import sys
from datetime import datetime
from collections import Counter, defaultdict
import argparse
from typing import Dict, List, Tuple, Optional

# ============================================================================
# CONFIGURACIÓN DEL SISTEMA CON RUTAS ACTUALIZADAS
# ============================================================================

HISTORICO_CSV = "data/baloto_historico_completo.csv"
MIS_JUEGOS_CSV = "data/mis_juegos_generados.csv"
ANALISIS_JSON = "reports/analisis_baloto.json"
RECOMENDACIONES_JSON = "reports/recomendaciones_actuales.json"

NUM_MIN_PRINCIPALES = 1
NUM_MAX_PRINCIPALES = 43
CANTIDAD_PRINCIPALES = 5

NUM_MIN_SUPERBALOTA = 1
NUM_MAX_SUPERBALOTA = 16
CANTIDAD_SUPERBALOTA = 1

ESTRATEGIAS_VALIDAS = ["caliente", "fria", "balanceada", "mixta", "optimizada"]  # ← NUEVA!

# ============================================================================
# CLASE PRINCIPAL: GENERADOR CON DATOS DINÁMICOS
# ============================================================================

class GeneradorBalotoDinamico:
    """Genera combinaciones usando datos ACTUALES del análisis"""
    
    def __init__(self, estrategia: str = "balanceada"):
        self.estrategia = estrategia.lower()
        if self.estrategia not in ESTRATEGIAS_VALIDAS:
            raise ValueError(f"Estrategia '{estrategia}' no válida. Use: {ESTRATEGIAS_VALIDAS}")
        
        self.analisis = None
        self.recomendaciones = None
        self.datos_historicos = None
        self.historico_combinaciones = set()
        self.cargar_datos_dinamicos()
    
    def cargar_datos_dinamicos(self):
        """Carga datos ACTUALES del análisis y recomendaciones"""
        print(f"🔧 Inicializando generador con estrategia: {self.estrategia.upper()}")
        
        # 1. Cargar análisis estadístico
        if os.path.exists(ANALISIS_JSON):
            try:
                with open(ANALISIS_JSON, 'r', encoding='utf-8') as f:
                    self.analisis = json.load(f)
                print(f"✅ Análisis cargado: {ANALISIS_JSON}")
            except Exception as e:
                print(f"❌ Error cargando análisis: {e}")
                self.analisis = self._crear_analisis_default()
        else:
            print(f"⚠️  No se encontró análisis. Ejecuta analyzer.py primero")
            self.analisis = self._crear_analisis_default()
        
        # 2. Cargar recomendaciones actuales
        if os.path.exists(RECOMENDACIONES_JSON):
            try:
                with open(RECOMENDACIONES_JSON, 'r', encoding='utf-8') as f:
                    self.recomendaciones = json.load(f)
                print(f"✅ Recomendaciones cargadas: {RECOMENDACIONES_JSON}")
            except Exception as e:
                print(f"⚠️  Error cargando recomendaciones: {e}")
                self.recomendaciones = None
        else:
            print(f"⚠️  No hay recomendaciones actuales")
            self.recomendaciones = None
        
        # 3. Extraer datos dinámicos
        self.datos_historicos = self._extraer_datos_dinamicos()
        
        # 4. Cargar combinaciones históricas
        self.cargar_combinaciones_historicas()
        self._mostrar_resumen_estrategia()
    
    def _extraer_datos_dinamicos(self) -> Dict:
        """Extrae datos dinámicos del análisis actual"""
        datos = {
            'numeros_calientes': [],
            'numeros_frios': [],
            'superbalotas_frecuentes': [],
            'mejores_numeros': [],
            'patrones': {}
        }
        
        # Extraer del análisis
        if self.analisis:
            # Números calientes del análisis
            if 'frecuencias' in self.analisis and 'top_20_calientes' in self.analisis['frecuencias']:
                calientes = self.analisis['frecuencias']['top_20_calientes']
                datos['numeros_calientes'] = [num for num, _ in calientes[:15]]  # Top 15
            
            # Números fríos del análisis
            if 'frecuencias' in self.analisis and 'top_10_frios' in self.analisis['frecuencias']:
                frios = self.analisis['frecuencias']['top_10_frios']
                datos['numeros_frios'] = [num for num, _ in frios]
            
            # Superbalotas frecuentes
            if 'frecuencias' in self.analisis and 'top_5_superbalotas' in self.analisis['frecuencias']:
                sb_frec = self.analisis['frecuencias']['top_5_superbalotas']
                datos['superbalotas_frecuentes'] = [sb for sb, _ in sb_frec]
        
        # Extraer de recomendaciones
        if self.recomendaciones:
            if 'numbers' in self.recomendaciones:
                datos['mejores_numeros'] = self.recomendaciones['numbers'][:10]
            
            if 'superballots' in self.recomendaciones:
                if not datos['superbalotas_frecuentes']:  # Si no hay del análisis
                    datos['superbalotas_frecuentes'] = self.recomendaciones['superballots']
        
        # Si no hay datos, usar valores por defecto basados en histórico
        if not datos['numeros_calientes']:
            datos['numeros_calientes'] = [9, 43, 21, 5, 2, 25, 42, 14, 32, 22]
        
        if not datos['numeros_frios']:
            # Fríos = números que NO están en calientes
            todos = list(range(1, 44))
            datos['numeros_frios'] = [n for n in todos if n not in datos['numeros_calientes']][:15]
        
        if not datos['superbalotas_frecuentes']:
            datos['superbalotas_frecuentes'] = [13, 11, 6, 7, 9]
        
        if not datos['mejores_numeros']:
            datos['mejores_numeros'] = datos['numeros_calientes'][:8]
        
        print(f"📊 Datos dinámicos extraídos:")
        print(f"   • {len(datos['numeros_calientes'])} números calientes")
        print(f"   • {len(datos['numeros_frios'])} números fríos")
        print(f"   • {len(datos['superbalotas_frecuentes'])} superbalotas frecuentes")
        print(f"   • {len(datos['mejores_numeros'])} mejores números recomendados")
        
        return datos
    
    def _crear_analisis_default(self):
        """Crea análisis por defecto"""
        return {
            'frecuencias': {
                'top_20_calientes': [(i, 1) for i in range(1, 21)],
                'top_10_frios': [(i, 1) for i in range(34, 44)],
                'top_5_superbalotas': [(i, 1) for i in [13, 11, 6, 7, 9]]
            }
        }
    
    def cargar_combinaciones_historicas(self):
        """Carga combinaciones históricas para evitar duplicados"""
        self.historico_combinaciones = set()
        
        if not os.path.exists(HISTORICO_CSV):
            print(f"⚠️  No se encontró histórico: {HISTORICO_CSV}")
            return
        
        try:
            with open(HISTORICO_CSV, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    if row.get('tipo') == 'Baloto':
                        numeros = sorted([
                            int(row['num1']), int(row['num2']), int(row['num3']),
                            int(row['num4']), int(row['num5'])
                        ])
                        sb = int(row['num6'])
                        combinacion_str = "-".join(map(str, numeros)) + f"-{sb}"
                        self.historico_combinaciones.add(combinacion_str)
            
            print(f"✅ {len(self.historico_combinaciones)} combinaciones históricas cargadas")
        except Exception as e:
            print(f"❌ Error cargando histórico: {e}")
    
    def _mostrar_resumen_estrategia(self):
        """Muestra resumen de la estrategia con datos actuales"""
        print(f"\n🎯 ESTRATEGIA: {self.estrategia.upper()}")
        print(f"   {'─' * 40}")
        
        if self.estrategia == "caliente":
            print(f"   • Prioridad: Números más frecuentes históricamente")
            print(f"   • Números actuales: {self.datos_historicos['numeros_calientes'][:5]}")
            print(f"   • Superbalota: Mayoría de {self.datos_historicos['superbalotas_frecuentes'][:3]}")
        
        elif self.estrategia == "fria":
            print(f"   • Prioridad: Números menos frecuentes históricamente")
            print(f"   • Números actuales: {self.datos_historicos['numeros_frios'][:5]}")
            print(f"   • Superbalota: Evita frecuentes, usa infrecuentes")
        
        elif self.estrategia == "balanceada":
            print(f"   • Prioridad: Mezcla inteligente de calientes y fríos")
            print(f"   • Calientes actuales: {self.datos_historicos['numeros_calientes'][:3]}")
            print(f"   • Fríos actuales: {self.datos_historicos['numeros_frios'][:3]}")
        
        elif self.estrategia == "mixta":
            print(f"   • Prioridad: Optimización con múltiples criterios")
            print(f"   • Mejores números: {self.datos_historicos['mejores_numeros'][:5]}")
        
        elif self.estrategia == "optimizada":
            print(f"   • ⭐ NUEVA ESTRATEGIA AVANZADA")
            print(f"   • Usa: Top 3 actuales + patrones aprendidos")
            print(f"   • Objetivo: Maximizar probabilidad de aciertos")
    
    # ============================================================================
    # GENERACIÓN DINÁMICA DE SUPERBALOTA
    # ============================================================================
    
    def generar_superbalota_dinamica(self, estrategia: str) -> int:
        """Genera Superbalota usando datos ACTUALES del análisis"""
        
        sb_frecuentes = self.datos_historicos['superbalotas_frecuentes']
        
        if estrategia == "caliente":
            # 90% chance de top 3 actuales, 10% de top 5
            if random.random() < 0.9:
                return random.choice(sb_frecuentes[:3])  # Top 3 actuales
            else:
                return random.choice(sb_frecuentes[:5])
        
        elif estrategia == "fria":
            # Fríos = evitar los frecuentes
            todos_sb = list(range(1, 17))
            infrecuentes = [sb for sb in todos_sb if sb not in sb_frecuentes[:8]]
            return random.choice(infrecuentes) if infrecuentes else random.choice(todos_sb)
        
        elif estrategia == "balanceada":
            rand = random.random()
            if rand < 0.7:  # 70% frecuentes
                return random.choice(sb_frecuentes[:5])
            elif rand < 0.9:  # 20% medias
                return random.choice(sb_frecuentes[5:10] if len(sb_frecuentes) > 5 else list(range(1, 17)))
            else:  # 10% infrecuentes
                return random.choice([1, 2, 3, 4, 5])
        
        elif estrategia == "mixta":
            # Distribución proporcional a frecuencias actuales
            pesos = [8, 8, 7, 7, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 1]
            todos_sb = list(range(1, 17))
            return random.choices(todos_sb, weights=pesos[:16], k=1)[0]
        
        else:  # optimizada
            # Siempre usa las más frecuentes actuales
            return sb_frecuentes[0]  # La más frecuente
    
    # ============================================================================
    # NUEVOS MÉTODOS DE GENERACIÓN DINÁMICOS
    # ============================================================================
    
    def generar_combinacion_caliente_dinamica(self) -> Tuple[List[int], int]:
        """Genera combinación caliente usando datos ACTUALES"""
        
        calientes = self.datos_historicos['numeros_calientes'][:12]  # Top 12 actuales
        
        # ESTRATEGIA MEJORADA: Incluir al menos 3 del top 5 actual
        top_5_actual = self.datos_historicos['numeros_calientes'][:5]
        numeros = random.sample(top_5_actual, min(3, len(top_5_actual)))
        
        # Completar con otros calientes
        otros_calientes = [c for c in calientes if c not in numeros]
        if len(numeros) < 5 and otros_calientes:
            faltan = 5 - len(numeros)
            numeros.extend(random.sample(otros_calientes, min(faltan, len(otros_calientes))))
        
        # Si aún faltan, completar aleatoriamente
        if len(numeros) < 5:
            disponibles = [n for n in range(1, 44) if n not in numeros]
            numeros.extend(random.sample(disponibles, 5 - len(numeros)))
        
        superbalota = self.generar_superbalota_dinamica("caliente")
        
        return sorted(numeros), superbalota
    
    def generar_combinacion_fria_dinamica(self) -> Tuple[List[int], int]:
        """Genera combinación fría usando datos ACTUALES"""
        
        frios = self.datos_historicos['numeros_frios'][:15]  # Top 15 fríos actuales
        
        # Incluir 4 números fríos
        n_frios = 4
        numeros = random.sample(frios, min(n_frios, len(frios)))
        
        # Incluir 1 número caliente para balance
        calientes = self.datos_historicos['numeros_calientes']
        if calientes and len(numeros) < 5:
            caliente = random.choice(calientes[:5])
            if caliente not in numeros:
                numeros.append(caliente)
        
        # Completar si faltan
        if len(numeros) < 5:
            disponibles = [n for n in range(1, 44) if n not in numeros]
            numeros.extend(random.sample(disponibles, 5 - len(numeros)))
        
        superbalota = self.generar_superbalota_dinamica("fria")
        
        return sorted(numeros), superbalota
    
    def generar_combinacion_balanceada_dinamica(self) -> Tuple[List[int], int]:
        """Genera combinación balanceada usando datos ACTUALES"""
        
        calientes = self.datos_historicos['numeros_calientes'][:10]
        frios = self.datos_historicos['numeros_frios'][:10]
        
        # Balance: 3 calientes, 2 fríos
        n_calientes = 3
        n_frios = 2
        
        seleccion_calientes = random.sample(calientes, min(n_calientes, len(calientes)))
        seleccion_frios = random.sample(frios, min(n_frios, len(frios)))
        
        numeros = seleccion_calientes + seleccion_frios
        
        # Asegurar 5 números únicos
        if len(set(numeros)) < 5:
            disponibles = [n for n in range(1, 44) if n not in numeros]
            while len(numeros) < 5 and disponibles:
                numeros.append(random.choice(disponibles))
                disponibles = [n for n in range(1, 44) if n not in numeros]
        
        superbalota = self.generar_superbalota_dinamica("balanceada")
        
        return sorted(numeros), superbalota
    
    def generar_combinacion_mixta_dinamica(self) -> Tuple[List[int], int]:
        """Genera combinación mixta usando datos ACTUALES"""
        
        mejores = self.datos_historicos['mejores_numeros'][:8]
        
        # ESTRATEGIA MEJORADA: Evaluar múltiples combinaciones
        mejor_combinacion = None
        mejor_puntaje = -1
        
        for _ in range(50):
            # Usar principalmente los mejores números
            if len(mejores) >= 5:
                base_numeros = random.sample(mejores, 3)
            else:
                base_numeros = mejores.copy()
            
            # Completar aleatoriamente
            disponibles = [n for n in range(1, 44) if n not in base_numeros]
            if len(base_numeros) < 5 and disponibles:
                base_numeros.extend(random.sample(disponibles, 5 - len(base_numeros)))
            
            numeros = sorted(base_numeros)
            superbalota = self.generar_superbalota_dinamica("mixta")
            
            puntaje = self._calcular_puntaje_avanzado(numeros, superbalota)
            
            if puntaje > mejor_puntaje:
                mejor_puntaje = puntaje
                mejor_combinacion = (numeros, superbalota)
        
        return mejor_combinacion if mejor_combinacion else (sorted(random.sample(range(1, 44), 5)), 
                                                          self.generar_superbalota_dinamica("mixta"))
    
    def generar_combinacion_optimizada(self) -> Tuple[List[int], int]:
        """⭐ NUEVA: Estrategia optimizada avanzada"""
        
        # 1. OBLIGATORIO: Incluir el número #1 actual
        top_actual = self.datos_historicos['numeros_calientes'][:3]  # Top 3 actuales
        numeros = [top_actual[0]] if top_actual else []
        
        # 2. Incluir al menos 2 del top 5 actual
        top_5 = self.datos_historicos['numeros_calientes'][:5]
        posibles = [n for n in top_5 if n not in numeros]
        if len(numeros) < 3 and posibles:
            agregar = min(2, len(posibles), 3 - len(numeros))
            numeros.extend(random.sample(posibles, agregar))
        
        # 3. Incluir 1 número "prometedor" (frecuente pero no en top actual)
        if len(numeros) < 4:
            calientes_restantes = [c for c in self.datos_historicos['numeros_calientes'][5:10] 
                                 if c not in numeros]
            if calientes_restantes:
                numeros.append(random.choice(calientes_restantes))
        
        # 4. Completar con número balanceador (para paridad/suma)
        if len(numeros) < 5:
            # Buscar número que optimice paridad y suma
            candidatos = []
            for n in range(1, 44):
                if n not in numeros:
                    # Calcular proyección
                    numeros_proyectados = numeros + [n]
                    pares = sum(1 for num in numeros_proyectados if num % 2 == 0)
                    suma = sum(numeros_proyectados)
                    
                    # Puntuar según optimización
                    puntaje = 0
                    if 2 <= pares <= 3:
                        puntaje += 10
                    if 95 <= suma <= 125:
                        puntaje += 10
                    if n in self.datos_historicos['mejores_numeros']:
                        puntaje += 5
                    
                    candidatos.append((n, puntaje))
            
            if candidatos:
                candidatos.sort(key=lambda x: x[1], reverse=True)
                mejores_candidatos = [c[0] for c in candidatos[:5]]
                numeros.append(random.choice(mejores_candidatos))
        
        # 5. Asegurar 5 números únicos
        if len(set(numeros)) < 5:
            numeros = list(set(numeros))
            disponibles = [n for n in range(1, 44) if n not in numeros]
            while len(numeros) < 5 and disponibles:
                numeros.append(random.choice(disponibles))
        
        # Superbalota optimizada (la más frecuente actual)
        superbalota = self.datos_historicos['superbalotas_frecuentes'][0] if \
                     self.datos_historicos['superbalotas_frecuentes'] else 13
        
        return sorted(numeros), superbalota
    
    def _calcular_puntaje_avanzado(self, numeros: List[int], superbalota: int) -> float:
        """Calcula puntaje avanzado usando datos ACTUALES"""
        puntaje = 0
        
        # 1. Balance de pares/impares
        pares = sum(1 for n in numeros if n % 2 == 0)
        if 2 <= pares <= 3:
            puntaje += 25
        
        # 2. Suma en rango óptimo
        suma = sum(numeros)
        if 95 <= suma <= 125:
            puntaje += 30
        elif 90 <= suma <= 130:
            puntaje += 20
        
        # 3. Incluir números calientes ACTUALES
        calientes_actuales = self.datos_historicos['numeros_calientes'][:10]
        calientes_en_combinacion = sum(1 for n in numeros if n in calientes_actuales)
        puntaje += calientes_en_combinacion * 8  # Más peso que antes
        
        # 4. Incluir números recomendados ACTUALES
        recomendados = self.datos_historicos['mejores_numeros'][:8]
        recomendados_en_combinacion = sum(1 for n in numeros if n in recomendados)
        puntaje += recomendados_en_combinacion * 10  # Máximo peso
        
        # 5. Superbalota optimizada ACTUAL
        sb_frecuentes = self.datos_historicos['superbalotas_frecuentes'][:5]
        if superbalota in sb_frecuentes:
            puntaje += 25  # Más peso que antes
        
        # 6. Distribución en rangos
        bajos = sum(1 for n in numeros if 1 <= n <= 15)
        medios = sum(1 for n in numeros if 16 <= n <= 28)
        altos = sum(1 for n in numeros if 29 <= n <= 43)
        
        if bajos >= 1 and medios >= 1 and altos >= 1:
            puntaje += 20
        
        return puntaje
    
    # ============================================================================
    # MÉTODO PRINCIPAL DE GENERACIÓN
    # ============================================================================
    
    def generar(self, max_intentos: int = 10000) -> Optional[Dict]:
        """Genera una combinación única y optimizada"""
        print(f"\n🎲 Generando combinación (estrategia: {self.estrategia.upper()})...")
        print(f"   📊 Usando datos actuales del análisis")
        
        for intento in range(1, max_intentos + 1):
            # Seleccionar método según estrategia
            if self.estrategia == "caliente":
                numeros, superbalota = self.generar_combinacion_caliente_dinamica()
            elif self.estrategia == "fria":
                numeros, superbalota = self.generar_combinacion_fria_dinamica()
            elif self.estrategia == "balanceada":
                numeros, superbalota = self.generar_combinacion_balanceada_dinamica()
            elif self.estrategia == "mixta":
                numeros, superbalota = self.generar_combinacion_mixta_dinamica()
            elif self.estrategia == "optimizada":
                numeros, superbalota = self.generar_combinacion_optimizada()
            else:
                # Fallback
                numeros = sorted(random.sample(range(1, 44), 5))
                superbalota = random.randint(1, 16)
            
            combinacion_str = "-".join(map(str, numeros)) + f"-{superbalota}"
            
            # Verificar que no sea histórica
            if combinacion_str not in self.historico_combinaciones:
                puntaje_final = self._calcular_puntaje_avanzado(numeros, superbalota)
                suma = sum(numeros)
                pares = sum(1 for n in numeros if n % 2 == 0)
                
                # Criterios de aceptación más flexibles
                if 90 <= suma <= 130 and 1 <= pares <= 4:
                    print(f"✅ Combinación única encontrada en intento {intento}")
                    print(f"   Puntaje: {puntaje_final}/140")
                    print(f"   Números actuales usados: {[n for n in numeros if n in self.datos_historicos['numeros_calientes'][:10]]}")
                    
                    return {
                        'num1': numeros[0],
                        'num2': numeros[1],
                        'num3': numeros[2],
                        'num4': numeros[3],
                        'num5': numeros[4],
                        'num6': superbalota,
                        'estrategia': self.estrategia,
                        'puntaje': puntaje_final,
                        'suma': suma,
                        'pares': pares,
                        'combinacion_str': combinacion_str,
                        'version_generador': '3.0-dinamico'
                    }
            
            if intento % 2000 == 0:
                print(f"   Intentos: {intento}...")
        
        print(f"❌ No se pudo generar combinación única después de {max_intentos} intentos")
        return None

# ============================================================================
# FUNCIONES AUXILIARES (MANTENIDAS)
# ============================================================================

def parse_fecha(fecha_str: str) -> datetime:
    try:
        return datetime.strptime(fecha_str, '%d-%m-%Y')
    except ValueError:
        raise ValueError(f"Formato de fecha inválido: '{fecha_str}'. Use DD-MM-AAAA")

def guardar_juego(juego: Dict, fecha_juego: str):
    """Guarda el juego en el archivo CSV con manejo de carpeta"""
    
    # CONVERTIR fecha_juego de "DD-MM-AAAA" a "D de Mes de AAAA"
    try:
        fecha_dt = datetime.strptime(fecha_juego, "%d-%m-%Y")
        
        meses = {
            1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
            5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
            9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
        }
        
        fecha_formateada = f"{fecha_dt.day} de {meses[fecha_dt.month]} de {fecha_dt.year}"
    except Exception as e:
        print(f"⚠️  Error convirtiendo fecha: {e}")
        fecha_formateada = fecha_juego
    
    datos_guardar = {
        'fecha_juego': fecha_formateada,
        'num1': juego['num1'],
        'num2': juego['num2'],
        'num3': juego['num3'],
        'num4': juego['num4'],
        'num5': juego['num5'],
        'num6': juego['num6'],
        'estrategia': juego.get('estrategia', 'desconocida'),
        'puntaje': juego.get('puntaje', 0),
        'suma': juego.get('suma', 0),
        'pares': juego.get('pares', 0),
        'fecha_generacion': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'version': juego.get('version_generador', '3.0')
    }
    
    datos_existentes = []
    encabezados = list(datos_guardar.keys())
    
    os.makedirs(os.path.dirname(MIS_JUEGOS_CSV), exist_ok=True)
    
    if os.path.exists(MIS_JUEGOS_CSV):
        try:
            with open(MIS_JUEGOS_CSV, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    datos_existentes.append(row)
        except Exception as e:
            print(f"⚠️  Error leyendo archivo existente: {e}")
    
    datos_existentes.insert(0, datos_guardar)
    
    try:
        with open(MIS_JUEGOS_CSV, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=encabezados)
            writer.writeheader()
            writer.writerows(datos_existentes)
        
        print(f"✅ Juego guardado en: {MIS_JUEGOS_CSV}")
        print(f"   • Fecha: {fecha_formateada}")
        print(f"   • Estrategia: {juego.get('estrategia', 'N/A')}")
        print(f"   • Puntaje: {juego.get('puntaje', 'N/A')}")
        
    except Exception as e:
        print(f"❌ Error guardando juego: {e}")

def mostrar_combinacion(juego: Dict, fecha_juego: str):
    print(f"\n{'='*60}")
    print(f"🎉 ¡COMBINACIÓN GENERADA CON ÉXITO!")
    print(f"{'='*60}")
    
    print(f"📅 Fecha del juego: {fecha_juego}")
    print(f"🎯 Estrategia: {juego.get('estrategia', 'N/A').upper()}")
    print(f"⭐ Puntaje: {juego.get('puntaje', 'N/A')}/140")
    print(f"🔢 NÚMEROS PRINCIPALES:")
    print(f"   {juego['num1']:2d} - {juego['num2']:2d} - {juego['num3']:2d} - "
          f"{juego['num4']:2d} - {juego['num5']:2d}")
    print(f"🎱 SUPERBALOTA: {juego['num6']}")
    print(f"📊 ESTADÍSTICAS:")
    print(f"   • Suma total: {juego.get('suma', 'N/A')}")
    print(f"   • Números pares: {juego.get('pares', 'N/A')}/5")
    print(f"   • Única en histórico: ✅")
    print(f"{'='*60}")
    print(f"🎰 ¡MUCHA SUERTE!")
    print(f"{'='*60}")

# ============================================================================
# FUNCIÓN PRINCIPAL
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description='Generador dinámico de combinaciones de Baloto (v3.0)',
        epilog="""
Ejemplos de uso:
  python new_game.py 15-01-2024                    # Estrategia balanceada (default)
  python new_game.py 15-01-2024 --estrategia caliente
  python new_game.py 15-01-2024 --estrategia optimizada  # ⭐ NUEVA!
  
Nota: Usa datos ACTUALES de reports/analisis_baloto.json
        """
    )
    
    parser.add_argument('fecha', type=str, 
                       help='Fecha para la que se genera el juego (DD-MM-AAAA)')
    
    parser.add_argument('--estrategia', type=str, default='balanceada',
                       choices=ESTRATEGIAS_VALIDAS,
                       help=f'Estrategia de generación (default: balanceada)')
    
    parser.add_argument('--max-intentos', type=int, default=10000,
                       help='Máximo intentos para encontrar combinación única')
    
    args = parser.parse_args()
    
    try:
        fecha_dt = parse_fecha(args.fecha)
        fecha_str = args.fecha
    except ValueError as e:
        print(f"❌ {e}")
        sys.exit(1)
    
    if not os.path.exists(HISTORICO_CSV):
        print(f"❌ Archivo histórico no encontrado: {HISTORICO_CSV}")
        print("   Ejecuta primero: python historical.py")
        sys.exit(1)
    
    try:
        generador = GeneradorBalotoDinamico(estrategia=args.estrategia)
    except ValueError as e:
        print(f"❌ {e}")
        sys.exit(1)
    
    juego = generador.generar(max_intentos=args.max_intentos)
    
    if juego:
        mostrar_combinacion(juego, fecha_str)
        guardar_juego(juego, fecha_str)
    else:
        print(f"\n❌ No se pudo generar una combinación válida")
        sys.exit(1)

if __name__ == "__main__":
    main()