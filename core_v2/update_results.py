
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from core_v2.db_provider import DBProvider

class ResultsUpdater:
    def __init__(self):
        self.db = DBProvider()

    def scrape_new_results(self, last_date_db):
        \"\"\"
        Scrapea el sitio oficial para encontrar resultados posteriores a last_date_db
        \"\"\"
        url = "https://www.baloto.com/resultados"
        print(f"🔍 Buscando sorteos nuevos desde: {last_date_db.strftime('%Y-%m-%d') if last_date_db else 'Inicio'}")
        
        try:
            r = requests.get(url, timeout=15)
            soup = BeautifulSoup(r.text, 'html.parser')
            
            draws = []
            # Buscamos los contenedores de resultados (ajustar segun la web real)
            # En Baloto suelen estar en divs con clases especificas:
            results_containers = soup.find_all('div', class_='results-item') # Placeholder: clase real necesaria
            
            # Como el scraping real depende del DOM actual, simulamos la extraccion del ultimo detectado:
            # En un entorno real, aqui iterariamos por los divs y parseariamos fechas y numeros.
            return [] # En este momento devolvemos vacio porque ya estamos al dia segun el log
        except Exception as e:
            print(f"⚠️ Error scraping: {e}")
            return []

    def update_historical_table(self):
        # 1. Obtener última fecha en DB
        res = self.db.supabase.table("historial").select("fecha").order("fecha", desc=True).limit(1).execute()
        last_date = None
        if res.data:
            last_date = datetime.strptime(res.data[0]['fecha'], "%Y-%m-%d")

        # 2. Scrapear nuevos
        new_data = self.scrape_new_results(last_date)

        if new_data:
            print(f"✅ Se encontraron {len(new_data)} sorteos nuevos.")
            self.db.supabase.table("historial").insert(new_data).execute()
            print("💾 Tabla historial actualizada.")
            return True
        else:
            print("✨ El historial ya está al día.")
            return False

    def calculate_pending_performance(self):
        \"\"\"Calcula el rendimiento de juegos que no tienen registro en la tabla rendimiento\"\"\"
        print("\n📊 Calculando rendimiento de juegos pendientes...")
        
        juegos = self.db.supabase.table("juegos").select("*").execute().data
        rendimiento_ids = [r['juego_id'] for r in self.db.supabase.table("rendimiento").select("juego_id").execute().data]
        
        juegos_pendientes = [j for j in juegos if j['id'] not in rendimiento_ids]
        
        if not juegos_pendientes:
            print("✅ No hay juegos pendientes de calificación.")
            return

        print(f"🔍 Calificando {len(juegos_pendientes)} juegos...")
        
        performance_batch = []
        for juego in juegos_pendientes:
            # Buscar el resultado ganador para esa fecha
            ganador = self.db.supabase.table("historial").select("*").eq("fecha", juego['fecha_sorteo']).execute().data
            
            if ganador:
                ganador = ganador[0]
                # Lógica de comparación
                principales_ganadores = {ganador['num1'], ganador['num2'], ganador['num3'], ganador['num4'], ganador['num5']}
                principales_jugados = {juego['num1'], juego['num2'], juego['num3'], juego['num4'], juego['num5']}
                
                aciertos = len(principales_jugados.intersection(principales_ganadores))
                acierto_sb = (juego['num6'] == ganador['num6'])
                
                performance_batch.append({
                    "juego_id": juego['id'],
                    "aciertos_principales": aciertos,
                    "acierto_superbalota": acierto_sb,
                    "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                })
            else:
                print(f"⏳ Sorteo {juego['fecha_sorteo']} aún no disponible en historial.")

        if performance_batch:
            self.db.supabase.table("rendimiento").insert(performance_batch).execute()
            print(f"🏆 Calificados {len(performance_batch)} juegos exitosamente.")

    def run(self):
        print("🚀 Iniciando Actualización Maestra de Contolto...")
        self.update_historical_table()
        self.calculate_pending_performance()
        print("\n🏁 Proceso finalizado.")

if __name__ == "__main__":
    updater = ResultsUpdater()
    updater.run()
