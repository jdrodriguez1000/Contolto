"""
analyzer.py - Analizador estadístico avanzado para datos de Baloto
Analiza patrones, frecuencias y tendencias en los datos históricos
"""

import pandas as pd
import numpy as np
from collections import Counter, defaultdict
from datetime import datetime
import json
import argparse
import sys
import os
from typing import Dict, List, Tuple, Any

class BalotoAnalyzer:
    """Analizador avanzado de datos de Baloto"""
    
    def __init__(self, csv_path: str = "data/baloto_historico_completo.csv"):
        """
        Inicializa el analizador con datos históricos
        
        Args:
            csv_path: Ruta al archivo CSV con datos históricos
        """
        self.csv_path = csv_path
        self.df = None
        self.df_baloto = None
        self.df_revancha = None
        self.analisis_completo = {}
        
    def cargar_datos(self) -> bool:
        """
        Carga y prepara los datos del CSV
        
        Returns:
            bool: True si la carga fue exitosa
        """
        try:
            print(f"📂 Cargando datos desde: {self.csv_path}")
            
            # Verificar si el archivo existe
            if not os.path.exists(self.csv_path):
                print(f"❌ Error: Archivo '{self.csv_path}' no encontrado")
                return False
                
            self.df = pd.read_csv(self.csv_path)
            
            # Verificar columnas necesarias
            columnas_necesarias = ['tipo', 'fecha', 'num1', 'num2', 'num3', 'num4', 'num5', 'num6']
            for col in columnas_necesarias:
                if col not in self.df.columns:
                    print(f"❌ Error: Columna '{col}' no encontrada en el CSV")
                    return False
            
            # Separar por tipo de juego
            self.df_baloto = self.df[self.df['tipo'] == 'Baloto'].copy()
            self.df_revancha = self.df[self.df['tipo'] == 'Revancha'].copy()
            
            # Convertir fechas
            self._parsear_fechas()
            
            print(f"✅ Datos cargados exitosamente")
            print(f"   Total registros: {len(self.df)}")
            print(f"   Baloto: {len(self.df_baloto)} sorteos")
            print(f"   Revancha: {len(self.df_revancha)} sorteos")
            
            return True
            
        except FileNotFoundError:
            print(f"❌ Error: Archivo '{self.csv_path}' no encontrado")
            return False
        except Exception as e:
            print(f"❌ Error al cargar datos: {e}")
            return False
    
    def _parsear_fechas(self):
        """Convierte las fechas de string a datetime"""
        def parse_fecha(fecha_str):
            try:
                meses = {
                    'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4, 'Mayo': 5, 'Junio': 6,
                    'Julio': 7, 'Agosto': 8, 'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
                }
                
                if pd.isna(fecha_str):
                    return None
                    
                # Formato: "24 de Julio de 2025"
                partes = fecha_str.replace('de ', '').split()
                if len(partes) == 3:
                    dia = int(partes[0])
                    mes = meses[partes[1]]
                    año = int(partes[2])
                    return datetime(año, mes, dia)
                return None
            except:
                return None
        
        self.df['fecha_dt'] = self.df['fecha'].apply(parse_fecha)
        self.df_baloto['fecha_dt'] = self.df_baloto['fecha'].apply(parse_fecha)
        self.df_revancha['fecha_dt'] = self.df_revancha['fecha'].apply(parse_fecha)
    
    def analizar_basico(self) -> Dict[str, Any]:
        """Análisis básico de los datos"""
        print("\n📊 REALIZANDO ANÁLISIS BÁSICO...")
        
        if self.df_baloto.empty:
            return {}
        
        # Ordenar por fecha
        df_baloto_sorted = self.df_baloto.sort_values('fecha_dt')
        
        basico = {
            'total_sorteos': len(self.df),
            'total_baloto': len(self.df_baloto),
            'total_revancha': len(self.df_revancha),
            'fecha_inicio': df_baloto_sorted.iloc[0]['fecha'] if not df_baloto_sorted.empty else None,
            'fecha_fin': df_baloto_sorted.iloc[-1]['fecha'] if not df_baloto_sorted.empty else None,
            'dias_cobertura': None,
            'sorteos_por_mes': len(self.df_baloto) / ((len(self.df_baloto) / 2) / 30.44) if len(self.df_baloto) > 0 else 0
        }
        
        # Calcular días de cobertura
        if not df_baloto_sorted.empty and 'fecha_dt' in df_baloto_sorted.columns:
            fecha_inicio = df_baloto_sorted.iloc[0]['fecha_dt']
            fecha_fin = df_baloto_sorted.iloc[-1]['fecha_dt']
            if fecha_inicio and fecha_fin:
                basico['dias_cobertura'] = (fecha_fin - fecha_inicio).days
        
        return basico
    
    def analizar_frecuencias(self) -> Dict[str, Any]:
        """Analiza frecuencias de números"""
        print("🔢 ANALIZANDO FRECUENCIAS...")
        
        if self.df_baloto.empty:
            return {}
        
        # Todos los números principales
        numeros_todos = []
        for i in range(1, 6):
            numeros_todos.extend(self.df_baloto[f'num{i}'].tolist())
        
        # Superbalotas
        superbalotas = self.df_baloto['num6'].tolist()
        
        # Calcular frecuencias
        freq_numeros = Counter(numeros_todos)
        freq_superbalotas = Counter(superbalotas)
        
        # Frecuencias por posición
        frecuencias_posicion = {}
        for pos in range(1, 6):
            pos_numeros = self.df_baloto[f'num{pos}'].tolist()
            frecuencias_posicion[f'pos{pos}'] = dict(Counter(pos_numeros))
        
        frecuencias = {
            'todos_numeros': dict(freq_numeros),
            'superbalotas': dict(freq_superbalotas),
            'por_posicion': frecuencias_posicion,
            'top_20_calientes': freq_numeros.most_common(20),
            'top_10_frios': freq_numeros.most_common()[-10:],
            'top_5_superbalotas': freq_superbalotas.most_common(5),
            'bottom_5_superbalotas': freq_superbalotas.most_common()[-5:],
        }
        
        return frecuencias
    
    def analizar_patrones(self) -> Dict[str, Any]:
        """Analiza patrones en los números"""
        print("🎯 ANALIZANDO PATRONES...")
        
        if self.df_baloto.empty:
            return {}
        
        patrones = {
            'pares_impares': self._analizar_pares_impares(),
            'rangos_numeros': self._analizar_rangos(),
            'sumas': self._analizar_sumas(),
            'intervalos': self._analizar_intervalos(),
            'distribucion': self._analizar_distribucion()
        }
        
        return patrones
    
    def _analizar_pares_impares(self) -> Dict[str, Any]:
        """Analiza distribución de pares e impares"""
        resultados = {'por_sorteo': [], 'total': {'pares': 0, 'impares': 0}}
        
        for _, row in self.df_baloto.iterrows():
            pares = sum(1 for i in range(1, 6) if row[f'num{i}'] % 2 == 0)
            resultados['por_sorteo'].append(pares)
            resultados['total']['pares'] += pares
            resultados['total']['impares'] += (5 - pares)
        
        resultados['promedio_pares'] = np.mean(resultados['por_sorteo']) if resultados['por_sorteo'] else 0
        resultados['distribucion'] = dict(Counter(resultados['por_sorteo']))
        
        return resultados
    
    def _analizar_rangos(self) -> Dict[str, Any]:
        """Analiza números por rangos (bajos, medios, altos)"""
        # Definir rangos
        rangos = {
            'bajos': (1, 15),
            'medios': (16, 28),
            'altos': (29, 43)
        }
        
        resultados = {'por_sorteo': [], 'totales': defaultdict(int)}
        
        for _, row in self.df_baloto.iterrows():
            conteo_rango = defaultdict(int)
            for i in range(1, 6):
                num = row[f'num{i}']
                for rango, (min_val, max_val) in rangos.items():
                    if min_val <= num <= max_val:
                        conteo_rango[rango] += 1
                        resultados['totales'][rango] += 1
                        break
            
            resultados['por_sorteo'].append(dict(conteo_rango))
        
        return dict(resultados)
    
    def _analizar_sumas(self) -> Dict[str, Any]:
        """Analiza sumas de los 5 números principales"""
        sumas = []
        
        for _, row in self.df_baloto.iterrows():
            suma = sum(row[f'num{i}'] for i in range(1, 6))
            sumas.append(suma)
        
        if not sumas:
            return {}
        
        return {
            'valores': sumas,
            'promedio': np.mean(sumas),
            'mediana': np.median(sumas),
            'minimo': min(sumas),
            'maximo': max(sumas),
            'desviacion': np.std(sumas),
            'q1': np.percentile(sumas, 25),
            'q3': np.percentile(sumas, 75),
            'percentil_10': np.percentile(sumas, 10),
            'percentil_90': np.percentile(sumas, 90)
        }
    
    def _analizar_intervalos(self) -> Dict[str, Any]:
        """Analiza intervalos entre números consecutivos"""
        intervalos_todos = []
        
        for _, row in self.df_baloto.iterrows():
            numeros = sorted([row[f'num{i}'] for i in range(1, 6)])
            intervalos = [numeros[i+1] - numeros[i] for i in range(4)]
            intervalos_todos.extend(intervalos)
        
        if not intervalos_todos:
            return {}
        
        return {
            'valores': intervalos_todos,
            'promedio': np.mean(intervalos_todos),
            'maximo': max(intervalos_todos),
            'moda': Counter(intervalos_todos).most_common(3)
        }
    
    def _analizar_distribucion(self) -> Dict[str, Any]:
        """Analiza distribución general de números"""
        todos_numeros = []
        for i in range(1, 6):
            todos_numeros.extend(self.df_baloto[f'num{i}'].tolist())
        
        if not todos_numeros:
            return {}
        
        return {
            'rango_completo': (min(todos_numeros), max(todos_numeros)),
            'media': np.mean(todos_numeros),
            'mediana': np.median(todos_numeros),
            'moda': Counter(todos_numeros).most_common(3)
        }
    
    def analizar_temporal(self) -> Dict[str, Any]:
        """Analiza tendencias temporales"""
        print("📈 ANALIZANDO TENDENCIAS TEMPORALES...")
        
        if self.df_baloto.empty or 'fecha_dt' not in self.df_baloto.columns:
            return {}
        
        # Ordenar por fecha
        df_ordenado = self.df_baloto.sort_values('fecha_dt')
        
        # Últimos 100 sorteos para análisis reciente
        if len(df_ordenado) > 100:
            df_reciente = df_ordenado.tail(100)
        else:
            df_reciente = df_ordenado
        
        # Calcular frecuencias recientes
        numeros_recientes = []
        for i in range(1, 6):
            numeros_recientes.extend(df_reciente[f'num{i}'].tolist())
        
        freq_reciente = Counter(numeros_recientes)
        
        # Identificar números en racha (últimos 20 sorteos)
        if len(df_ordenado) > 20:
            ultimos_20 = df_ordenado.tail(20)
            numeros_ultimos_20 = []
            for i in range(1, 6):
                numeros_ultimos_20.extend(ultimos_20[f'num{i}'].tolist())
            
            freq_ultimos_20 = Counter(numeros_ultimos_20)
            en_racha = [num for num, count in freq_ultimos_20.items() if count >= 3]
        else:
            en_racha = []
        
        # Identificar números fríos (no salen en últimos N sorteos)
        if len(df_ordenado) > 50:
            ultimos_50_numeros = set()
            for _, row in df_ordenado.tail(50).iterrows():
                for i in range(1, 6):
                    ultimos_50_numeros.add(row[f'num{i}'])
            
            todos_numeros_posibles = set(range(1, 44))
            frios = list(todos_numeros_posibles - ultimos_50_numeros)
        else:
            frios = []
        
        return {
            'frecuencias_recientes': dict(freq_reciente),
            'top_10_recientes': freq_reciente.most_common(10),
            'en_racha': en_racha,
            'frios': frios[:10],  # Solo primeros 10
            'total_sorteos_recientes': len(df_reciente)
        }
    
    def generar_recomendaciones(self) -> Dict[str, Any]:
        """Genera recomendaciones basadas en el análisis"""
        print("💡 GENERANDO RECOMENDACIONES...")
        
        if not self.analisis_completo:
            return {}
        
        rec = {
            'estrategia_sugerida': self._sugerir_estrategia(),
            'numeros_calientes': self._obtener_numeros_calientes(),
            'numeros_frios': self._obtener_numeros_frios(),
            'superbalotas_sugeridas': self._sugerir_superbalotas(),
            'alerta_frios_extremos': self._detectar_frios_extremos(),
            'patrones_destacados': self._identificar_patrones_destacados()
        }
        
        return rec
    
    def _sugerir_estrategia(self) -> str:
        """Sugiere la mejor estrategia basada en análisis"""
        temporal = self.analisis_completo.get('temporal', {})
        patrones = self.analisis_completo.get('patrones', {})
        
        frios = temporal.get('frios', [])
        en_racha = temporal.get('en_racha', [])
        
        # Si hay muchos números fríos, sugerir estrategia de fríos
        if len(frios) >= 8:
            return "fria"
        # Si hay números en racha fuerte, sugerir estrategia caliente
        elif len(en_racha) >= 3:
            return "caliente"
        else:
            return "balanceada"
    
    def _obtener_numeros_calientes(self) -> List[int]:
        """Obtiene números calientes para recomendar"""
        frecuencias = self.analisis_completo.get('frecuencias', {})
        top_calientes = frecuencias.get('top_20_calientes', [])
        return [num for num, _ in top_calientes[:10]]
    
    def _obtener_numeros_frios(self) -> List[int]:
        """Obtiene números fríos para recomendar"""
        frecuencias = self.analisis_completo.get('frecuencias', {})
        top_frios = frecuencias.get('top_10_frios', [])
        return [num for num, _ in top_frios]
    
    def _sugerir_superbalotas(self) -> List[int]:
        """Sugiere superbalotas basadas en análisis"""
        frecuencias = self.analisis_completo.get('frecuencias', {})
        top_sb = frecuencias.get('top_5_superbalotas', [])
        return [sb for sb, _ in top_sb[:3]]
    
    def _detectar_frios_extremos(self) -> List[int]:
        """Detecta números que llevan mucho sin salir"""
        temporal = self.analisis_completo.get('temporal', {})
        return temporal.get('frios', [])[:5]
    
    def _identificar_patrones_destacados(self) -> List[str]:
        """Identifica patrones importantes"""
        patrones = self.analisis_completo.get('patrones', {})
        destacados = []
        
        # Patrón de pares/impares
        pares_info = patrones.get('pares_impares', {})
        promedio_pares = pares_info.get('promedio_pares', 0)
        if 2 <= promedio_pares <= 3:
            destacados.append(f"Distribución equilibrada: {promedio_pares:.1f} pares por sorteo")
        
        # Patrón de suma
        sumas_info = patrones.get('sumas', {})
        suma_promedio = sumas_info.get('promedio', 0)
        if 100 <= suma_promedio <= 120:
            destacados.append(f"Suma promedio óptima: {suma_promedio:.1f}")
        
        return destacados
    
    def ejecutar_analisis_completo(self) -> Dict[str, Any]:
        """Ejecuta todos los análisis y retorna resultados consolidados"""
        print("\n" + "="*60)
        print("🔍 INICIANDO ANÁLISIS COMPLETO DE DATOS DE BALOTO")
        print("="*60)
        
        if not self.cargar_datos():
            return {}
        
        self.analisis_completo = {
            'basico': self.analizar_basico(),
            'frecuencias': self.analizar_frecuencias(),
            'patrones': self.analizar_patrones(),
            'temporal': self.analizar_temporal(),
            'recomendaciones': {}
        }
        
        self.analisis_completo['recomendaciones'] = self.generar_recomendaciones()
        
        print("\n" + "="*60)
        print("✅ ANÁLISIS COMPLETADO EXITOSAMENTE")
        print("="*60)
        
        return self.analisis_completo
    
    def generar_reporte_consola(self):
        """Genera un reporte detallado en consola"""
        if not self.analisis_completo:
            print("❌ No hay análisis para generar reporte")
            return
        
        basico = self.analisis_completo['basico']
        frecuencias = self.analisis_completo['frecuencias']
        patrones = self.analisis_completo['patrones']
        temporal = self.analisis_completo['temporal']
        recomendaciones = self.analisis_completo['recomendaciones']
        
        print("\n" + "="*60)
        print("📊 REPORTE DE ANÁLISIS - BALOTO")
        print("="*60)
        
        # Datos básicos
        print(f"\n📈 DATOS BÁSICOS:")
        print(f"   • Total sorteos analizados: {basico.get('total_baloto', 0):,}")
        print(f"   • Período: {basico.get('fecha_inicio', 'N/A')} - {basico.get('fecha_fin', 'N/A')}")
        if basico.get('dias_cobertura'):
            print(f"   • Días de cobertura: {basico['dias_cobertura']:,}")
        
        # Números más frecuentes
        print(f"\n🔥 TOP 10 NÚMEROS MÁS FRECUENTES:")
        for i, (num, count) in enumerate(frecuencias.get('top_20_calientes', [])[:10], 1):
            porcentaje = (count / basico.get('total_baloto', 1)) * 100 if basico.get('total_baloto') else 0
            print(f"   {i:2d}. Número {num:2d}: {count:3d} veces ({porcentaje:.1f}%)")
        
        # Números menos frecuentes
        print(f"\n❄️ TOP 10 NÚMEROS MENOS FRECUENTES:")
        frios = frecuencias.get('top_10_frios', [])
        for i, (num, count) in enumerate(frios, 1):
            porcentaje = (count / basico.get('total_baloto', 1)) * 100 if basico.get('total_baloto') else 0
            print(f"   {i:2d}. Número {num:2d}: {count:3d} veces ({porcentaje:.1f}%)")
        
        # Superbalotas
        print(f"\n🎱 SUPERBALOTAS MÁS FRECUENTES:")
        for i, (sb, count) in enumerate(frecuencias.get('top_5_superbalotas', [])[:5], 1):
            porcentaje = (count / basico.get('total_baloto', 1)) * 100 if basico.get('total_baloto') else 0
            print(f"   {i:2d}. Superbalota {sb:2d}: {count:3d} veces ({porcentaje:.1f}%)")
        
        # Patrones
        print(f"\n🎯 PATRONES DETECTADOS:")
        pares_info = patrones.get('pares_impares', {})
        if 'promedio_pares' in pares_info:
            print(f"   • Pares por sorteo: {pares_info['promedio_pares']:.1f}")
        
        sumas_info = patrones.get('sumas', {})
        if 'promedio' in sumas_info:
            print(f"   • Suma promedio: {sumas_info['promedio']:.1f}")
            print(f"   • Rango común (Q1-Q3): {sumas_info.get('q1', 0):.0f} - {sumas_info.get('q3', 0):.0f}")
        
        # Tendencias
        print(f"\n📈 TENDENCIAS RECIENTES (últimos {temporal.get('total_sorteos_recientes', 0)} sorteos):")
        if temporal.get('en_racha'):
            print(f"   • Números en racha: {', '.join(map(str, temporal['en_racha']))}")
        if temporal.get('frios'):
            print(f"   • Números fríos (no salen en 50 sorteos): {', '.join(map(str, temporal['frios'][:5]))}")
        
        # Recomendaciones
        print(f"\n💡 RECOMENDACIONES:")
        print(f"   • Estrategia sugerida: {recomendaciones.get('estrategia_sugerida', 'balanceada').upper()}")
        
        if recomendaciones.get('numeros_calientes'):
            print(f"   • Números calientes: {', '.join(map(str, recomendaciones['numeros_calientes']))}")
        
        if recomendaciones.get('numeros_frios'):
            print(f"   • Números fríos: {', '.join(map(str, recomendaciones['numeros_frios']))}")
        
        if recomendaciones.get('superbalotas_sugeridas'):
            print(f"   • Superbalotas sugeridas: {', '.join(map(str, recomendaciones['superbalotas_sugeridas']))}")
        
        if recomendaciones.get('alerta_frios_extremos'):
            print(f"   ⚠️  Alerta: Números muy fríos: {', '.join(map(str, recomendaciones['alerta_frios_extremos']))}")
        
        if recomendaciones.get('patrones_destacados'):
            print(f"\n📝 PATRONES DESTACADOS:")
            for patron in recomendaciones['patrones_destacados']:
                print(f"   • {patron}")
        
        print("\n" + "="*60)
        print("🎯 ¡ANÁLISIS LISTO PARA TOMAR DECISIONES!")
        print("="*60)
    
    def guardar_analisis_json(self, archivo_salida: str = "../reports/analisis_baloto.json"):
        """Guarda el análisis completo en formato JSON"""
        try:
            # Crear la carpeta reports si no existe
            os.makedirs(os.path.dirname(archivo_salida), exist_ok=True)
            
            with open(archivo_salida, 'w', encoding='utf-8') as f:
                # Convertir objetos numpy a Python nativo
                def convert_to_serializable(obj):
                    if isinstance(obj, (np.integer, np.floating)):
                        return float(obj)
                    elif isinstance(obj, np.ndarray):
                        return obj.tolist()
                    elif isinstance(obj, datetime):
                        return obj.isoformat()
                    return obj
                
                # Convertir el análisis a JSON serializable
                analisis_serializable = json.loads(
                    json.dumps(self.analisis_completo, default=convert_to_serializable)
                )
                
                json.dump(analisis_serializable, f, indent=2, ensure_ascii=False)
            
            print(f"✅ Análisis guardado en: {archivo_salida}")
            return True
        except Exception as e:
            print(f"❌ Error al guardar análisis: {e}")
            return False

def main():
    """Función principal para ejecución desde línea de comandos"""
    parser = argparse.ArgumentParser(description='Analizador de datos históricos de Baloto')
    parser.add_argument('--csv', type=str, default='data/baloto_historico_completo.csv',
                       help='Ruta al archivo CSV con datos históricos')
    parser.add_argument('--modo', type=str, default='completo',
                       choices=['completo', 'basico', 'frecuencias', 'patrones'],
                       help='Modo de análisis')
    parser.add_argument('--salida', type=str, default='consola',
                       choices=['consola', 'json', 'ambos'],
                       help='Formato de salida')
    parser.add_argument('--archivo-salida', type=str, default='reports/analisis_baloto.json',
                       help='Nombre del archivo de salida para JSON')
    
    args = parser.parse_args()
    
    # Crear y ejecutar analizador
    analizador = BalotoAnalyzer(args.csv)
    
    if args.modo == 'completo':
        analizador.ejecutar_analisis_completo()
        
        if args.salida in ['consola', 'ambos']:
            analizador.generar_reporte_consola()
        
        if args.salida in ['json', 'ambos']:
            analizador.guardar_analisis_json(args.archivo_salida)
    
    elif args.modo == 'basico':
        if analizador.cargar_datos():
            basico = analizador.analizar_basico()
            print(json.dumps(basico, indent=2, default=str))
    
    elif args.modo == 'frecuencias':
        if analizador.cargar_datos():
            frecuencias = analizador.analizar_frecuencias()
            print(json.dumps(frecuencias, indent=2, default=str))
    
    elif args.modo == 'patrones':
        if analizador.cargar_datos():
            patrones = analizador.analizar_patrones()
            print(json.dumps(patrones, indent=2, default=str))

if __name__ == "__main__":
    main()