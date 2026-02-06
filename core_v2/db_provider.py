
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

class DBProvider:
    def __init__(self):
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")
        if not url or not key:
            raise ValueError("Faltan las variables de entorno SUPABASE_URL o SUPABASE_ANON_KEY")
        self.supabase: Client = create_client(url, key)

    def get_best_strategy(self, limit=10):
        """
        Analiza la tabla rendimiento para encontrar la estrategia con mejor promedio de aciertos
        en los últimos 'limit' juegos.
        """
        # Usamos una consulta SQL via rpc o direct select si es posible, 
        # pero para este proveedor usaremos lógica de agregación simple.
        try:
            # Consultamos los últimos juegos con su rendimiento
            response = self.supabase.table("rendimiento")\
                .select("aciertos_principales, juegos(estrategia)")\
                .order("created_at", desc=True)\
                .limit(100)\
                .execute()
            
            data = response.data
            if not data:
                return "caliente"  # Default si no hay datos

            stats = {}
            for item in data:
                est = item['juegos']['estrategia']
                aciertos = item['aciertos_principales']
                if est not in stats:
                    stats[est] = []
                stats[est].append(aciertos)
            
            # Calcular promedios
            averages = {k: sum(v)/len(v) for k, v in stats.items()}
            best = max(averages, key=averages.get)
            return best
        except Exception as e:
            print(f"Error al obtener mejor estrategia: {e}")
            return "caliente"

    def get_hot_numbers(self, days=90):
        """Obtiene los números más frecuentes en los últimos X días"""
        # Nota: En una implementación ideal, esto sería un RPC en Postgres para eficiencia
        # Por ahora simulamos la consulta de frecuencia
        response = self.supabase.table("historial")\
            .select("num1, num2, num3, num4, num5")\
            .eq("tipo", "Baloto")\
            .order("fecha", desc=True)\
            .limit(30)\
            .execute()
        
        all_nums = []
        for r in response.data:
            all_nums.extend([r['num1'], r['num2'], r['num3'], r['num4'], r['num5']])
        
        from collections import Counter
        counts = Counter(all_nums)
        return [num for num, count in counts.most_common(10)]

    def get_cold_numbers(self):
        """Obtiene los números con mayor tiempo sin salir (Gaps)"""
        # Lógica para encontrar los números que NO están en los últimos sorteos
        # (Simulada para esta versión centralizada)
        response = self.supabase.table("historial")\
            .select("num1, num2, num3, num4, num5")\
            .eq("tipo", "Baloto")\
            .order("fecha", desc=True)\
            .limit(20)\
            .execute()
        
        recent_nums = set()
        for r in response.data:
            recent_nums.update([r['num1'], r['num2'], r['num3'], r['num4'], r['num5']])
            
        all_possible = set(range(1, 44))
        cold_nums = list(all_possible - recent_nums)
        return cold_nums

    def get_superballot_stats(self):
        """Analiza tendencias, racha y gaps de la superballot (1-16)"""
        response = self.supabase.table("historial")\
            .select("num6, fecha")\
            .eq("tipo", "Baloto")\
            .order("fecha", desc=True)\
            .limit(50)\
            .execute()
        
        data = response.data
        if not data: return {}

        # 1. Racha (último sorteo)
        last_sb = data[0]['num6']
        
        # 2. Frecuencia en ventana corta
        from collections import Counter
        recent_sb = [r['num6'] for r in data[:10]]
        racha_sb = Counter(recent_sb).most_common(3)
        
        # 3. Gaps (cuánto llevan sin salir)
        gaps = {i: 999 for i in range(1, 17)}
        for i, r in enumerate(data):
            val = r['num6']
            if gaps[val] == 999:
                gaps[val] = i
        
        return {
            "last": last_sb,
            "trending": [num for num, count in racha_sb],
            "gaps": gaps
        }

if __name__ == "__main__":
    db = DBProvider()
    print(f"Mejor Estrategia Actual: {db.get_best_strategy()}")
    print(f"Números Calientes: {db.get_hot_numbers()}")
