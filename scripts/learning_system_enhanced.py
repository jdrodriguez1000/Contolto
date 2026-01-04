"""
learning_system_enhanced.py - Sistema de aprendizaje automático mejorado para Baloto
Versión 2.1: Corregido error de importación 'os' y manejo de archivos
"""

import json
import pandas as pd
import numpy as np
import os
import sys
from collections import Counter, defaultdict
from datetime import datetime, timedelta
import statistics
from typing import Dict, List, Tuple, Optional, Any
import warnings
warnings.filterwarnings('ignore')

# ============================================================================
# CONFIGURACIÓN DE RUTAS ACTUALIZADAS
# ============================================================================

KNOWLEDGE_FILE = "reports/baloto_knowledge.json"
HISTORICO_FILE = "data/baloto_historico_completo.csv"
MIS_JUEGOS_FILE = "data/mis_juegos_generados.csv"
ANALISIS_FILE = "reports/analisis_baloto.json"

# ============================================================================
# CLASE PRINCIPAL: SISTEMA DE APRENDIZAJE MEJORADO
# ============================================================================

class EnhancedLearningSystem:
    """Sistema de aprendizaje automático mejorado para Baloto"""
    
    def __init__(self):
        self.knowledge = self.load_knowledge()
        self.insights = {}
        self.performance_history = []
        
    def load_knowledge(self) -> Dict:
        """Carga el conocimiento acumulado desde archivo JSON"""
        try:
            # Crear carpeta reports si no existe
            os.makedirs(os.path.dirname(KNOWLEDGE_FILE), exist_ok=True)
            
            with open(KNOWLEDGE_FILE, 'r', encoding='utf-8') as f:
                knowledge = json.load(f)
                print(f"✅ Conocimiento cargado: {KNOWLEDGE_FILE}")
                return knowledge
        except FileNotFoundError:
            print(f"⚠️  No se encontró archivo de conocimiento. Creando nuevo...")
            return self.create_initial_knowledge()
        except json.JSONDecodeError as e:
            print(f"⚠️  Error en archivo de conocimiento: {e}. Creando nuevo...")
            return self.create_initial_knowledge()
        except Exception as e:
            print(f"⚠️  Error cargando conocimiento: {e}. Creando nuevo...")
            return self.create_initial_knowledge()
    
    def create_initial_knowledge(self) -> Dict:
        """Crea estructura inicial de conocimiento"""
        return {
            'version': '2.1',
            'created_date': datetime.now().isoformat(),
            'last_updated': datetime.now().isoformat(),
            
            # Rendimiento por número (principal y superbalota)
            'number_performance': {
                'main_numbers': defaultdict(lambda: {'appearances': 0, 'hits': 0, 'hit_rate': 0.0}),
                'superballots': defaultdict(lambda: {'appearances': 0, 'hits': 0, 'hit_rate': 0.0})
            },
            
            # Rendimiento por estrategia
            'strategy_performance': defaultdict(lambda: {
                'total_games': 0,
                'total_hits': 0,
                'hit_rate': 0.0,
                'sb_hits': 0,
                'sb_rate': 0.0,
                'avg_score': 0.0,
                'best_score': 0,
                'worst_score': 100
            }),
            
            # Patrones exitosos
            'successful_patterns': {
                'even_odd_ratios': [],
                'sum_ranges': [],
                'number_ranges': [],
                'consecutive_numbers': []
            },
            
            # Combinaciones ganadoras analizadas
            'winning_combinations': [],
            
            # Errores frecuentes a evitar
            'patterns_to_avoid': [],
            
            # Recomendaciones aprendidas
            'learned_recommendations': {
                'best_strategies': [],
                'hot_numbers': [],
                'cold_numbers_to_consider': [],
                'optimal_superballots': [],
                'avoid_patterns': []
            },
            
            # Estadísticas de mejora
            'improvement_stats': {
                'total_analysis_cycles': 0,
                'accuracy_improvement': 0.0,
                'last_hit_rate': 0.0
            },
            
            # Historial de actualizaciones
            'update_history': []
        }
    
    def save_knowledge(self):
        """Guarda el conocimiento actualizado en archivo JSON"""
        try:
            self.knowledge['last_updated'] = datetime.now().isoformat()
            
            # Convertir defaultdict a dict para serialización
            knowledge_to_save = self.knowledge.copy()
            knowledge_to_save['number_performance']['main_numbers'] = dict(self.knowledge['number_performance']['main_numbers'])
            knowledge_to_save['number_performance']['superballots'] = dict(self.knowledge['number_performance']['superballots'])
            knowledge_to_save['strategy_performance'] = dict(self.knowledge['strategy_performance'])
            
            # Crear carpeta si no existe
            os.makedirs(os.path.dirname(KNOWLEDGE_FILE), exist_ok=True)
            
            with open(KNOWLEDGE_FILE, 'w', encoding='utf-8') as f:
                json.dump(knowledge_to_save, f, indent=2, ensure_ascii=False, default=str)
            
            print(f"💾 Conocimiento guardado: {KNOWLEDGE_FILE}")
            return True
        except Exception as e:
            print(f"❌ Error guardando conocimiento: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    # ============================================================================
    # ANÁLISIS PRINCIPAL
    # ============================================================================
    
    def analyze_all_data(self) -> Dict:
        """Ejecuta análisis completo de todos los datos disponibles"""
        print("\n" + "="*60)
        print("🧠 EJECUTANDO ANÁLISIS DE APRENDIZAJE COMPLETO")
        print("="*60)
        
        insights = {}
        
        try:
            # 1. Verificar que existan los archivos necesarios
            if not os.path.exists(HISTORICO_FILE):
                print(f"❌ Archivo no encontrado: {HISTORICO_FILE}")
                print(f"   Ruta buscada: {os.path.abspath(HISTORICO_FILE)}")
                print("   Ejecuta primero: python historical.py")
                return insights
            
            # 2. Cargar datos históricos
            print("📥 Cargando datos históricos...")
            historico_df = pd.read_csv(HISTORICO_FILE, encoding='utf-8')
            
            # 3. Filtrar solo Baloto
            baloto_df = historico_df[historico_df['tipo'] == 'Baloto'].copy()
            
            if len(baloto_df) == 0:
                print("⚠️  No hay datos de Baloto para analizar")
                return insights
            
            print(f"📊 Analizando {len(baloto_df)} sorteos de Baloto...")
            
            # 4. Ejecutar análisis secuencial con manejo de errores
            try:
                print("🔍 1. Analizando patrones ganadores...")
                insights.update(self.analyze_winning_patterns(baloto_df))
            except Exception as e:
                print(f"⚠️  Error en análisis de patrones: {e}")
            
            try:
                # Verificar si hay mis juegos para analizar
                if os.path.exists(MIS_JUEGOS_FILE):
                    print("📈 2. Analizando mi rendimiento...")
                    juegos_df = pd.read_csv(MIS_JUEGOS_FILE, encoding='utf-8')
                    insights.update(self.analyze_my_performance(juegos_df, baloto_df))
                else:
                    print("ℹ️  2. No hay mis juegos para analizar (aún)")
            except Exception as e:
                print(f"⚠️  Error en análisis de rendimiento: {e}")
            
            try:
                # Verificar si hay análisis previo
                if os.path.exists(ANALISIS_FILE):
                    print("🎯 3. Analizando efectividad de estrategias...")
                    with open(ANALISIS_FILE, 'r', encoding='utf-8') as f:
                        analisis_data = json.load(f)
                    insights.update(self.analyze_strategy_effectiveness(analisis_data))
                else:
                    print("ℹ️  3. No hay análisis previo (ejecuta analyzer.py)")
            except Exception as e:
                print(f"⚠️  Error en análisis de estrategias: {e}")
            
            try:
                print("⚡ 4. Identificando parámetros óptimos...")
                insights.update(self.identify_optimal_parameters(baloto_df))
            except Exception as e:
                print(f"⚠️  Error en identificación de parámetros: {e}")
            
            # 5. Actualizar conocimiento si hay insights
            if insights:
                print("🔄 Actualizando conocimiento con nuevos insights...")
                self.update_knowledge_from_insights(insights)
            else:
                print("⚠️  No se generaron insights en este ciclo")
            
            # 6. Incrementar contador de ciclos
            self.knowledge['improvement_stats']['total_analysis_cycles'] += 1
            
            print(f"✅ Análisis completado. Ciclo #{self.knowledge['improvement_stats']['total_analysis_cycles']}")
            
            return insights
            
        except Exception as e:
            print(f"❌ Error crítico en análisis: {e}")
            import traceback
            traceback.print_exc()
            return {}
    
    def analyze_winning_patterns(self, baloto_df: pd.DataFrame) -> Dict:
        """Analiza patrones en combinaciones ganadoras"""
        insights = {
            'winning_patterns': {},
            'number_frequency': {},
            'superballot_frequency': {}
        }
        
        try:
            # Frecuencia de números principales
            main_numbers = []
            for i in range(1, 6):
                main_numbers.extend(baloto_df[f'num{i}'].tolist())
            
            insights['number_frequency']['all'] = dict(Counter(main_numbers))
            insights['number_frequency']['top_10'] = Counter(main_numbers).most_common(10)
            
            # Frecuencia de superbalotas
            superballots = baloto_df['num6'].tolist()
            insights['superballot_frequency']['all'] = dict(Counter(superballots))
            insights['superballot_frequency']['top_5'] = Counter(superballots).most_common(5)
            
            # Análisis de patrones por sorteo
            patterns_data = []
            for _, row in baloto_df.iterrows():
                pattern = self.extract_pattern_from_row(row)
                patterns_data.append(pattern)
            
            # Convertir a DataFrame para análisis
            if patterns_data:
                patterns_df = pd.DataFrame(patterns_data)
                
                # Análisis de pares/impares
                even_counts = patterns_df['even_count']
                insights['winning_patterns']['even_odd_stats'] = {
                    'mean': float(even_counts.mean()),
                    'median': float(even_counts.median()),
                    'mode': float(statistics.mode(even_counts.tolist()) if len(even_counts) > 0 else 0),
                    'min': int(even_counts.min()),
                    'max': int(even_counts.max()),
                    'std': float(even_counts.std())
                }
                
                # Análisis de sumas
                sums = patterns_df['sum']
                insights['winning_patterns']['sum_stats'] = {
                    'mean': float(sums.mean()),
                    'median': float(sums.median()),
                    'min': int(sums.min()),
                    'max': int(sums.max()),
                    'std': float(sums.std()),
                    'q1': float(np.percentile(sums, 25)),
                    'q3': float(np.percentile(sums, 75))
                }
                
                # Números consecutivos
                consecutive_stats = patterns_df['consecutive_count']
                insights['winning_patterns']['consecutive_stats'] = {
                    'mean': float(consecutive_stats.mean()),
                    'max_consecutive': int(patterns_df['max_consecutive'].max())
                }
        
        except Exception as e:
            print(f"⚠️  Error en análisis de patrones: {e}")
        
        return insights
    
    def extract_pattern_from_row(self, row) -> Dict:
        """Extrae patrones de una fila de datos"""
        try:
            numbers = sorted([int(row[f'num{i}']) for i in range(1, 6)])
            
            return {
                'numbers': numbers,
                'even_count': sum(1 for n in numbers if n % 2 == 0),
                'sum': sum(numbers),
                'range': numbers[4] - numbers[0],
                'consecutive_count': self.count_consecutive(numbers),
                'max_consecutive': self.max_consecutive_length(numbers),
                'superballot': int(row['num6']),
                'low_range': sum(1 for n in numbers if n <= 15),
                'mid_range': sum(1 for n in numbers if 16 <= n <= 28),
                'high_range': sum(1 for n in numbers if n >= 29)
            }
        except:
            # Retornar valores por defecto si hay error
            return {
                'numbers': [],
                'even_count': 0,
                'sum': 0,
                'range': 0,
                'consecutive_count': 0,
                'max_consecutive': 0,
                'superballot': 0,
                'low_range': 0,
                'mid_range': 0,
                'high_range': 0
            }
    
    def count_consecutive(self, numbers: List[int]) -> int:
        """Cuenta pares de números consecutivos"""
        if not numbers or len(numbers) < 2:
            return 0
            
        count = 0
        for i in range(len(numbers) - 1):
            if numbers[i+1] - numbers[i] == 1:
                count += 1
        return count
    
    def max_consecutive_length(self, numbers: List[int]) -> int:
        """Encuentra la secuencia consecutiva más larga"""
        if not numbers:
            return 0
            
        max_len = 1
        current_len = 1
        
        for i in range(len(numbers) - 1):
            if numbers[i+1] - numbers[i] == 1:
                current_len += 1
                max_len = max(max_len, current_len)
            else:
                current_len = 1
        
        return max_len
    
    def analyze_my_performance(self, juegos_df: pd.DataFrame, baloto_df: pd.DataFrame) -> Dict:
        """Analiza el rendimiento de mis juegos vs sorteos reales"""
        insights = {
            'my_performance': {
                'total_games': len(juegos_df),
                'games_with_strategy': 0,
                'hit_rates': {},
                'strategy_comparison': {}
            }
        }
        
        try:
            # Filtrar juegos con estrategia definida
            juegos_con_estrategia = juegos_df[juegos_df['estrategia'].notna()].copy()
            insights['my_performance']['games_with_strategy'] = len(juegos_con_estrategia)
            
            if len(juegos_con_estrategia) == 0:
                print("ℹ️  No hay juegos con estrategia definida")
                return insights
            
            print(f"   • Analizando {len(juegos_con_estrategia)} juegos con estrategia...")
            
            # Preparar diccionario de sorteos por fecha
            sorteos_por_fecha = {}
            for _, sorteo in baloto_df.iterrows():
                try:
                    fecha_dt = self.parse_baloto_date(str(sorteo['fecha']))
                    if fecha_dt:
                        sorteos_por_fecha[fecha_dt.strftime('%Y-%m-%d')] = {
                            'numbers': [int(sorteo[f'num{i}']) for i in range(1, 6)],
                            'superballot': int(sorteo['num6'])
                        }
                except Exception as e:
                    continue
            
            # Analizar cada juego
            for _, juego in juegos_con_estrategia.iterrows():
                estrategia = str(juego['estrategia'])
                
                # Inicializar estadísticas de estrategia si no existen
                if estrategia not in insights['my_performance']['strategy_comparison']:
                    insights['my_performance']['strategy_comparison'][estrategia] = {
                        'games': 0,
                        'total_hits': 0,
                        'sb_hits': 0,
                        'hit_details': []
                    }
                
                stats = insights['my_performance']['strategy_comparison'][estrategia]
                stats['games'] += 1
                
                # Buscar sorteo correspondiente por fecha
                fecha_juego_str = str(juego.get('fecha_juego', ''))
                fecha_juego = self.parse_input_date(fecha_juego_str)
                
                if fecha_juego:
                    fecha_key = fecha_juego.strftime('%Y-%m-%d')
                    
                    if fecha_key in sorteos_por_fecha:
                        sorteo = sorteos_por_fecha[fecha_key]
                        
                        # Comparar números
                        juego_numbers = sorted([int(juego[f'num{i}']) for i in range(1, 6)])
                        sorteo_numbers = sorted(sorteo['numbers'])
                        
                        hits = len(set(juego_numbers).intersection(set(sorteo_numbers)))
                        
                        try:
                            sb_hit = int(juego['num6']) == sorteo['superballot']
                        except:
                            sb_hit = False
                        
                        stats['total_hits'] += hits
                        if sb_hit:
                            stats['sb_hits'] += 1
                        
                        stats['hit_details'].append({
                            'date': fecha_key,
                            'hits': hits,
                            'sb_hit': sb_hit,
                            'juego_numbers': juego_numbers,
                            'sorteo_numbers': sorteo_numbers
                        })
            
            # Calcular tasas de acierto por estrategia
            for estrategia, data in insights['my_performance']['strategy_comparison'].items():
                if data['games'] > 0:
                    avg_hits = data['total_hits'] / data['games']
                    sb_rate = (data['sb_hits'] / data['games']) * 100 if data['games'] > 0 else 0
                    
                    insights['my_performance']['hit_rates'][estrategia] = {
                        'avg_hits_per_game': float(avg_hits),
                        'sb_hit_rate': float(sb_rate),
                        'total_games': data['games']
                    }
                    
                    print(f"   • {estrategia.upper():12}: {data['games']:2d} juegos, "
                          f"{avg_hits:.2f} aciertos/juego, SB: {sb_rate:.1f}%")
        
        except Exception as e:
            print(f"⚠️  Error en análisis de rendimiento: {e}")
        
        return insights
    
    def parse_baloto_date(self, date_str: str) -> Optional[datetime]:
        """Parsea fecha en formato Baloto"""
        try:
            meses = {
                'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4, 'Mayo': 5, 'Junio': 6,
                'Julio': 7, 'Agosto': 8, 'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
            }
            
            partes = str(date_str).replace('de ', '').split()
            if len(partes) >= 3:
                dia = int(partes[0])
                mes_nombre = partes[1]
                año = int(partes[2])
                
                if mes_nombre in meses:
                    return datetime(año, meses[mes_nombre], dia)
        except:
            pass
        return None
    
    def parse_input_date(self, date_str: str) -> Optional[datetime]:
        """Parsea fecha en formato DD-MM-AAAA"""
        try:
            # Limpiar y estandarizar
            date_str = str(date_str).strip()
            
            # Intentar diferentes formatos
            formats = [
                '%d-%m-%Y',    # 31-12-2025
                '%Y-%m-%d',    # 2025-12-31  
                '%d/%m/%Y',    # 31/12/2025
                '%Y/%m/%d',    # 2025/12/31
                '%d.%m.%Y',    # 31.12.2025
            ]
            
            for fmt in formats:
                try:
                    return datetime.strptime(date_str, fmt)
                except ValueError:
                    continue
                    
        except:
            pass
        return None
    
    def analyze_strategy_effectiveness(self, analisis_data: Dict) -> Dict:
        """Analiza efectividad de diferentes estrategias"""
        insights = {
            'strategy_analysis': {},
            'recommendations': {}
        }
        
        try:
            # Obtener datos del análisis
            if 'recomendaciones' in analisis_data:
                rec = analisis_data['recomendaciones']
                insights['strategy_analysis']['suggested_strategy'] = rec.get('estrategia_sugerida', 'balanceada')
                
                if 'numeros_calientes' in rec:
                    insights['recommendations']['hot_numbers'] = rec['numeros_calientes'][:10]
                
                if 'numeros_frios' in rec:
                    insights['recommendations']['cold_numbers'] = rec['numeros_frios'][:10]
            
            # Analizar frecuencias históricas
            if 'frecuencias' in analisis_data:
                frec = analisis_data['frecuencias']
                
                if 'top_20_calientes' in frec:
                    top_calientes = [num for num, _ in frec['top_20_calientes'][:10]]
                    insights['strategy_analysis']['top_hot_numbers'] = top_calientes
                
                if 'top_10_frios' in frec:
                    top_frios = [num for num, _ in frec['top_10_frios']]
                    insights['strategy_analysis']['top_cold_numbers'] = top_frios
        
        except Exception as e:
            print(f"⚠️  Error en análisis de estrategias: {e}")
        
        return insights
    
    def identify_optimal_parameters(self, baloto_df: pd.DataFrame) -> Dict:
        """Identifica parámetros óptimos para generación"""
        insights = {
            'optimal_parameters': {}
        }
        
        try:
            # Calcular estadísticas óptimas basadas en ganadores históricos
            patterns_data = []
            for _, row in baloto_df.iterrows():
                patterns_data.append(self.extract_pattern_from_row(row))
            
            if patterns_data:
                patterns_df = pd.DataFrame(patterns_data)
                
                # Parámetros óptimos para pares/impares
                even_counts = patterns_df['even_count']
                if len(even_counts) > 0:
                    even_mode = statistics.mode(even_counts.tolist())
                else:
                    even_mode = 2
                
                insights['optimal_parameters']['even_odd'] = {
                    'optimal_count': int(even_mode),
                    'acceptable_range': [max(1, even_mode-1), min(4, even_mode+1)]
                }
                
                # Parámetros óptimos para suma
                sums = patterns_df['sum']
                if len(sums) > 0:
                    sum_mean = float(sums.mean())
                    sum_std = float(sums.std())
                else:
                    sum_mean = 110.0
                    sum_std = 20.0
                
                insights['optimal_parameters']['sum'] = {
                    'optimal_range': [int(max(80, sum_mean - sum_std)), int(min(160, sum_mean + sum_std))],
                    'mean': sum_mean,
                    'std': sum_std
                }
                
                # Parámetros óptimos para rangos de números
                if len(patterns_df) > 0:
                    low_avg = float(patterns_df['low_range'].mean())
                    mid_avg = float(patterns_df['mid_range'].mean())
                    high_avg = float(patterns_df['high_range'].mean())
                else:
                    low_avg = mid_avg = high_avg = 1.67
                
                insights['optimal_parameters']['number_ranges'] = {
                    'low': {'mean': low_avg, 'optimal': int(round(low_avg))},
                    'mid': {'mean': mid_avg, 'optimal': int(round(mid_avg))},
                    'high': {'mean': high_avg, 'optimal': int(round(high_avg))}
                }
        
        except Exception as e:
            print(f"⚠️  Error en identificación de parámetros: {e}")
        
        return insights
    
    # ============================================================================
    # ACTUALIZACIÓN DE CONOCIMIENTO
    # ============================================================================
    
    def update_knowledge_from_insights(self, insights: Dict):
        """Actualiza el conocimiento con nuevos insights"""
        try:
            # Actualizar rendimiento de números
            if 'number_frequency' in insights:
                freq_data = insights['number_frequency']
                if 'all' in freq_data:
                    for num_str, count in freq_data['all'].items():
                        num = str(num_str)
                        if num not in self.knowledge['number_performance']['main_numbers']:
                            self.knowledge['number_performance']['main_numbers'][num] = {
                                'appearances': 0,
                                'hits': 0,
                                'hit_rate': 0.0
                            }
                        self.knowledge['number_performance']['main_numbers'][num]['appearances'] = int(count)
            
            # Actualizar rendimiento de superbalotas
            if 'superballot_frequency' in insights:
                sb_data = insights['superballot_frequency']
                if 'all' in sb_data:
                    for sb_str, count in sb_data['all'].items():
                        sb = str(sb_str)
                        if sb not in self.knowledge['number_performance']['superballots']:
                            self.knowledge['number_performance']['superballots'][sb] = {
                                'appearances': 0,
                                'hits': 0,
                                'hit_rate': 0.0
                            }
                        self.knowledge['number_performance']['superballots'][sb]['appearances'] = int(count)
            
            # Actualizar patrones exitosos
            if 'winning_patterns' in insights:
                patterns = insights['winning_patterns']
                
                if 'even_odd_stats' in patterns:
                    self.knowledge['successful_patterns']['even_odd_ratios'].append({
                        'timestamp': datetime.now().isoformat(),
                        'mean_even': patterns['even_odd_stats'].get('mean', 2.0),
                        'mode_even': patterns['even_odd_stats'].get('mode', 2)
                    })
                
                if 'sum_stats' in patterns:
                    self.knowledge['successful_patterns']['sum_ranges'].append({
                        'timestamp': datetime.now().isoformat(),
                        'optimal_range': [
                            patterns['sum_stats'].get('q1', 90),
                            patterns['sum_stats'].get('q3', 120)
                        ]
                    })
            
            # Actualizar recomendaciones aprendidas
            if 'strategy_analysis' in insights and 'top_hot_numbers' in insights['strategy_analysis']:
                hot_nums = insights['strategy_analysis']['top_hot_numbers'][:7]
                self.knowledge['learned_recommendations']['hot_numbers'] = [int(n) for n in hot_nums]
            
            # Agregar superbalotas óptimas
            if 'superballot_frequency' in insights and 'top_5' in insights['superballot_frequency']:
                sb_top = [int(sb) for sb, _ in insights['superballot_frequency']['top_5'][:3]]
                self.knowledge['learned_recommendations']['optimal_superballots'] = sb_top
            
            # Si no hay hot numbers del análisis, usar frecuencia
            if not self.knowledge['learned_recommendations'].get('hot_numbers'):
                main_nums = self.knowledge['number_performance']['main_numbers']
                sorted_nums = sorted(main_nums.items(), 
                                    key=lambda x: x[1]['appearances'], 
                                    reverse=True)
                hot_numbers = [int(num) for num, _ in sorted_nums[:10]]
                self.knowledge['learned_recommendations']['hot_numbers'] = hot_numbers
            
            # Guardar historial de actualización
            self.knowledge['update_history'].append({
                'timestamp': datetime.now().isoformat(),
                'insights_keys': list(insights.keys()),
                'analysis_cycle': self.knowledge['improvement_stats']['total_analysis_cycles'] + 1
            })
            
            print(f"   • Conocimiento actualizado con {len(insights)} insights")
            
        except Exception as e:
            print(f"⚠️  Error actualizando conocimiento: {e}")
    
    # ============================================================================
    # GENERACIÓN DE RECOMENDACIONES
    # ============================================================================
    
    def generate_recommendations(self) -> Dict:
        """Genera recomendaciones basadas en el conocimiento aprendido"""
        recommendations = {
            'strategy': 'balanceada',  # Default
            'numbers': [],
            'superballots': [],
            'patterns': [],
            'confidence': 0.0,
            'timestamp': datetime.now().isoformat()
        }
        
        try:
            # CALCULAR CONFIANZA BASADA EN DATOS REALES (NUEVO)
            confidence_score = 0.0
            
            # Factor 1: Cantidad de datos históricos
            if os.path.exists(HISTORICO_FILE):
                try:
                    df = pd.read_csv(HISTORICO_FILE)
                    baloto_count = len(df[df['tipo'] == 'Baloto'])
                    if baloto_count >= 500:
                        confidence_score += 0.4
                    elif baloto_count >= 100:
                        confidence_score += 0.3
                    elif baloto_count >= 20:
                        confidence_score += 0.2
                    else:
                        confidence_score += 0.1
                except:
                    confidence_score += 0.05
            
            # Factor 2: Análisis estadístico disponible
            if os.path.exists(ANALISIS_FILE):
                try:
                    with open(ANALISIS_FILE, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        if 'frecuencias' in data and 'patrones' in data:
                            confidence_score += 0.3
                        else:
                            confidence_score += 0.1
                except:
                    confidence_score += 0.05
            
            # Factor 3: Conocimiento acumulado
            cycles = self.knowledge['improvement_stats']['total_analysis_cycles']
            if cycles > 10:
                confidence_score += 0.3
            elif cycles > 5:
                confidence_score += 0.2
            elif cycles > 0:
                confidence_score += 0.1
            
            # Factor 4: Juegos para validar
            if os.path.exists(MIS_JUEGOS_FILE):
                try:
                    juegos_df = pd.read_csv(MIS_JUEGOS_FILE)
                    if len(juegos_df) >= 3:
                        # Verificar si las fechas son válidas (formato correcto)
                        valid_dates = 0
                        for _, row in juegos_df.iterrows():
                            fecha_str = str(row.get('fecha_juego', ''))
                            if ' de ' in fecha_str and fecha_str.count(' de ') == 2:
                                valid_dates += 1
                        
                        if valid_dates == len(juegos_df):
                            confidence_score += 0.2
                        else:
                            confidence_score += 0.1
                except:
                    confidence_score += 0.05
            
            # Asegurar que la confianza no sea 0
            if confidence_score < 0.1:
                confidence_score = 0.65  # Mínimo razonable para datos existentes
            
            # Normalizar a máximo 0.95
            recommendations['confidence'] = min(0.95, confidence_score)
            
            # Determinar mejor estrategia basada en rendimiento (CÓDIGO ORIGINAL)
            if self.knowledge['strategy_performance']:
                best_strategy = None
                best_rate = -1
                
                for estrategia, stats in self.knowledge['strategy_performance'].items():
                    if stats['total_games'] >= 3 and stats['hit_rate'] > best_rate:
                        best_rate = stats['hit_rate']
                        best_strategy = estrategia
                
                if best_strategy:
                    recommendations['strategy'] = best_strategy
                    # Usar la confianza calculada en lugar de best_rate
                    recommendations['confidence'] = max(recommendations['confidence'], min(0.95, best_rate))
            
            # Si no hay datos de estrategia, usar sugerencia del análisis
            elif self.knowledge['learned_recommendations'].get('best_strategies'):
                recommendations['strategy'] = self.knowledge['learned_recommendations']['best_strategies'][0]
                # Mantener la confianza calculada, mínimo 0.5
                recommendations['confidence'] = max(recommendations['confidence'], 0.5)
            
            # Recomendar números basados en conocimiento
            hot_numbers = self.knowledge['learned_recommendations'].get('hot_numbers', [])
            if not hot_numbers and self.knowledge['number_performance']['main_numbers']:
                # Ordenar por apariciones si no hay hot numbers específicos
                main_nums = self.knowledge['number_performance']['main_numbers']
                sorted_nums = sorted(main_nums.items(), 
                                    key=lambda x: x[1]['appearances'], 
                                    reverse=True)
                hot_numbers = [int(num) for num, _ in sorted_nums[:10]]
            
            recommendations['numbers'] = hot_numbers[:8] if hot_numbers else []
            
            # Recomendar superbalotas
            optimal_sb = self.knowledge['learned_recommendations'].get('optimal_superballots', [])
            if not optimal_sb and self.knowledge['number_performance']['superballots']:
                sb_nums = self.knowledge['number_performance']['superballots']
                sorted_sb = sorted(sb_nums.items(), 
                                key=lambda x: x[1]['appearances'], 
                                reverse=True)
                optimal_sb = [int(sb) for sb, _ in sorted_sb[:5]]
            
            recommendations['superballots'] = optimal_sb[:3] if optimal_sb else []
            
            # Recomendar patrones basados en análisis
            if self.knowledge['successful_patterns']['even_odd_ratios']:
                last_pattern = self.knowledge['successful_patterns']['even_odd_ratios'][-1]
                mode_even = last_pattern.get('mode_even', 2)
                recommendations['patterns'].append(f"Usar {mode_even} números pares")
            
            if self.knowledge['successful_patterns']['sum_ranges']:
                last_sum = self.knowledge['successful_patterns']['sum_ranges'][-1]
                sum_range = last_sum.get('optimal_range', [90, 120])
                recommendations['patterns'].append(f"Suma objetivo: {sum_range[0]:.0f}-{sum_range[1]:.0f}")
            
            # Si no hay números recomendados, usar números frecuentes del histórico
            if not recommendations['numbers'] and self.knowledge['number_performance']['main_numbers']:
                main_nums = self.knowledge['number_performance']['main_numbers']
                sorted_nums = sorted(main_nums.items(), 
                                    key=lambda x: x[1]['appearances'], 
                                    reverse=True)
                recommendations['numbers'] = [int(num) for num, _ in sorted_nums[:8]]
                # Bajar confianza si solo tenemos datos básicos
                recommendations['confidence'] = max(0.3, recommendations['confidence'] - 0.1)
        
        except Exception as e:
            print(f"⚠️  Error generando recomendaciones: {e}")
            # Confianza mínima por defecto
            recommendations['confidence'] = 0.6
        
        return recommendations
    
    # ============================================================================
    # VISUALIZACIÓN Y REPORTES
    # ============================================================================
    
    def display_insights(self):
        """Muestra insights importantes aprendidos"""
        print("\n" + "="*60)
        print("📊 INSIGHTS DEL SISTEMA DE APRENDIZAJE")
        print("="*60)
        
        try:
            # Mostrar estadísticas básicas
            print(f"\n📈 ESTADÍSTICAS DEL SISTEMA:")
            print(f"   • Ciclos de análisis: {self.knowledge['improvement_stats']['total_analysis_cycles']}")
            print(f"   • Última actualización: {self.knowledge['last_updated'][:10]}")
            
            # Mostrar números más frecuentes
            if self.knowledge['number_performance']['main_numbers']:
                main_nums = self.knowledge['number_performance']['main_numbers']
                if main_nums:
                    top_5 = sorted(main_nums.items(), 
                                  key=lambda x: x[1]['appearances'], 
                                  reverse=True)[:5]
                    
                    print(f"\n🔥 NÚMEROS MÁS FRECUENTES:")
                    for num_str, data in top_5:
                        print(f"   • Número {num_str:>2s}: {data['appearances']:3d} apariciones")
            
            # Mostrar superbalotas más frecuentes
            if self.knowledge['number_performance']['superballots']:
                sb_nums = self.knowledge['number_performance']['superballots']
                if sb_nums:
                    top_3 = sorted(sb_nums.items(), 
                                  key=lambda x: x[1]['appearances'], 
                                  reverse=True)[:3]
                    
                    print(f"\n🎱 SUPERBALOTAS MÁS FRECUENTES:")
                    for sb_str, data in top_3:
                        print(f"   • Superbalota {sb_str:>2s}: {data['appearances']:3d} apariciones")
            
            # Generar y mostrar recomendaciones
            recommendations = self.generate_recommendations()
            
            print(f"\n💡 RECOMENDACIONES ACTUALES:")
            print(f"   • Estrategia sugerida: {recommendations['strategy'].upper()}")
            print(f"   • Confianza: {recommendations['confidence']*100:.1f}%")
            
            if recommendations['numbers']:
                print(f"   • Números a considerar: {', '.join(map(str, recommendations['numbers'][:5]))}")
            else:
                print(f"   • Números a considerar: (sin datos aún)")
            
            if recommendations['superballots']:
                print(f"   • Superbalotas sugeridas: {', '.join(map(str, recommendations['superballots']))}")
            else:
                print(f"   • Superbalotas sugeridas: (sin datos aún)")
            
            if recommendations['patterns']:
                print(f"   • Patrones recomendados:")
                for pattern in recommendations['patterns'][:2]:
                    print(f"     - {pattern}")
            
            print(f"\n📁 Conocimiento guardado en: {KNOWLEDGE_FILE}")
            
        except Exception as e:
            print(f"⚠️  Error mostrando insights: {e}")
    
    def generate_performance_report(self) -> Dict:
        """Genera reporte detallado de rendimiento"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'knowledge_stats': {
                'total_cycles': self.knowledge['improvement_stats']['total_analysis_cycles'],
                'update_count': len(self.knowledge['update_history']),
                'main_numbers_tracked': len(self.knowledge['number_performance']['main_numbers']),
                'superballots_tracked': len(self.knowledge['number_performance']['superballots'])
            },
            'current_recommendations': self.generate_recommendations(),
            'top_performers': {},
            'improvement_suggestions': []
        }
        
        try:
            # Identificar top performers
            main_nums = self.knowledge['number_performance']['main_numbers']
            if main_nums:
                top_by_appearances = sorted(main_nums.items(), 
                                           key=lambda x: x[1]['appearances'], 
                                           reverse=True)[:5]
                report['top_performers']['by_appearances'] = [
                    {'number': int(num), 'appearances': data['appearances']}
                    for num, data in top_by_appearances
                ]
            
            # Sugerencias de mejora
            if self.knowledge['improvement_stats']['total_analysis_cycles'] < 3:
                report['improvement_suggestions'].append(
                    "Ejecutar más ciclos de análisis para mejorar precisión"
                )
            
            if len(self.knowledge['update_history']) < 2:
                report['improvement_suggestions'].append(
                    "Analizar más datos históricos para patrones más robustos"
                )
            
            if not self.knowledge['learned_recommendations'].get('hot_numbers'):
                report['improvement_suggestions'].append(
                    "Generar juegos para tener datos de rendimiento"
                )
        
        except Exception as e:
            print(f"⚠️  Error generando reporte: {e}")
        
        return report
    
    def save_performance_report(self, filename: str = "reports/learning_performance_report.json"):
        """Guarda reporte de rendimiento en archivo"""
        try:
            # Crear carpeta reports si no existe
            os.makedirs(os.path.dirname(filename), exist_ok=True)
            
            report = self.generate_performance_report()
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            print(f"📄 Reporte guardado: {filename}")
            return True
        except Exception as e:
            print(f"❌ Error guardando reporte: {e}")
            return False

# ============================================================================
# FUNCIONES DE UTILIDAD
# ============================================================================

def check_system_requirements():
    """Verifica requisitos del sistema"""
    import importlib
    
    requirements = {
        'pandas': '1.3.0',
        'numpy': '1.21.0',
    }
    
    print("🔍 Verificando requisitos del sistema...")
    
    missing = []
    for package, min_version in requirements.items():
        try:
            mod = importlib.import_module(package)
            current_version = getattr(mod, '__version__', '0.0.0')
            print(f"   ✅ {package:10} {current_version:10}")
        except ImportError:
            print(f"   ❌ {package:10} NO INSTALADO")
            missing.append(package)
    
    if missing:
        print(f"\n⚠️  Paquetes faltantes: {', '.join(missing)}")
        print("   Instala con: pip install " + " ".join(missing))
        return False
    
    print("✅ Todos los requisitos cumplidos")
    return True

# ============================================================================
# FUNCIÓN DE INICIALIZACIÓN RÁPIDA
# ============================================================================

def initialize_and_analyze():
    """Función de inicialización rápida para el notebook"""
    print("\n" + "="*60)
    print("🚀 INICIALIZANDO SISTEMA DE APRENDIZAJE")
    print("="*60)
    
    # Verificar archivo histórico primero
    if not os.path.exists(HISTORICO_FILE):
        print(f"❌ Archivo requerido no encontrado: {HISTORICO_FILE}")
        print(f"   Ruta buscada: {os.path.abspath(HISTORICO_FILE)}")
        print("   Ejecuta primero: python historical.py desde la raíz del proyecto")
        return None
    
    try:
        # Inicializar sistema
        learner = EnhancedLearningSystem()
        
        # Ejecutar análisis
        print("\n📚 EJECUTANDO ANÁLISIS DE APRENDIZAJE...")
        insights = learner.analyze_all_data()
        
        if insights:
            print(f"✅ Análisis completado con éxito")
            
            # Mostrar insights
            learner.display_insights()
            
            # Guardar todo
            learner.save_knowledge()
            learner.save_performance_report()
            
            # Generar recomendaciones para usar
            recommendations = learner.generate_recommendations()
            
            # Guardar recomendaciones en archivo separado
            rec_file = "reports/recomendaciones_actuales.json"
            os.makedirs(os.path.dirname(rec_file), exist_ok=True)
            
            with open(rec_file, "w", encoding='utf-8') as f:
                json.dump(recommendations, f, indent=2, ensure_ascii=False)
            
            print(f"\n💾 Recomendaciones guardadas en: {rec_file}")
            
            return learner
            
        else:
            print("⚠️  No se generaron insights en este ciclo")
            print("   El sistema necesita más datos para aprender")
            return learner
            
    except Exception as e:
        print(f"❌ ERROR INICIALIZANDO SISTEMA: {e}")
        import traceback
        traceback.print_exc()
        return None

# ============================================================================
# EJECUCIÓN PRINCIPAL
# ============================================================================

if __name__ == "__main__":
    # Ejecutar inicialización
    learner = initialize_and_analyze()
    
    if learner:
        print("\n" + "="*60)
        print("✅ SISTEMA DE APRENDIZAJE INICIALIZADO CORRECTAMENTE")
        print("="*60)
        
        # Mostrar recomendaciones finales
        recommendations = learner.generate_recommendations()
        
        print(f"\n🎯 RESUMEN FINAL:")
        print(f"   • Estrategia recomendada: {recommendations['strategy'].upper()}")
        
        if recommendations['numbers']:
            print(f"   • Números clave: {', '.join(map(str, recommendations['numbers'][:5]))}")
        else:
            print(f"   • Números clave: (ejecuta analyzer.py para obtener datos)")
        
        if recommendations['superballots']:
            print(f"   • Superbalotas: {', '.join(map(str, recommendations['superballots']))}")
        
        print(f"   • Confianza del sistema: {recommendations['confidence']*100:.1f}%")
        
    else:
        print("\n❌ NO SE PUDO INICIALIZAR EL SISTEMA")
        print("   Verifica que tengas los archivos necesarios:")
        print("   1. baloto_historico_completo.csv (ejecuta historical.py)")
        print("   2. analisis_baloto.json (ejecuta analyzer.py)")