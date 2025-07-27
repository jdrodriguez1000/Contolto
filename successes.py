import csv
import os
from datetime import datetime

# --- CONFIGURACIÓN DE ARCHIVOS ---
HISTORICO_CSV_FILE = "baloto_historico_completo.csv"
MIS_JUEGOS_GENERADOS_FILE = "mis_juegos_generados.csv" # Archivo donde se guarda el historial de juegos generados

CSV_HEADERS_FULL = ["tipo", "fecha", "num1", "num2", "num3", "num4", "num5", "num6"]
MIS_JUEGOS_GENERADOS_HEADERS = ["fecha_juego", "num1", "num2", "num3", "num4", "num5", "num6"]

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


def cargar_historico_completo(file_path):
    """
    Carga el histórico completo de sorteos desde el archivo CSV.
    Retorna una lista de diccionarios, ordenada por fecha descendente.
    """
    historico_completo = []
    if not os.path.exists(file_path):
        print(f"Error: Archivo histórico '{file_path}' no encontrado. Por favor, ejecuta 'results.py' primero.")
        return []

    try:
        with open(file_path, mode='r', newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                try:
                    if not all(col in row and row[col] for col in CSV_HEADERS_FULL):
                        continue 

                    numeros_principales = sorted([
                        int(row['num1']), int(row['num2']), int(row['num3']), 
                        int(row['num4']), int(row['num5'])
                    ])
                    superbalota = int(row['num6'])
                    
                    historico_completo.append({
                        "tipo": row['tipo'],
                        "fecha": row['fecha'], # Fecha en formato de Baloto (ej. "24 de Julio de 2025")
                        "num1": numeros_principales[0],
                        "num2": numeros_principales[1],
                        "num3": numeros_principales[2],
                        "num4": numeros_principales[3],
                        "num5": numeros_principales[4],
                        "num6": superbalota
                    })
                except (ValueError, KeyError) as e:
                    print(f"Advertencia: Fila inválida o incompleta en CSV (error: {e}): {row}. Saltando.")
        
        historico_completo.sort(key=lambda x: parse_baloto_date(x['fecha']), reverse=True)
        print(f"Histórico cargado desde '{file_path}'. Total de sorteos: {len(historico_completo)}")
    except Exception as e:
        print(f"Error al cargar el histórico desde '{file_path}': {e}. Se devolverá una lista vacía.")
        historico_completo = []
    
    return historico_completo

def cargar_ultimo_juego_generado_del_historial(file_path):
    """
    Carga el juego más reciente (primera fila) del historial 'mis_juegos_generados.csv'.
    Retorna un diccionario con la fecha y los números, o None si no se encuentra.
    """
    if not os.path.exists(file_path):
        print(f"Error: Archivo '{file_path}' no encontrado. Genera un juego primero con 'new_game.py'.")
        return None

    try:
        with open(file_path, mode='r', newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            # Intentamos leer solo la primera fila (que es la más reciente por cómo la guarda new_game.py)
            for row in reader:
                try:
                    if not all(col in row and row[col] for col in MIS_JUEGOS_GENERADOS_HEADERS):
                        print(f"Advertencia: La primera fila en '{file_path}' está incompleta: {row}.")
                        return None # No podemos confiar en esta fila, mejor salir
                    
                    # Convertir números a int
                    # Importante: los números del juego generado no están necesariamente ordenados en el CSV
                    # Los ordenaremos al cargarlos para la comparación
                    nums_principales_raw = [int(row[f"num{i+1}"]) for i in range(5)]
                    superbalota_raw = int(row["num6"])

                    return {
                        "fecha_juego": row['fecha_juego'],
                        "num1": nums_principales_raw[0], 
                        "num2": nums_principales_raw[1], 
                        "num3": nums_principales_raw[2],
                        "num4": nums_principales_raw[3], 
                        "num5": nums_principales_raw[4], 
                        "num6": superbalota_raw
                    }
                except (ValueError, KeyError) as e:
                    print(f"Error al parsear la primera fila en '{file_path}': {e}. Fila: {row}")
                    return None
            print(f"Advertencia: El archivo '{file_path}' está vacío o no tiene datos válidos.")
            return None
    except Exception as e:
        print(f"Error al leer '{file_path}': {e}")
        return None

def comparar_numeros(juego_usuario, sorteo_oficial):
    """
    Compara el juego del usuario con un sorteo oficial y retorna los aciertos.
    Retorna una tupla: (num_aciertos_principales, acierto_superbalota, numeros_acertados_principales)
    """
    aciertos_principales = 0
    numeros_acertados_principales = []
    acierto_superbalota = False

    # Convertir números del usuario y sorteo oficial a sets para facilitar la comparación de principales
    # Asegúrate de usar los números directamente del diccionario, no el string combinado
    user_principales = set(sorted([juego_usuario['num1'], juego_usuario['num2'], juego_usuario['num3'], juego_usuario['num4'], juego_usuario['num5']]))
    oficial_principales = set(sorted([sorteo_oficial['num1'], sorteo_oficial['num2'], sorteo_oficial['num3'], sorteo_oficial['num4'], sorteo_oficial['num5']]))

    # Comparar números principales
    for num in user_principales:
        if num in oficial_principales:
            aciertos_principales += 1
            numeros_acertados_principales.append(num)
    
    # Comparar Superbalota
    if juego_usuario['num6'] == sorteo_oficial['num6']:
        acierto_superbalota = True

    return aciertos_principales, acierto_superbalota, sorted(numeros_acertados_principales)


# --- FUNCIÓN PRINCIPAL DE VERIFICACIÓN ---

def verificar_sorteo():
    """
    Compara el número generado más reciente del historial con los sorteos de su fecha específica.
    """
    print("\n--- Verificación de Sorteo de Baloto ---")

    # 1. Cargar el último juego generado por el usuario desde el historial
    juego_del_usuario = cargar_ultimo_juego_generado_del_historial(MIS_JUEGOS_GENERADOS_FILE)
    if not juego_del_usuario:
        print("No se pudo cargar el juego más reciente generado. No se puede verificar el sorteo.")
        return
    
    fecha_juego_str = juego_del_usuario['fecha_juego']
    try:
        fecha_juego_dt = parse_input_date(fecha_juego_str)
    except ValueError as e:
        print(f"Error: La fecha del juego generado '{fecha_juego_str}' tiene un formato inválido: {e}")
        return

    # Preparar el string de la combinación del usuario para mostrar
    user_numeros_principales_display = sorted([juego_del_usuario['num1'], juego_del_usuario['num2'], juego_del_usuario['num3'], juego_del_usuario['num4'], juego_del_usuario['num5']])
    user_superbalota_display = juego_del_usuario['num6']
    user_combinacion_display_str = "-".join(map(str, user_numeros_principales_display)) + f"-{user_superbalota_display}"

    print(f"\nTu último juego generado para la fecha {fecha_juego_str}: {user_combinacion_display_str}")

    # 2. Cargar el histórico completo de sorteos oficiales
    historico_oficial = cargar_historico_completo(HISTORICO_CSV_FILE)
    if not historico_oficial:
        print("No se pudo cargar el histórico oficial de Baloto. No se puede verificar el sorteo.")
        return

    # 3. Buscar sorteos oficiales para la fecha del juego del usuario
    sorteos_oficiales_para_fecha = []
    
    for sorteo_oficial in historico_oficial:
        try:
            sorteo_fecha_dt = parse_baloto_date(sorteo_oficial['fecha'])
            if sorteo_fecha_dt == fecha_juego_dt:
                sorteos_oficiales_para_fecha.append(sorteo_oficial)
            elif sorteo_fecha_dt < fecha_juego_dt:
                break # Ya pasamos la fecha, no hay más sorteos relevantes
        except ValueError as e:
            print(f"Advertencia: Error al parsear fecha en histórico oficial '{sorteo_oficial.get('fecha', 'N/A')}': {e}. Saltando sorteo.")
            continue

    if not sorteos_oficiales_para_fecha:
        print(f"\nNo se encontraron resultados oficiales de Baloto/Revancha para la fecha {fecha_juego_str} en el histórico.")
        print("Asegúrate de que la fecha de tu juego sea la de un sorteo oficial y que tu histórico esté actualizado (ejecuta 'results.py').")
        return

    print(f"\nResultados oficiales para la fecha {fecha_juego_str}:")
    hay_coincidencia_exacta = False
    
    for sorteo_oficial in sorteos_oficiales_para_fecha:
        sorteo_oficial_numeros_principales_display = sorted([sorteo_oficial['num1'], sorteo_oficial['num2'], sorteo_oficial['num3'], sorteo_oficial['num4'], sorteo_oficial['num5']])
        sorteo_oficial_superbalota_display = sorteo_oficial['num6']
        sorteo_oficial_combinacion_display_str = "-".join(map(str, sorteo_oficial_numeros_principales_display)) + f"-{sorteo_oficial_superbalota_display}"
        
        print(f"  {sorteo_oficial['tipo']}: {sorteo_oficial_combinacion_display_str}")

        # 4. Comparar el número del usuario con cada sorteo oficial encontrado para esa fecha
        aciertos_principales, acierto_superbalota, numeros_acertados_principales = comparar_numeros(juego_del_usuario, sorteo_oficial)
        
        # Total de aciertos para la combinación específica
        total_aciertos = aciertos_principales + (1 if acierto_superbalota else 0)

        print(f"  **Aciertos con {sorteo_oficial['tipo']}**: {aciertos_principales} números principales", end="")
        if acierto_superbalota:
            print(" y la Superbalota.")
        else:
            print(" (sin Superbalota).")
        
        if aciertos_principales > 0:
            print(f"  Números principales acertados: {', '.join(map(str, numeros_acertados_principales))}")
        
        if acierto_superbalota:
            print(f"  ¡Superbalota acertada: {juego_del_usuario['num6']}!")
        
        if total_aciertos == 6: # 5 principales + Superbalota
            print(f"\n🎉 ¡FELICITACIONES! ¡Tu número ha COINCIDIDO EXACTAMENTE con el {sorteo_oficial['tipo']} de la fecha {fecha_juego_str}!")
            print("¡Has ganado el premio mayor!")
            hay_coincidencia_exacta = True
        elif total_aciertos > 0:
            print(f"  En total: {total_aciertos} acierto(s) con {sorteo_oficial['tipo']}.")
        else:
            print(f"  No hubo aciertos con el {sorteo_oficial['tipo']}.")
        
        print("-" * 40) # Separador para claridad entre sorteos si hay Baloto y Revancha

    if not hay_coincidencia_exacta:
        print("\nTu número no obtuvo el premio mayor con ningún sorteo (Baloto o Revancha) de la fecha indicada.")

# --- USO PRINCIPAL DEL PROGRAMA ---
if __name__ == "__main__":
    verificar_sorteo()