"""
successes.py - Analizador de resultados de Baloto (Versión Corregida)
Versión 2.1: Corregido problema de comparación de fechas
"""

import csv
import os
import json
from datetime import datetime
from collections import Counter, defaultdict
import numpy as np
from typing import Dict, List, Tuple, Optional, Any

# ============================================================================
# CONFIGURACIÓN DEL SISTEMA CON RUTAS ACTUALIZADAS
# ============================================================================

HISTORICO_CSV = "data/baloto_historico_completo.csv"
MIS_JUEGOS_CSV = "data/mis_juegos_generados.csv"
ANALISIS_JSON = "reports/analisis_baloto.json"

# ============================================================================
# FUNCIONES AUXILIARES CORREGIDAS
# ============================================================================

def parsear_fecha_input(fecha_str: str) -> Optional[datetime]:
    """
    Parsea fecha en formato DD-MM-AAAA (ej: '31-12-2025')
    También maneja otros formatos comunes
    """
    if not fecha_str or str(fecha_str).strip() == '':
        return None
    
    fecha_str = str(fecha_str).strip()
    
    # PRIMERO: Intentar parsear formato de Baloto "D de Mes de AAAA"
    try:
        meses = {
            'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4, 'Mayo': 5, 'Junio': 6,
            'Julio': 7, 'Agosto': 8, 'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
        }
        
        # Formato: "3 de Enero de 2026"
        partes = fecha_str.replace('de ', '').split()
        if len(partes) >= 3:
            dia = int(partes[0])
            mes_nombre = partes[1]
            año = int(partes[2])
            
            if mes_nombre in meses:
                return datetime(año, meses[mes_nombre], dia)
    except:
        pass  # Si falla, continuar con otros formatos
    
    # SEGUNDO: Intentar diferentes formatos estándar
    formatos = [
        '%d-%m-%Y',    # 31-12-2025
        '%Y-%m-%d',    # 2025-12-31
        '%d/%m/%Y',    # 31/12/2025
        '%Y/%m/%d',    # 2025/12/31
        '%d.%m.%Y',    # 31.12.2025
        '%d %b %Y',    # 31 Dec 2025
        '%b %d %Y',    # Dec 31 2025
    ]
    
    for formato in formatos:
        try:
            return datetime.strptime(fecha_str, formato)
        except ValueError:
            continue
    
    # TERCERO: Si no funciona con formatos estándar, intentar parsear manualmente
    try:
        import re
        numeros = re.findall(r'\d+', fecha_str)
        if len(numeros) >= 3:
            dia = int(numeros[0])
            mes = int(numeros[1])
            año = int(numeros[2])
            
            if año < 100:
                año += 2000 if año < 50 else 1900
            
            return datetime(año, mes, dia)
    except:
        pass
    
    print(f"⚠️  No se pudo parsear fecha: '{fecha_str}'")  # Debug
    return None

def parsear_fecha_baloto(fecha_str: str) -> Optional[datetime]:
    """
    Parsea fecha en formato Baloto (ej: '31 de Diciembre de 2025')
    """
    if not fecha_str:
        return None
    
    try:
        meses = {
            'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4, 'Mayo': 5, 'Junio': 6,
            'Julio': 7, 'Agosto': 8, 'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
        }
        
        # Limpiar y separar
        partes = fecha_str.replace('de ', '').split()
        
        if len(partes) >= 3:
            dia = int(partes[0])
            mes_nombre = partes[1]
            año = int(partes[2])
            
            if mes_nombre in meses:
                return datetime(año, meses[mes_nombre], dia)
    except Exception as e:
        # Intentar método alternativo
        try:
            # Buscar mes en texto
            for mes_nombre, mes_num in meses.items():
                if mes_nombre in fecha_str:
                    # Extraer día y año
                    import re
                    numeros = re.findall(r'\d+', fecha_str)
                    if len(numeros) >= 2:
                        dia = int(numeros[0])
                        año = int(numeros[1]) if len(numeros) > 1 else datetime.now().year
                        if año < 100:
                            año += 2000 if año < 50 else 1900
                        return datetime(año, mes_num, dia)
        except:
            pass
    
    return None

def normalizar_fecha_para_comparacion(fecha_dt: datetime) -> str:
    """Convierte datetime a string normalizado para comparación"""
    return fecha_dt.strftime('%Y-%m-%d') if fecha_dt else ''

# ============================================================================
# CLASE PRINCIPAL CORREGIDA
# ============================================================================

class AnalizadorResultadosCorregido:
    """Analizador con comparación de fechas corregida"""
    
    def __init__(self, juego: str = "Baloto"):
        self.juego = juego
        self.historico_oficial = []
        self.mis_juegos = []
        self.resultados = []
    
    def cargar_datos(self) -> bool:
        """Carga datos históricos y mis juegos"""
        print(f"📂 Cargando datos para {self.juego}...")
        
        if not self._cargar_historico_oficial():
            return False
        
        if not self._cargar_mis_juegos():
            return False
        
        print(f"✅ Datos cargados:")
        print(f"   • Sorteos oficiales: {len(self.historico_oficial)}")
        print(f"   • Mis juegos: {len(self.mis_juegos)}")
        
        return True
    
    def _cargar_historico_oficial(self) -> bool:
        """Carga histórico oficial de sorteos"""
        if not os.path.exists(HISTORICO_CSV):
            print(f"❌ Archivo no encontrado: {HISTORICO_CSV}")
            print(f"   Ruta buscada: {os.path.abspath(HISTORICO_CSV)}")
            return False
        
        try:
            with open(HISTORICO_CSV, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                for row in reader:
                    if row.get('tipo') == self.juego:
                        try:
                            # Parsear fecha oficial
                            fecha_oficial = parsear_fecha_baloto(row['fecha'])
                            if not fecha_oficial:
                                continue
                            
                            self.historico_oficial.append({
                                'fecha_str': row['fecha'],
                                'fecha_dt': fecha_oficial,
                                'fecha_normalizada': normalizar_fecha_para_comparacion(fecha_oficial),
                                'num1': int(row['num1']),
                                'num2': int(row['num2']),
                                'num3': int(row['num3']),
                                'num4': int(row['num4']),
                                'num5': int(row['num5']),
                                'num6': int(row['num6']),
                                'tipo': row['tipo']
                            })
                        except (ValueError, KeyError):
                            continue
            
            print(f"   ✓ Histórico oficial: {len(self.historico_oficial)} sorteos")
            return True
            
        except Exception as e:
            print(f"❌ Error cargando histórico: {e}")
            return False
    
    def _cargar_mis_juegos(self) -> bool:
        """Carga mis juegos generados"""
        if not os.path.exists(MIS_JUEGOS_CSV):
            print(f"⚠️  Archivo no encontrado: {MIS_JUEGOS_CSV}")
            print(f"   Ruta buscada: {os.path.abspath(MIS_JUEGOS_CSV)}")
            print("   Genera juegos primero con: python new_game.py")
            return False
            
        try:
            with open(MIS_JUEGOS_CSV, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                campos = reader.fieldnames or []
                
                for row in reader:
                    try:
                        # DEBUG: Mostrar qué fecha estamos procesando
                        fecha_raw = row.get('fecha_juego', 'N/A')
                        
                        # Parsear fecha del juego
                        fecha_juego = parsear_fecha_input(fecha_raw)
                        
                        if not fecha_juego:
                            print(f"⚠️  Fecha inválida en juego: '{fecha_raw}'")
                            # DEBUG adicional: mostrar qué parte falló
                            print(f"   (Formato no reconocido)")
                            continue
                        else:
                            # DEBUG: Mostrar éxito
                            print(f"✓ Fecha parseada: '{fecha_raw}' → {fecha_juego.strftime('%Y-%m-%d')}")
                        
                        juego_data = {
                            'fecha_str': row['fecha_juego'],
                            'fecha_dt': fecha_juego,
                            'fecha_normalizada': normalizar_fecha_para_comparacion(fecha_juego),
                            'num1': int(row['num1']),
                            'num2': int(row['num2']),
                            'num3': int(row['num3']),
                            'num4': int(row['num4']),
                            'num5': int(row['num5']),
                            'num6': int(row['num6'])
                        }
                        
                        # Agregar metadata si existe
                        if 'estrategia' in campos:
                            juego_data['estrategia'] = row.get('estrategia', 'desconocida')
                        else:
                            juego_data['estrategia'] = 'legacy'
                        
                        if 'puntaje' in campos and row.get('puntaje', '').strip():
                            try:
                                juego_data['puntaje'] = float(row['puntaje'])
                            except:
                                juego_data['puntaje'] = 0
                        else:
                            juego_data['puntaje'] = 0
                        
                        self.mis_juegos.append(juego_data)
                        
                    except (ValueError, KeyError) as e:
                        print(f"⚠️  Error en juego: {e}")
                        continue
            
            print(f"   ✓ Mis juegos: {len(self.mis_juegos)} juegos")
            return True
            
        except Exception as e:
            print(f"❌ Error cargando mis juegos: {e}")
            return False
    
    def comparar_juegos(self):
        """Compara cada juego con sorteos oficiales"""
        print(f"\n🔍 Comparando {len(self.mis_juegos)} juegos...")
        
        self.resultados = []
        coincidencias_encontradas = 0
        
        # Crear diccionario de sorteos por fecha normalizada
        sorteos_por_fecha = {}
        for sorteo in self.historico_oficial:
            key = sorteo['fecha_normalizada']
            if key:
                sorteos_por_fecha[key] = sorteo
        
        for juego in self.mis_juegos:
            fecha_key = juego['fecha_normalizada']
            
            if fecha_key in sorteos_por_fecha:
                sorteo = sorteos_por_fecha[fecha_key]
                resultado = self._comparar_juego_con_sorteo(juego, sorteo)
                self.resultados.append(resultado)
                coincidencias_encontradas += 1
            else:
                print(f"   ⚠️  No hay sorteo para: {juego['fecha_str']}")
        
        print(f"✅ Encontradas {coincidencias_encontradas} coincidencias")
        return coincidencias_encontradas > 0
    
    def _comparar_juego_con_sorteo(self, juego: Dict, sorteo: Dict) -> Dict:
        """Compara un juego con un sorteo oficial"""
        # Comparar números principales
        nums_juego = {juego['num1'], juego['num2'], juego['num3'], 
                      juego['num4'], juego['num5']}
        nums_sorteo = {sorteo['num1'], sorteo['num2'], sorteo['num3'],
                      sorteo['num4'], sorteo['num5']}
        
        aciertos_numeros = len(nums_juego.intersection(nums_sorteo))
        numeros_acertados = list(nums_juego.intersection(nums_sorteo))
        
        # Comparar superbalota
        acierto_sb = juego['num6'] == sorteo['num6']
        total_aciertos = aciertos_numeros + (1 if acierto_sb else 0)
        
        # Calcular suma
        suma_juego = sum(nums_juego)
        suma_sorteo = sum(nums_sorteo)
        
        # Calcular pares
        pares_juego = sum(1 for n in nums_juego if n % 2 == 0)
        pares_sorteo = sum(1 for n in nums_sorteo if n % 2 == 0)
        
        return {
            'fecha': juego['fecha_str'],
            'fecha_sorteo': sorteo['fecha_str'],
            'juego': juego,
            'sorteo': sorteo,
            'aciertos_numeros': aciertos_numeros,
            'acierto_superbalota': acierto_sb,
            'total_aciertos': total_aciertos,
            'numeros_acertados': sorted(numeros_acertados),
            'estrategia': juego.get('estrategia', 'desconocida'),
            'puntaje': juego.get('puntaje', 0),
            'estadisticas': {
                'suma_juego': suma_juego,
                'suma_sorteo': suma_sorteo,
                'diferencia_suma': abs(suma_juego - suma_sorteo),
                'pares_juego': pares_juego,
                'pares_sorteo': pares_sorteo,
                'diferencia_pares': abs(pares_juego - pares_sorteo)
            }
        }
    
    def mostrar_resultados_detallados(self):
        """Muestra resultados detallados"""
        if not self.resultados:
            print("❌ No hay resultados para mostrar")
            return
        
        print(f"\n{'='*60}")
        print(f"📊 RESULTADOS DETALLADOS - {self.juego.upper()}")
        print(f"{'='*60}")
        
        for i, res in enumerate(self.resultados, 1):
            print(f"\n🎯 JUEGO {i}: {res['fecha']}")
            print(f"   {'─' * 40}")
            
            # Mostrar números
            nums_juego = sorted([res['juego']['num1'], res['juego']['num2'],
                                res['juego']['num3'], res['juego']['num4'],
                                res['juego']['num5']])
            nums_sorteo = sorted([res['sorteo']['num1'], res['sorteo']['num2'],
                                 res['sorteo']['num3'], res['sorteo']['num4'],
                                 res['sorteo']['num5']])
            
            print(f"   • Tus números:    {nums_juego}")
            print(f"   • Sorteo oficial: {nums_sorteo}")
            print(f"   • Superbalota:    Tú={res['juego']['num6']}, "
                  f"Oficial={res['sorteo']['num6']}")
            
            # Mostrar aciertos
            print(f"\n   🎯 ACIERTOS:")
            print(f"      • Números: {res['aciertos_numeros']} "
                  f"({', '.join(map(str, res['numeros_acertados'])) if res['numeros_acertados'] else 'ninguno'})")
            print(f"      • Superbalota: {'✅ ACERTADA' if res['acierto_superbalota'] else '❌ No acertada'}")
            print(f"      • TOTAL: {res['total_aciertos']} aciertos")
            
            # Mostrar estrategia si existe
            if res['estrategia'] != 'desconocida':
                print(f"   🎯 Estrategia: {res['estrategia'].upper()}")
                if res['puntaje'] > 0:
                    print(f"   ⭐ Puntaje: {res['puntaje']}")
    
    def mostrar_resumen_estadistico(self):
        """Muestra resumen estadístico"""
        if not self.resultados:
            print("❌ No hay resultados para análisis estadístico")
            return
        
        print(f"\n{'='*60}")
        print(f"📈 RESUMEN ESTADÍSTICO")
        print(f"{'='*60}")
        
        # Estadísticas básicas
        total_juegos = len(self.resultados)
        total_aciertos = [r['total_aciertos'] for r in self.resultados]
        aciertos_numeros = [r['aciertos_numeros'] for r in self.resultados]
        aciertos_sb = sum(1 for r in self.resultados if r['acierto_superbalota'])
        
        print(f"\n📊 ESTADÍSTICAS BÁSICAS:")
        print(f"   • Total juegos analizados: {total_juegos}")
        print(f"   • Aciertos promedio: {np.mean(total_aciertos):.2f}")
        print(f"   • Máximo aciertos: {max(total_aciertos)}")
        print(f"   • Mínimo aciertos: {min(total_aciertos)}")
        print(f"   • Superbalotas acertadas: {aciertos_sb} ({aciertos_sb/total_juegos*100:.1f}%)")
        
        # Distribución de aciertos
        print(f"\n📊 DISTRIBUCIÓN DE ACIERTOS:")
        distribucion = Counter(total_aciertos)
        for aciertos in sorted(distribucion.keys()):
            cantidad = distribucion[aciertos]
            porcentaje = cantidad / total_juegos * 100
            print(f"   • {aciertos} aciertos: {cantidad:2d} juegos ({porcentaje:5.1f}%)")
        
        # Juegos con al menos 1 acierto
        juegos_con_acierto = sum(1 for a in total_aciertos if a > 0)
        print(f"\n🎯 EFECTIVIDAD:")
        print(f"   • Juegos con al menos 1 acierto: {juegos_con_acierto}/{total_juegos} "
              f"({juegos_con_acierto/total_juegos*100:.1f}%)")
        
        # Análisis por estrategia (si hay metadata)
        estrategias = Counter([r.get('estrategia', 'desconocida') for r in self.resultados])
        if len(estrategias) > 1 or (len(estrategias) == 1 and list(estrategias.keys())[0] != 'desconocida'):
            print(f"\n🎯 ANÁLISIS POR ESTRATEGIA:")
            for estrategia, count in estrategias.items():
                resultados_estrategia = [r for r in self.resultados if r.get('estrategia') == estrategia]
                if resultados_estrategia:
                    aciertos_promedio = np.mean([r['total_aciertos'] for r in resultados_estrategia])
                    print(f"   • {estrategia.upper():12}: {count:2d} juegos | "
                          f"Promedio: {aciertos_promedio:.2f} aciertos")
        
        # Comparación con aleatorio
        print(f"\n🎲 COMPARACIÓN CON ALEATORIO:")
        print(f"   • Esperado aleatorio: 0.85-0.95 aciertos promedio")
        print(f"   • Tu promedio: {np.mean(total_aciertos):.2f} aciertos")
        
        if np.mean(total_aciertos) > 0.9:
            print(f"   • 📈 ¡MEJOR que aleatorio!")
        elif np.mean(total_aciertos) < 0.8:
            print(f"   • 📉 PEOR que aleatorio")
        else:
            print(f"   • ➖ SIMILAR a aleatorio")
    
    def generar_recomendaciones(self):
        """Genera recomendaciones basadas en resultados"""
        if not self.resultados:
            return
        
        print(f"\n{'='*60}")
        print(f"💡 RECOMENDACIONES")
        print(f"{'='*60}")
        
        # Analizar patrones
        total_juegos = len(self.resultados)
        aciertos_sb = sum(1 for r in self.resultados if r['acierto_superbalota'])
        porcentaje_sb = aciertos_sb / total_juegos * 100
        
        recomendaciones = []
        
        # 1. Recomendación sobre superbalota
        if porcentaje_sb < 10:  # Menos del 10% de aciertos
            recomendaciones.append(
                f"🎱 Mejora estrategia de Superbalota (solo {porcentaje_sb:.1f}% de aciertos). "
                f"Considera usar números más frecuentes."
            )
        
        # 2. Recomendación sobre aciertos múltiples
        aciertos_multiples = sum(1 for r in self.resultados if r['total_aciertos'] >= 2)
        if aciertos_multiples == 0:
            recomendaciones.append(
                f"🎯 Busca estrategias para obtener 2+ aciertos. "
                f"Actualmente 0/{total_juegos} juegos con múltiples aciertos."
            )
        
        # 3. Recomendación general
        promedio = np.mean([r['total_aciertos'] for r in self.resultados])
        if promedio < 1.0:
            recomendaciones.append(
                f"📈 Intenta aumentar promedio de aciertos (actual: {promedio:.2f}). "
                f"Considera estrategia 'caliente' con números más frecuentes."
            )
        
        # Mostrar recomendaciones
        if recomendaciones:
            for i, rec in enumerate(recomendaciones, 1):
                print(f"\n{i}. {rec}")
        else:
            print(f"\n✅ ¡Buen trabajo! Sigue con tu estrategia actual.")
    
    def ejecutar_analisis_completo(self):
        """Ejecuta análisis completo"""
        if not self.cargar_datos():
            return
        
        if not self.comparar_juegos():
            print(f"\n❌ No se encontraron coincidencias para analizar")
            return
        
        self.mostrar_resultados_detallados()
        self.mostrar_resumen_estadistico()
        self.mostrar_aciertos_por_estrategia() 
        self.generar_recomendaciones()
        
        print(f"\n{'='*60}")
        print(f"🏁 ANÁLISIS COMPLETADO")
        print(f"{'='*60}")

    def mostrar_aciertos_por_estrategia(self):
        """Muestra qué números se acertaron agrupados por estrategia"""
        if not self.resultados:
            print("❌ No hay resultados para mostrar")
            return
        
        print(f"\n{'='*60}")
        print(f"🎯 ACIERTOS POR ESTRATEGIA")
        print(f"{'='*60}")
        
        # Agrupar resultados por estrategia
        resultados_por_estrategia = {}
        for resultado in self.resultados:
            estrategia = resultado.get('estrategia', 'desconocida')
            if estrategia not in resultados_por_estrategia:
                resultados_por_estrategia[estrategia] = []
            resultados_por_estrategia[estrategia].append(resultado)
        
        # Mostrar por cada estrategia
        for estrategia, resultados in resultados_por_estrategia.items():
            print(f"\n📊 ESTRATEGIA: {estrategia.upper()}")
            print(f"   {'─' * 40}")
            print(f"   • Juegos: {len(resultados)}")
            
            # Calcular estadísticas por estrategia
            total_aciertos = sum(r['total_aciertos'] for r in resultados)
            promedio_aciertos = total_aciertos / len(resultados) if resultados else 0
            sb_acertadas = sum(1 for r in resultados if r['acierto_superbalota'])
            
            print(f"   • Aciertos promedio: {promedio_aciertos:.2f}")
            print(f"   • Superbalotas acertadas: {sb_acertadas}/{len(resultados)}")
            
            # Mostrar qué números se acertaron en cada juego
            print(f"   • Números acertados por juego:")
            for i, resultado in enumerate(resultados, 1):
                fecha = resultado['fecha']
                numeros_acertados = resultado['numeros_acertados']
                superbalota_acertada = resultado['acierto_superbalota']
                
                if numeros_acertados:
                    nums_str = ', '.join(map(str, numeros_acertados))
                    sb_str = " (✅ SB)" if superbalota_acertada else ""
                    print(f"     Juego {i} ({fecha}): {nums_str}{sb_str}")
                else:
                    sb_str = " (✅ solo SB)" if superbalota_acertada else ""
                    print(f"     Juego {i} ({fecha}): Ningún número{sb_str}")
            
            # Mostrar frecuencia de números acertados en esta estrategia
            print(f"\n   • Frecuencia de números acertados:")
            todos_numeros_acertados = []
            for resultado in resultados:
                todos_numeros_acertados.extend(resultado['numeros_acertados'])
            
            if todos_numeros_acertados:
                # AQUÍ ESTÁ EL PROBLEMA: Necesitas importar Counter
                from collections import Counter
                frecuencia = Counter(todos_numeros_acertados)
                for num, count in frecuencia.most_common():
                    porcentaje = (count / len(resultados)) * 100
                    print(f"     Número {num:2d}: {count} veces ({porcentaje:.0f}% de los juegos)")
            else:
                print(f"     No se acertaron números con esta estrategia")
        
        print(f"\n{'='*60}")


# ============================================================================
# FUNCIÓN PRINCIPAL CON MENSJES MEJORADOS
# ============================================================================

def main():
    """Función principal"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Analizador de resultados de Baloto (v2.1)',
        epilog="""
Ejemplos de uso:
  python successes.py                    # Análisis completo de Baloto
  python successes.py --juego Revancha  # Análisis para Revancha
  python successes.py --simple          # Solo resultados básicos
  
Nota: Este script debe ejecutarse desde la raíz del proyecto para usar la estructura:
  proyecto/
  ├── scripts/       (aquí está successes.py)
  ├── data/          (archivos CSV)
  └── reports/       (archivos JSON)
        """
    )
    
    parser.add_argument('--juego', type=str, default='Baloto',
                       choices=['Baloto', 'Revancha'],
                       help='Tipo de juego a analizar')
    parser.add_argument('--simple', action='store_true',
                       help='Mostrar solo resultados básicos')
    
    args = parser.parse_args()
    
    print(f"\n{'='*60}")
    print(f"🔍 ANALIZADOR DE RESULTADOS - {args.juego.upper()}")
    print(f"{'='*60}")
    
    analizador = AnalizadorResultadosCorregido(juego=args.juego)
    
    if args.simple:
        # Modo simple
        if analizador.cargar_datos() and analizador.comparar_juegos():
            analizador.mostrar_resultados_detallados()
    else:
        # Análisis completo
        analizador.ejecutar_analisis_completo()

if __name__ == "__main__":
    main()