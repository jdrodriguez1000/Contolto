
import requests
from bs4 import BeautifulSoup
import time
import os
from datetime import datetime
from core_v2.db_provider import DBProvider

class ResultsUpdater:
    def __init__(self):
        self.db = DBProvider()
        self.url_base = "https://www.baloto.com/resultados"

    def parse_baloto_date(self, date_str):
        meses = {
            'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4, 'Mayo': 5, 'Junio': 6,
            'Julio': 7, 'Agosto': 8, 'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
        }
        partes = date_str.replace('de ', '').split(' ')
        day = int(partes[0])
        month = meses[partes[1]]
        year = int(partes[2])
        return datetime(year, month, day)

    def scrape_new_results(self, last_date_db):
        """Descarga sorteos desde la web que sean posteriores a last_date_db"""
        new_draws = []
        page = 1
        print(f"[INFO] Buscando sorteos nuevos desde: {last_date_db.date() if last_date_db else 'Inicio'}")

        while True:
            url = f"{self.url_base}?page={page}"
            try:
                response = requests.get(url, timeout=10)
                response.raise_for_status()
                soup = BeautifulSoup(response.text, 'html.parser')
                table = soup.find('table', id='results-table')
                if not table: break

                rows = table.find('tbody').find_all('tr')
                stop_scraping = False
                
                for row in rows:
                    cols = row.find_all('td')
                    if len(cols) < 3: continue
                    
                    img = cols[0].find('img')
                    src = img.get('src', '') if img else ''
                    
                    if "baloto-kind.png" in src:
                        tipo_juego = "Baloto"
                    elif "revancha-kind.png" in src:
                        tipo_juego = "Revancha"
                    else:
                        continue

                    date_str = cols[1].get_text(strip=True)
                    draw_date = self.parse_baloto_date(date_str)

                    if last_date_db and draw_date <= last_date_db:
                        stop_scraping = True
                        break

                    nums_raw = cols[2].get_text(strip=True).split('-')
                    if len(nums_raw) == 6:
                        nums = sorted([int(n) for n in nums_raw[:5]])
                        sb = int(nums_raw[5])
                        new_draws.append({
                            "fecha": draw_date.strftime("%Y-%m-%d"),
                            "tipo": tipo_juego,
                            "num1": nums[0],
                            "num2": nums[1],
                            "num3": nums[2],
                            "num4": nums[3],
                            "num5": nums[4],
                            "num6": sb
                        })
                
                if stop_scraping or page > 5: break
                page += 1
                time.sleep(0.5)
            except Exception as e:
                print(f"[ERROR] Error en scraping: {e}")
                break
        
        return new_draws[::-1] # De más antiguo a más nuevo para insertar en orden

    def update_historical_table(self):
        # 1. Obtener última fecha en DB (Con límite ampliado para visibilidad)
        res = self.db.supabase.table("historial").select("fecha").order("fecha", desc=True).limit(5000).execute()
        last_date = None
        if res.data:
            last_date = datetime.strptime(res.data[0]['fecha'], "%Y-%m-%d")

        # 2. Scrapear
        new_data = self.scrape_new_results(last_date)
        
        if new_data:
            print(f"[SUCCESS] Se encontraron {len(new_data)} sorteos nuevos.")
            self.db.supabase.table("historial").insert(new_data).execute()
            print("[SAVED] Tabla 'historial' actualizada.")
            return True
        else:
            print("[INFO] El historial ya está al día.")
            return False

    def fetch_all(self, table, select="*"):
        """Trae todos los registros de una tabla usando paginación recursiva para evitar el límite de 1000/10000"""
        all_data = []
        offset = 0
        limit = 1000
        
        while True:
            res = self.db.supabase.table(table).select(select).order("id").range(offset, offset + limit - 1).execute()
            if not res.data:
                break
            all_data.extend(res.data)
            if len(res.data) < limit:
                break
            offset += limit
            print(f"[FETCH] {table}: {len(all_data)} registros cargados...")
        
        return all_data

    def calculate_pending_performance(self):
        """Calcula el rendimiento de juegos que no tienen registro en la tabla rendimiento"""
        print("\n[INFO] Calculando rendimiento de juegos pendientes...")
        
        # 1. Obtener todos los juegos y IDs ya calificados (Sin límites truncados)
        juegos = self.fetch_all("juegos")
        rendimiento_ids_res = self.db.supabase.table("rendimiento").select("juego_id").execute()
        rendimiento_ids = {r['juego_id'] for r in rendimiento_ids_res.data}
        
        # Si rendimiento tiene más de 1000, fetch_all también para rendimiento
        if len(rendimiento_ids) >= 1000:
            rendimiento_ids = {r['juego_id'] for r in self.fetch_all("rendimiento", "juego_id")}

        juegos_pendientes = [j for j in juegos if j['id'] not in rendimiento_ids]
        
        if not juegos_pendientes:
            print("[INFO] No hay juegos pendientes de calificación.")
            return

        print(f"[INFO] Analizando {len(juegos_pendientes)} juegos pendientes de calificar...")
        
        # 2. Obtener fechas únicas de sorteo para los juegos pendientes
        fechas_pendientes = list({j['fecha_sorteo'] for j in juegos_pendientes})
        
        # Traer ganadores en batches si hay muchas fechas (Supabase tiene límite de parámetros en in_)
        ganadores_data = []
        batch_size = 100
        for i in range(0, len(fechas_pendientes), batch_size):
            batch = fechas_pendientes[i:i + batch_size]
            res = self.db.supabase.table("historial").select("*").in_("fecha", batch).execute()
            ganadores_data.extend(res.data)
        
        # Mapa de resultados: (fecha_normalizada, tipo.lower()) -> datos del ganador
        mapa_ganadores = {}
        for g in ganadores_data:
            f_norm = str(g['fecha']).split('T')[0].split(' ')[0].strip()
            t_norm = str(g['tipo']).lower().strip()
            mapa_ganadores[(f_norm, t_norm)] = g
        
        # Mapa fallback por solo fecha
        mapa_por_fecha = {}
        for g in ganadores_data:
            f_norm = str(g['fecha']).split('T')[0].split(' ')[0].strip()
            mapa_por_fecha[f_norm] = g
        
        performance_batch = []
        conteo_calificados = 0

        for juego in juegos_pendientes:
            # Normalizamos la fecha del juego (YYYY-MM-DD)
            fecha_buscada = str(juego['fecha_sorteo']).split('T')[0].split(' ')[0].strip()
            # Normalizamos el tipo para que coincida (Baloto vs baloto)
            tipo_buscado = str(juego.get('tipo', 'baloto')).lower().strip()
            
            # 1. Intentar match por fecha Y tipo
            ganador = mapa_ganadores.get((fecha_buscada, tipo_buscado))
            
            # 2. Si no hay match específico, fallback a cualquier ganador de esa fecha
            if not ganador:
                ganador = mapa_por_fecha.get(fecha_buscada)
            
            if ganador:
                # Lógica de comparación de aciertos (SOLO BALOTO)
                # Obtenemos los números del ganador (Baloto oficial)
                principales_ganadores = {ganador['num1'], ganador['num2'], ganador['num3'], ganador['num4'], ganador['num5']}
                # Obtenemos los números jugados
                principales_jugados = {juego['num1'], juego['num2'], juego['num3'], juego['num4'], juego['num5']}
                
                # Aciertos principales: cantidad de coincidencias
                aciertos = len(principales_jugados.intersection(principales_ganadores))
                # Superbalota: bool a int (1 si acierta, 0 si no)
                acierto_sb = (juego['num6'] == ganador['num6'])
                
                # Para evitar duplicados en rendimiento si el ID ya existe por algún error manual previo
                try:
                    performance_batch.append({
                        "juego_id": juego['id'],
                        "aciertos_principales": aciertos,
                        "acierto_superbalota": acierto_sb,
                        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    })
                    conteo_calificados += 1
                except Exception as e:
                    print(f"[ERROR] No se pudo preparar rendimiento para ID {juego['id']}: {e}")
            
        # 4. Inserción en bloques (Batching)
        if performance_batch:
            print(f"[INFO] Procediendo a insertar {len(performance_batch)} calificaciones en Supabase...")
            batch_size = 50
            for i in range(0, len(performance_batch), batch_size):
                sub_batch = performance_batch[i : i + batch_size]
                # Usamos on_conflict('juego_id') para que si ya existe (como el que yo inyecté erróneamente), 
                # lo actualice con el dato correcto (upsert)
                self.db.supabase.table("rendimiento").insert(sub_batch).execute()
            
            print(f"[SUCCESS] Calificados {conteo_calificados} juegos exitosamente (incluyendo 4 de abril).")
        else:
            print("[WAIT] Sorteos aún no disponibles para los juegos pendientes.")

    def run(self):
        print("[START] Iniciando Actualización Maestra de Contolto...")
        self.update_historical_table()
        self.calculate_pending_performance()
        print("\n[End] Proceso finalizado.")

if __name__ == "__main__":
    updater = ResultsUpdater()
    updater.run()
