import requests
from bs4 import BeautifulSoup
import json
import time
import random
import csv
import os
from datetime import datetime 

# --- CONFIGURACIÓN DE NÚMEROS DE LOTERÍA ---
NUM_MIN_PRINCIPALES = 1
NUM_MAX_PRINCIPALES = 43
CANTIDAD_PRINCIPALES = 5

NUM_MIN_SUPERBALOTA = 1
NUM_MAX_SUPERBALOTA = 16
CANTIDAD_SUPERBALOTA = 1

# --- CONFIGURACIÓN DEL ARCHIVO HISTÓRICO ---
HISTORICO_CSV_FILE = "baloto_historico_completo.csv" 
CSV_HEADERS_FULL = ["tipo", "fecha", "num1", "num2", "num3", "num4", "num5", "num6"]

# --- FUNCIONES AUXILIARES ---

ULTIMA_PAGINA_CON_DATOS = 91 # Sigue siendo un límite máximo de seguridad, pero la lógica de fecha lo detendrá antes.

def parse_baloto_date(date_str):
    """
    Parsea una cadena de fecha de Baloto (ej. "24 de Julio de 2025") a un objeto datetime.
    """
    meses = {
        'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4, 'Mayo': 5, 'Junio': 6,
        'Julio': 7, 'Agosto': 8, 'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
    }
    
    # Asegurarse de que el string tenga el formato esperado
    if " de " not in date_str:
        raise ValueError(f"Formato de fecha inesperado: '{date_str}'. Esperado 'DD de Mes de AAAA'.")

    partes = date_str.replace('de ', '').split(' ')
    if len(partes) != 3:
        raise ValueError(f"Formato de fecha inesperado después de split: '{date_str}'. Partes: {partes}")
    
    day = int(partes[0])
    month = meses[partes[1]]
    year = int(partes[2])
    
    return datetime(year, month, day)

# --- FUNCIONES DE EXTRACCIÓN DE DATOS ---

# Modificamos la función para que reciba la última fecha conocida localmente
def obtener_nuevos_resultados_baloto_incremental(base_url, ultima_fecha_local=None, max_pages=None):
    """
    Raspa los resultados de Baloto desde la página 1 y se detiene cuando encuentra
    una fecha igual o anterior a ultima_fecha_local.
    Retorna una TUPLA: (lista_de_diccionarios_nuevos_sorteos, set_de_combinaciones_solo_numeros_nuevos)
    """
    nuevos_sorteos_list = []
    nuevos_sorteos_set = set() 

    page_num = 1
    initial_base_url_path = base_url.split('?')[0] 

    print(f"Iniciando raspado incremental. Última fecha local conocida: {ultima_fecha_local.strftime('%Y-%m-%d') if ultima_fecha_local else 'Ninguna'}")

    while True: 
        current_max_limit = max_pages if max_pages is not None else ULTIMA_PAGINA_CON_DATOS

        if page_num > current_max_limit:
            print(f"Límite de {current_max_limit} páginas de seguridad alcanzado. Deteniendo el raspado.")
            break

        url_paginada = f"{base_url}?page={page_num}"
        print(f"Descargando página: {url_paginada}")

        try:
            response = requests.get(url_paginada, allow_redirects=True) 
            response.raise_for_status() 

            if response.url == initial_base_url_path or response.url == f"{initial_base_url_path}?page=1":
                if page_num > 1: 
                    print(f"Detectada redirección a la página principal ({response.url}) para la página {page_num}. Fin de la paginación real.")
                    break
            
            soup = BeautifulSoup(response.text, 'html.parser')
            results_table = soup.find('table', id='results-table')

            if not results_table:
                print(f"No se encontró la tabla de resultados en la página {page_num}. Posible fin de la paginación con datos o error.")
                break 

            filas_resultados = results_table.find('tbody').find_all('tr')
            if not filas_resultados:
                print(f"Se encontró la tabla, pero no hay filas de resultados en la página {page_num}. Posible fin de la paginación con datos.")
                break 
            
            found_new_data_on_page = False # Bandera para saber si encontramos algo relevante en la página
            
            for fila in filas_resultados:
                celdas = fila.find_all('td')

                if len(celdas) >= 3:
                    tipo = "Desconocido"
                    tipo_sorteo_img_tag = celdas[0].find('img')
                    if tipo_sorteo_img_tag and 'src' in tipo_sorteo_img_tag.attrs:
                        img_src = tipo_sorteo_img_tag['src']
                        if "baloto-kind.png" in img_src:
                            tipo = "Baloto"
                        elif "revancha-kind" in img_src: 
                            tipo = "Revancha"
                    
                    fecha_str = celdas[1].get_text(strip=True)
                    
                    try:
                        fecha_sorteo = parse_baloto_date(fecha_str)
                    except ValueError as ve:
                        print(f"Advertencia: No se pudo parsear la fecha '{fecha_str}' en página {page_num}: {ve}")
                        continue # Saltar esta entrada si la fecha es inválida

                    # Lógica CLAVE de detención incremental
                    if ultima_fecha_local and fecha_sorteo <= ultima_fecha_local:
                        print(f"Encontrada fecha '{fecha_str}' igual o anterior a la última fecha local ({ultima_fecha_local.strftime('%Y-%m-%d')}). Deteniendo raspado incremental.")
                        # Añadir los sorteos de la página actual que son más recientes antes de romper
                        # Esto es importante porque una página puede contener sorteos nuevos y viejos
                        if nuevos_sorteos_list: # Si ya hemos recolectado sorteos
                            # Solo añadir si no se ha detenido ya en esta misma fila por ser igual
                            if fecha_sorteo < ultima_fecha_local: # Si es estrictamente anterior, podemos romper
                                break # Rompemos el bucle de filas y luego el de páginas
                            elif fecha_sorteo == ultima_fecha_local: # Si es igual, podríamos tener otros sorteos del mismo día (Baloto/Revancha)
                                # Continuamos procesando la fila actual para ver si es una combinación única que nos falta
                                pass # La lógica de abajo se encargará de añadirlo si es nuevo
                        else: # Si no hemos recolectado nada aún en esta página
                             # Y la primera fecha que vemos ya es vieja, rompemos
                             break
                    
                    found_new_data_on_page = True # Hemos procesado al menos un sorteo en esta página

                    numeros_str_raw = celdas[2].get_text(strip=True)
                    partes_numeros = [n.strip() for n in numeros_str_raw.split('-')]

                    if len(partes_numeros) == 6:
                        try:
                            numeros_principales = sorted([int(n) for n in partes_numeros[:CANTIDAD_PRINCIPALES]])
                            superbalota = int(partes_numeros[CANTIDAD_PRINCIPALES])

                            combinacion_str = "-".join(map(str, numeros_principales)) + f"-{superbalota}"
                            
                            if combinacion_str not in nuevos_sorteos_set: # Evitar duplicados dentro de la lista de nuevos
                                nuevos_sorteos_list.append({
                                    "tipo": tipo,
                                    "fecha": fecha_str, # Guardamos la fecha como string original
                                    "num1": numeros_principales[0],
                                    "num2": numeros_principales[1],
                                    "num3": numeros_principales[2],
                                    "num4": numeros_principales[3],
                                    "num5": numeros_principales[4],
                                    "num6": superbalota
                                })
                                nuevos_sorteos_set.add(combinacion_str)

                        except ValueError:
                            print(f"Advertencia: No se pudieron convertir números a enteros en '{numeros_str_raw}' (Página {page_num}, Sorteo: {tipo}, Fecha: {fecha_str})")
                    else:
                        print(f"Advertencia: Formato de números inesperado para {tipo} en la fecha {fecha_str} (Página {page_num}): '{numeros_str_raw}'")
            
            # Si llegamos aquí y la bandera de detención por fecha se activó en el bucle interior, rompemos el bucle exterior.
            if ultima_fecha_local and any(parse_baloto_date(s['fecha']) <= ultima_fecha_local for s in nuevos_sorteos_list if 'fecha' in s):
                 # Hemos encontrado una fecha vieja, filtramos los ya recogidos para que solo queden los estrictamente nuevos
                 original_len = len(nuevos_sorteos_list)
                 nuevos_sorteos_list = [s for s in nuevos_sorteos_list if parse_baloto_date(s['fecha']) > ultima_fecha_local]
                 print(f"Se filtraron {original_len - len(nuevos_sorteos_list)} sorteos antiguos de la lista de nuevos.")
                 break # Salir del bucle while, ya no hay más datos realmente nuevos.
            
            # Si no encontramos ningún dato nuevo en la página actual Y no hemos encontrado una señal de detención,
            # podría ser el final de la paginación.
            if not found_new_data_on_page and page_num > 1: # Si estamos en una página subsiguiente y no encontramos datos
                print(f"No se encontraron sorteos válidos en la página {page_num}. Posible fin de datos.")
                break

            page_num += 1
            time.sleep(0.5) 

        except requests.exceptions.RequestException as e:
            print(f"Error al acceder a la página {url_paginada}: {e}")
            break 
        except Exception as e:
            print(f"Ocurrió un error inesperado al procesar la página {url_paginada}: {e}")
            break
    
    print(f"Raspado incremental completado. Total de sorteos NUEVOS encontrados: {len(nuevos_sorteos_list)}")
    # Aseguramos que los nuevos sorteos estén ordenados de más reciente a más antiguo
    nuevos_sorteos_list.sort(key=lambda x: parse_baloto_date(x['fecha']), reverse=True)
    return nuevos_sorteos_list, nuevos_sorteos_set

# --- FUNCIONES DE MANEJO DE CSV (sin cambios significativos, solo aclaraciones) ---

def cargar_historico_desde_csv(file_path):
    """
    Carga las combinaciones históricas completas (con tipo y fecha) desde un archivo CSV.
    Retorna una TUPLA: (lista_de_diccionarios_completos, set_de_combinaciones_solo_numeros)
    """
    historico_completo_cargado = []
    juegos_historicos_string_set_cargado = set()

    if not os.path.exists(file_path):
        print(f"Archivo histórico '{file_path}' no encontrado. Se creará uno nuevo.")
        return historico_completo_cargado, juegos_historicos_string_set_cargado

    try:
        with open(file_path, mode='r', newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile) 
            
            # Verificar si los encabezados del CSV coinciden con los esperados
            if not all(h in reader.fieldnames for h in CSV_HEADERS_FULL):
                print(f"Advertencia: Encabezados del CSV '{file_path}' no coinciden completamente con lo esperado.")
                print(f"Esperado: {CSV_HEADERS_FULL}, Encontrado: {reader.fieldnames}")
            
            for row in reader:
                try:
                    if not all(col in row and row[col] is not None for col in CSV_HEADERS_FULL):
                        print(f"Advertencia: Fila incompleta o con columnas faltantes en CSV: {row}. Saltando.")
                        continue 

                    numeros_principales = sorted([
                        int(row['num1']), int(row['num2']), int(row['num3']), 
                        int(row['num4']), int(row['num5'])
                    ])
                    superbalota = int(row['num6'])
                    
                    combinacion_str = "-".join(map(str, numeros_principales)) + f"-{superbalota}"
                    
                    if combinacion_str not in juegos_historicos_string_set_cargado:
                        historico_completo_cargado.append({
                            "tipo": row.get('tipo', 'Desconocido'), 
                            "fecha": row.get('fecha', 'Desconocida'),
                            "num1": numeros_principales[0],
                            "num2": numeros_principales[1],
                            "num3": numeros_principales[2],
                            "num4": numeros_principales[3],
                            "num5": numeros_principales[4],
                            "num6": superbalota
                        })
                        juegos_historicos_string_set_cargado.add(combinacion_str)

                except (ValueError, KeyError) as e:
                    print(f"Advertencia: Fila inválida o incompleta en CSV (error: {e}): {row}. Saltando.")
        
        print(f"Histórico cargado desde '{file_path}'. Total de sorteos: {len(historico_completo_cargado)}")
    except Exception as e:
        print(f"Error al cargar el histórico desde '{file_path}': {e}. Se tratará como vacío.")
        historico_completo_cargado = []
        juegos_historicos_string_set_cargado = set() 
    
    return historico_completo_cargado, juegos_historicos_string_set_cargado

def guardar_historico_en_csv(file_path, historico_completo_list):
    """
    Guarda la lista de diccionarios de sorteos completos en un archivo CSV.
    """
    try:
        with open(file_path, mode='w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=CSV_HEADERS_FULL)
            writer.writeheader() 
            writer.writerows(historico_completo_list) 
        print(f"Histórico completo guardado en '{file_path}'.")
    except Exception as e:
        print(f"Error al guardar el histórico completo en '{file_path}': {e}")

# --- USO PRINCIPAL DEL PROGRAMA ---
if __name__ == "__main__":
    url_base_baloto = "https://www.baloto.com/resultados"
    
    print("Iniciando proceso de actualización incremental del histórico de Baloto...")

    # 1. Cargar el histórico existente del CSV
    print("Cargando histórico local desde CSV...")
    local_historico_list, local_historico_set = cargar_historico_desde_csv(HISTORICO_CSV_FILE)
    
    ultima_fecha_local = None
    if local_historico_list:
        # La lista ya debería estar ordenada de más reciente a más antigua
        try:
            ultima_fecha_local = parse_baloto_date(local_historico_list[0]['fecha'])
            print(f"Última fecha encontrada en histórico local: {ultima_fecha_local.strftime('%Y-%m-%d')}")
        except ValueError as e:
            print(f"Error al parsear la última fecha del CSV: {e}. Se realizará raspado completo.")
            ultima_fecha_local = None # Forzar raspado completo si la fecha está mal

    # 2. Raspar nuevos resultados de la web (incremental)
    # Si no hay histórico local o la última fecha es inválida, raspamos de forma "completa" (hasta max_pages).
    # De lo contrario, usamos la última fecha local para la detención incremental.
    nuevos_sorteos_web_list, nuevos_sorteos_web_set = \
        obtener_nuevos_resultados_baloto_incremental(url_base_baloto, ultima_fecha_local, ULTIMA_PAGINA_CON_DATOS)

    # 3. Fusionar: Añadir los nuevos sorteos al principio del histórico local
    if nuevos_sorteos_web_list:
        # Crear un set de las combinaciones de números de los sorteos ya presentes en el histórico local
        # para evitar duplicados al añadir los nuevos.
        current_local_combinations_set = set()
        for sorteo in local_historico_list:
            numeros_principales = sorted([sorteo['num1'], sorteo['num2'], sorteo['num3'], sorteo['num4'], sorteo['num5']])
            superbalota = sorteo['num6']
            combinacion_str = "-".join(map(str, numeros_principales)) + f"-{superbalota}"
            current_local_combinations_set.add(combinacion_str)

        sorteos_para_agregar_al_inicio = []
        for nuevo_sorteo in nuevos_sorteos_web_list:
            numeros_principales = sorted([nuevo_sorteo['num1'], nuevo_sorteo['num2'], nuevo_sorteo['num3'], nuevo_sorteo['num4'], nuevo_sorteo['num5']])
            superbalota = nuevo_sorteo['num6']
            combinacion_str = "-".join(map(str, numeros_principales)) + f"-{superbalota}"
            
            # Solo añadir si la combinación de números no está ya en el histórico local
            if combinacion_str not in current_local_combinations_set:
                sorteos_para_agregar_al_inicio.append(nuevo_sorteo)
        
        # Combinar los nuevos sorteos con el histórico local.
        # Los nuevos sorteos ya deberían estar ordenados de más reciente a más antiguo por la función de raspado.
        final_historico_list = sorteos_para_agregar_al_inicio + local_historico_list
        print(f"Se agregaron {len(sorteos_para_agregar_al_inicio)} nuevos sorteos al histórico.")
    else:
        print("No se encontraron nuevos sorteos en la web para agregar. El histórico local está al día.")
        final_historico_list = local_historico_list # Si no hay nuevos, la lista final es la misma que la local

    # 4. Re-ordenar la lista final por fecha (más reciente primero), por si acaso
    # Esto es crucial para asegurar que el orden sea correcto después de la fusión.
    print("Re-ordenando el histórico final por fecha para asegurar la consistencia...")
    final_historico_list.sort(key=lambda x: parse_baloto_date(x['fecha']), reverse=True)


    # 5. Guardar el histórico fusionado y ordenado en el CSV
    if final_historico_list:
        guardar_historico_en_csv(HISTORICO_CSV_FILE, final_historico_list)
        print("Proceso de actualización y guardado del histórico completado.")
    else:
        print("El histórico final está vacío. No se guardó ningún archivo.")