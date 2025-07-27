import random
import csv
import os
from datetime import datetime, timedelta
import sys
import numpy as np 
from collections import defaultdict 

# --- CONFIGURACIÓN DE NÚMEROS DE LOTERÍA ---
NUM_MIN_PRINCIPALES = 1
NUM_MAX_PRINCIPALES = 43
CANTIDAD_PRINCIPALES = 5 

NUM_MIN_SUPERBALOTA = 1
NUM_MAX_SUPERBALOTA = 16
CANTIDAD_SUPERBALOTA = 1 

# --- CONFIGURACIÓN DE ARCHIVOS ---
HISTORICO_CSV_FILE = "baloto_historico_completo.csv"
MIS_JUEGOS_GENERADOS_FILE = "mis_juegos_generados.csv"

# Encabezados CSV para la verificación de unicidad global
CSV_HEADERS_FOR_GAME_CHECK = ["num1", "num2", "num3", "num4", "num5", "num6"]
# Encabezados para tu archivo de juegos generados
MIS_JUEGOS_GENERADOS_HEADERS = ["fecha_juego", "num1", "num2", "num3", "num4", "num5", "num6"]

# --- CRITERIOS DE OPTIMIZACIÓN ---
SUMA_MIN_DESEADA = 90
SUMA_MAX_DESEADA = 120

# --- CONFIGURACIÓN DE PROXIMIDAD ---
# Definimos las distancias y sus pesos
# Por ejemplo, una diferencia de 1 suma 3 puntos, una de 2 suma 2, una de 3 suma 1.
PROXIMIDAD_RANGES = {1: 3, 2: 2, 3: 1} # {Diferencia_Absoluta: Puntos_Asignados}

# --- FUNCIONES AUXILIARES ---

def parse_baloto_date(date_str):
    """
    Parsea una cadena de fecha de Baloto (ej. "24 de Julio de 2025") a un objeto datetime.
    """
    meses = {
        'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4, 'Mayo': 5, 'Junio': 6,
        'Julio': 7, 'Agosto': 8, 'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
    }
    try:
        partes = date_str.replace('de ', '').split(' ')
        day = int(partes[0])
        month = meses[partes[1]]
        year = int(partes[2])
        return datetime(year, month, day)
    except (ValueError, IndexError, KeyError) as e:
        raise ValueError(f"Error al parsear fecha Baloto '{date_str}': {e}")

def parse_input_date(date_str_ddmmyyyy):
    """
    Parsea una cadena de fecha en formato DD-MM-AAAA a un objeto datetime.
    """
    return datetime.strptime(date_str_ddmmyyyy, '%d-%m-%Y')


# --- FUNCIONES DE CARGA Y ANÁLISIS DEL HISTÓRICO ---

def cargar_historico_para_analisis_y_unicidad(file_path):
    """
    Carga el histórico completo de sorteos desde el archivo CSV.
    Retorna:
    - historico_combinaciones_set: Un set de strings de combinaciones (ej. "1-2-3-4-5-6") para unicidad.
    - historico_numeros_ordenados: Una lista de listas, donde cada lista interior son los 5 números principales ordenados.
    - superbalotas_historicas_con_fechas: Una lista de tuplas (datetime_fecha, superbalota_numero), ordenada por fecha.
    - historico_numeros_principales_sin_orden: Lista de listas de los 5 números principales tal como salieron (sin ordenar), para análisis de proximidad.
    """
    historico_combinaciones_set = set()
    historico_numeros_ordenados = []
    superbalotas_historicas_con_fechas = []
    historico_numeros_principales_sin_orden = [] # Para el análisis de proximidad

    if not os.path.exists(file_path):
        print(f"Advertencia: Archivo histórico '{file_path}' no encontrado. No se podrán realizar validaciones avanzadas.")
        return historico_combinaciones_set, historico_numeros_ordenados, superbalotas_historicas_con_fechas, historico_numeros_principales_sin_orden

    try:
        with open(file_path, mode='r', newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            required_headers = CSV_HEADERS_FOR_GAME_CHECK + ['fecha']
            if not all(h in reader.fieldnames for h in required_headers):
                print(f"Advertencia: El archivo CSV '{file_path}' no tiene todos los encabezados requeridos. Verificación limitada.")

            for row in reader:
                try:
                    # Para la verificación de unicidad
                    if all(num_col in row and row[num_col] is not None for num_col in CSV_HEADERS_FOR_GAME_CHECK):
                        principales_str = [row[f'num{i}'] for i in range(1, 6)]
                        superbalota_str = row['num6']

                        # Convertir a int y guardar para análisis
                        numeros_principales = [int(n) for n in principales_str]
                        historico_numeros_principales_sin_orden.append(numeros_principales) # Guardar sin ordenar
                        
                        # Ordenar para cuartiles y unicidad
                        numeros_principales_ordenados = sorted(numeros_principales)
                        historico_numeros_ordenados.append(numeros_principales_ordenados)

                        superbalota = int(superbalota_str)
                        combinacion_str = "-".join(map(str, numeros_principales_ordenados)) + f"-{superbalota}"
                        historico_combinaciones_set.add(combinacion_str)


                    # Para el análisis de Superbalotas (fecha y num6)
                    if 'fecha' in row and 'num6' in row and row['fecha'] and row['num6'] is not None:
                        fecha_dt = parse_baloto_date(row['fecha'])
                        superbalota_num = int(row['num6'])
                        superbalotas_historicas_con_fechas.append((fecha_dt, superbalota_num))

                except (ValueError, KeyError) as e:
                    print(f"Advertencia: Fila inválida o incompleta en CSV (error: {e}): {row}. Saltando.")
        
        superbalotas_historicas_con_fechas.sort(key=lambda x: x[0]) # Asegurar que esté ordenado por fecha
        print(f"Histórico cargado. Combinaciones para unicidad: {len(historico_combinaciones_set)}, Números principales para cuartiles: {len(historico_numeros_ordenados)}, Superbalotas con fechas para análisis: {len(superbalotas_historicas_con_fechas)}, Números sin ordenar para proximidad: {len(historico_numeros_principales_sin_orden)}")
    except Exception as e:
        print(f"Error al cargar el histórico desde '{file_path}': {e}. Se generará el juego sin validaciones avanzadas.")
        historico_combinaciones_set = set() 
        historico_numeros_ordenados = []
        superbalotas_historicas_con_fechas = []
        historico_numeros_principales_sin_orden = []
    
    return historico_combinaciones_set, historico_numeros_ordenados, superbalotas_historicas_con_fechas, historico_numeros_principales_sin_orden

def calcular_cuartiles_historicos(historico_numeros_ordenados):
    """
    Calcula Q1 y Q3 para cada posición de número principal (del 1 al 5)
    basado en el histórico.
    Retorna un diccionario con los cuartiles: {posicion: {'q1': val, 'q3': val}}
    """
    if not historico_numeros_ordenados:
        return {}

    numeros_por_posicion = {i: [] for i in range(5)} 

    for sorteo_nums in historico_numeros_ordenados:
        for i in range(5):
            if i < len(sorteo_nums): 
                numeros_por_posicion[i].append(sorteo_nums[i])

    cuartiles = {}
    for i in range(5):
        if numeros_por_posicion[i]: 
            datos_np = np.array(numeros_por_posicion[i])
            cuartiles[f"pos{i+1}"] = {
                'q1': np.percentile(datos_np, 25),
                'q3': np.percentile(datos_np, 75)
            }
        else:
            print(f"Advertencia: No hay suficientes datos para calcular cuartiles para la posición {i+1}.")
    return cuartiles

def calcular_promedios_repeticion_superbalotas(superbalotas_historicas_con_fechas):
    """
    Calcula la última fecha de aparición de cada superbalota y el promedio de días
    entre sus repeticiones.
    Retorna dos diccionarios:
    - ultimas_fechas: {superbalota_numero: ultima_fecha_datetime}
    - promedios_dias_repeticion: {superbalota_numero: promedio_dias}
    """
    ultima_fecha_aparicion = {}
    intervalos_por_superbalota = defaultdict(list)
    promedios_dias_repeticion = {}

    for fecha_actual, superbalota_actual in superbalotas_historicas_con_fechas:
        if superbalota_actual in ultima_fecha_aparicion:
            fecha_anterior = ultima_fecha_aparicion[superbalota_actual]
            diferencia_dias = (fecha_actual - fecha_anterior).days
            intervalos_por_superbalota[superbalota_actual].append(diferencia_dias)
        
        ultima_fecha_aparicion[superbalota_actual] = fecha_actual

    for superbalota, intervalos in intervalos_por_superbalota.items():
        if intervalos: 
            promedios_dias_repeticion[superbalota] = sum(intervalos) / len(intervalos)
        else:
            pass 

    print(f"Últimas fechas de aparición de Superbalotas cargadas. Total de Superbalotas con registro: {len(ultima_fecha_aparicion)}")
    print(f"Promedios de repetición de Superbalotas calculados. Total con promedio: {len(promedios_dias_repeticion)}")
    
    return ultima_fecha_aparicion, promedios_dias_repeticion

def calcular_puntajes_proximidad(historico_numeros_principales_sin_orden, num_min, num_max, ranges_weights):
    """
    Calcula un puntaje de proximidad para cada número en el rango dado,
    basado en qué tan cerca estuvieron de los números ganadores reales.
    Retorna un diccionario: {numero: puntaje_total_proximidad}
    """
    proximity_scores = defaultdict(int)

    # Iterar a través de cada sorteo histórico
    for winning_numbers in historico_numeros_principales_sin_orden:
        # Para cada número posible en el rango (ej. 1 a 43 para principales)
        for candidate_num in range(num_min, num_max + 1):
            # Verificar la cercanía con CADA número ganador de este sorteo
            for winner_num in winning_numbers:
                diff = abs(candidate_num - winner_num)
                # Si la diferencia está en nuestros rangos de proximidad, añadir puntos
                if diff in ranges_weights:
                    proximity_scores[candidate_num] += ranges_weights[diff]
    
    # Normalizar los puntajes para que sumen 1 (probabilidades) o simplemente devolver los puntajes brutos
    # Para sesgar la selección, los puntajes brutos son útiles. Si no hay puntajes, dar un valor base.
    if not proximity_scores:
        # Si no hay datos, todos los números tienen el mismo "puntaje" base
        for num in range(num_min, num_max + 1):
            proximity_scores[num] = 1 
    
    return dict(proximity_scores) # Convertir a dict regular

def select_number_with_proximity_bias(num_min, num_max, proximity_scores):
    """
    Selecciona un número dentro de un rango dado, sesgando la selección
    hacia números con mayores puntajes de proximidad.
    """
    possible_numbers = list(range(num_min, num_max + 1))
    
    # Obtener los pesos (puntajes de proximidad) para cada número posible
    weights = [proximity_scores.get(num, 1) for num in possible_numbers] # Si no tiene score, peso base de 1

    # Crear una lista ponderada de números para hacer la selección.
    # Los números con pesos más altos aparecerán más veces en esta lista,
    # aumentando su probabilidad de ser elegidos por random.choice.
    weighted_list = []
    for num, weight in zip(possible_numbers, weights):
        weighted_list.extend([num] * weight)
    
    if not weighted_list: # Fallback si por alguna razón no se generó la lista
        return random.randint(num_min, num_max)

    return random.choice(weighted_list)

# --- FUNCIONES DE GENERACIÓN Y GUARDADO DE JUEGO ---

def generar_nueva_combinacion_unica(fecha_juego_dt, historico_combinaciones_set, cuartiles_historicos, 
                                   ultimas_fechas_superbalotas, promedios_dias_repeticion,
                                   puntajes_proximidad_principales, puntajes_proximidad_superbalota):
    """
    Genera una combinación de 6 números (5 principales y 1 superbalota)
    que no exista en el histórico de combinaciones, y que cumpla
    con los rangos de cuartiles, la suma deseada y el criterio de Superbalota dinámica,
    además de usar el sesgo de proximidad.
    """
    intentos = 0
    MAX_INTENTOS = 10000000 

    print("\nGenerando nueva combinación única de Baloto (con criterios de optimización avanzados y sesgo de proximidad)...")
    while intentos < MAX_INTENTOS:
        # Generar los 5 números principales con sesgo de proximidad
        # Asegurarse de que no haya duplicados
        numeros_principales_generados = set()
        while len(numeros_principales_generados) < CANTIDAD_PRINCIPALES:
            num = select_number_with_proximity_bias(NUM_MIN_PRINCIPALES, NUM_MAX_PRINCIPALES, puntajes_proximidad_principales)
            numeros_principales_generados.add(num)
        
        numeros_principales = sorted(list(numeros_principales_generados)) 
        
        # Generar la Superbalota con sesgo de proximidad
        superbalota = select_number_with_proximity_bias(NUM_MIN_SUPERBALOTA, NUM_MAX_SUPERBALOTA, puntajes_proximidad_superbalota)

        # --- Validación 1: Suma de los números principales ---
        suma_actual = sum(numeros_principales)
        if not (SUMA_MIN_DESEADA <= suma_actual <= SUMA_MAX_DESEADA):
            intentos += 1
            if intentos % 100000 == 0:
                print(f"Intento {intentos} (suma fuera de rango: {suma_actual})...")
            continue 

        # --- Validación 2: Cada número principal dentro de su rango Q1-Q3 ---
        cumple_cuartiles = True
        if cuartiles_historicos: 
            for i in range(CANTIDAD_PRINCIPALES):
                pos_key = f"pos{i+1}"
                if pos_key in cuartiles_historicos:
                    q1 = cuartiles_historicos[pos_key]['q1']
                    q3 = cuartiles_historicos[pos_key]['q3']
                    
                    if not (q1 <= numeros_principales[i] <= q3):
                        cumple_cuartiles = False
                        break 
                else:
                    cumple_cuartiles = False 
                    break 
        else:
            pass 
        
        if not cumple_cuartiles:
            intentos += 1
            if intentos % 100000 == 0:
                print(f"Intento {intentos} (números fuera de rangos Q1-Q3)..")
            continue 

        # --- Validación 3: Superbalota ha aparecido por encima de su promedio de "enfriamiento" ---
        cumple_superbalota_criterio = True
        if superbalota in ultimas_fechas_superbalotas:
            ultima_fecha_aparicion_sb = ultimas_fechas_superbalotas[superbalota]
            diferencia_dias = (fecha_juego_dt - ultima_fecha_aparicion_sb).days
            
            promedio_requerido = promedios_dias_repeticion.get(superbalota, None)

            if promedio_requerido is not None:
                if diferencia_dias < promedio_requerido:
                    cumple_superbalota_criterio = False
            else:
                pass 
        else:
            pass 
        
        if not cumple_superbalota_criterio:
            intentos += 1
            if intentos % 100000 == 0:
                print(f"Intento {intentos} (Superbalota {superbalota} salió muy recientemente o no cumple promedio: {diferencia_dias} días)...")
            continue 

        # --- Validación 4: Unicidad global (no haber salido antes en el histórico) ---
        nueva_combinacion_str = "-".join(map(str, numeros_principales)) + f"-{superbalota}"
        if nueva_combinacion_str not in historico_combinaciones_set:
            print(f"¡Combinación única y optimizada encontrada después de {intentos + 1} intentos!")
            return {
                "num1": numeros_principales[0],
                "num2": numeros_principales[1],
                "num3": numeros_principales[2],
                "num4": numeros_principales[3],
                "num5": numeros_principales[4],
                "num6": superbalota
            }
        
        intentos += 1
        if intentos % 100000 == 0:
            print(f"Intento {intentos} (combinación ya jugada)...")

    print(f"\n¡Advertencia! No se pudo encontrar una combinación única y optimizada después de {MAX_INTENTOS} intentos.")
    print("Esto podría significar que las restricciones son demasiado estrictas o que casi todas las combinaciones posibles ya se han jugado.")
    return None

def guardar_juego_generado_en_historial(fecha_juego_str, juego):
    """
    Añade el juego generado al archivo 'mis_juegos_generados.csv'.
    La nueva entrada se agrega al principio del archivo para que sea la más reciente.
    """
    data_to_save = {
        "fecha_juego": fecha_juego_str,
        "num1": juego['num1'],
        "num2": juego['num2'],
        "num3": juego['num3'],
        "num4": juego['num4'],
        "num5": juego['num5'],
        "num6": juego['num6']
    }

    existing_games = []
    if os.path.exists(MIS_JUEGOS_GENERADOS_FILE):
        try:
            with open(MIS_JUEGOS_GENERADOS_FILE, mode='r', newline='', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    valid_row = True
                    for header in MIS_JUEGOS_GENERADOS_HEADERS:
                        if header not in row or row[header] is None:
                            valid_row = False
                            break
                    if valid_row:
                        existing_games.append(row)
        except Exception as e:
            print(f"Error al leer juegos existentes de '{MIS_JUEGOS_GENERADOS_FILE}': {e}. Se intentará crear uno nuevo.")
            existing_games = []

    new_games_list = [data_to_save] + existing_games

    try:
        with open(MIS_JUEGOS_GENERADOS_FILE, mode='w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=MIS_JUEGOS_GENERADOS_HEADERS)
            writer.writeheader()
            writer.writerows(new_games_list)
        print(f"\nJuego generado y añadido al historial en '{MIS_JUEGOS_GENERADOS_FILE}' con fecha: {fecha_juego_str}")
    except Exception as e:
        print(f"Error al guardar el historial de juegos generados en '{MIS_JUEGOS_GENERADOS_FILE}': {e}")


# --- USO PRINCIPAL DEL PROGRAMA ---
if __name__ == "__main__":
    print("--- Generador de Combinación de Baloto Optimizada ---")
    
    if len(sys.argv) < 2:
        print("Error: Se requiere la fecha del juego como argumento (DD-MM-AAAA).")
        print("Ejemplo de uso: python new_game.py 28-07-2025")
        sys.exit(1)

    fecha_juego_str = sys.argv[1]
    fecha_juego_dt = None 
    try:
        fecha_juego_dt = parse_input_date(fecha_juego_str) 
    except ValueError:
        print(f"Error: Formato de fecha inválido para '{fecha_juego_str}'. Por favor, usa DD-MM-AAAA.")
        sys.exit(1)

    # 1. Cargar el histórico completo, incluyendo números sin ordenar para proximidad
    historico_combinaciones_set, historico_numeros_ordenados, superbalotas_historicas_con_fechas, historico_numeros_principales_sin_orden = \
        cargar_historico_para_analisis_y_unicidad(HISTORICO_CSV_FILE)
    
    # 2. Calcular los cuartiles históricos
    cuartiles_historicos = calcular_cuartiles_historicos(historico_numeros_ordenados)
    if not cuartiles_historicos:
        print("Advertencia: No se pudieron calcular los cuartiles históricos. El juego se generará sin validación de rangos Q1-Q3.")
    
    # 3. Calcular últimas fechas y promedios de repetición de Superbalotas
    ultimas_fechas_superbalotas, promedios_dias_repeticion = \
        calcular_promedios_repeticion_superbalotas(superbalotas_historicas_con_fechas)
    if not ultimas_fechas_superbalotas or not promedios_dias_repeticion:
        print("Advertencia: No hay suficientes datos para validar la Superbalota por su promedio de repetición. Este criterio no se aplicará.")
    
    # 4. Calcular los puntajes de proximidad para números principales y Superbalotas
    puntajes_proximidad_principales = calcular_puntajes_proximidad(historico_numeros_principales_sin_orden, 
                                                                  NUM_MIN_PRINCIPALES, NUM_MAX_PRINCIPALES, 
                                                                  PROXIMIDAD_RANGES)
    # Para la Superbalota, necesitamos una lista de las Superbalotas ganadoras.
    # Extraemos solo los números de las Superbalotas de superbalotas_historicas_con_fechas
    superbalotas_ganadoras = [sb_num for _, sb_num in superbalotas_historicas_con_fechas]
    puntajes_proximidad_superbalota = calcular_puntajes_proximidad([superbalotas_ganadoras], # Pasa como lista de listas para la función
                                                                   NUM_MIN_SUPERBALOTA, NUM_MAX_SUPERBALOTA, 
                                                                   PROXIMIDAD_RANGES)

    if not puntajes_proximidad_principales or not puntajes_proximidad_superbalota:
        print("Advertencia: No se pudieron calcular los puntajes de proximidad. La generación no usará sesgo de proximidad.")


    print("\nCriterios de Optimización para la generación:")
    print(f"- Suma de 5 números principales entre {SUMA_MIN_DESEADA} y {SUMA_MAX_DESEADA}")
    for i in range(1, 6):
        if f"pos{i}" in cuartiles_historicos:
            print(f"- Número {i} (ordenado) entre {cuartiles_historicos[f'pos{i}']['q1']:.0f} (Q1) y {cuartiles_historicos[f'pos{i}']['q3']:.0f} (Q3)")
    print(f"- Superbalota: Los días desde su última aparición deben ser >= a su promedio histórico de repetición.")
    print(f"- Números generados con sesgo hacia aquellos que históricamente han estado 'cerca' de números ganadores (distancias: {PROXIMIDAD_RANGES}).")

    # 5. Generar la nueva combinación única y optimizada
    nuevo_juego = generar_nueva_combinacion_unica(fecha_juego_dt, historico_combinaciones_set, 
                                                  cuartiles_historicos, ultimas_fechas_superbalotas, 
                                                  promedios_dias_repeticion,
                                                  puntajes_proximidad_principales, 
                                                  puntajes_proximidad_superbalota)

    if nuevo_juego:
        print("\n¡Aquí tienes tu nuevo juego de Baloto ÚNICO y OPTIMIZADO!")
        print(f"Fecha del Juego: {fecha_juego_str}")
        print(f"Números principales: {nuevo_juego['num1']}, {nuevo_juego['num2']}, {nuevo_juego['num3']}, {nuevo_juego['num4']}, {nuevo_juego['num5']}")
        print(f"Superbalota: {nuevo_juego['num6']}")
        print("\n¡Mucha suerte!")
        
        # 6. Guardar el juego generado en el historial (añadiendo al principio)
        guardar_juego_generado_en_historial(fecha_juego_str, nuevo_juego)
    else:
        print("Lo siento, no se pudo generar una combinación única y optimizada que cumpla con todos los criterios.")