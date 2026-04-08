
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

    def get_strategy_ranking(self):
        """
        Devuelve una lista de estrategias ordenadas por mejor rendimiento (promedio de aciertos).
        """
        try:
            # Consultamos los últimos juegos con su rendimiento
            response = self.supabase.table("rendimiento")\
                .select("aciertos_principales, juegos(estrategia)")\
                .order("created_at", desc=True)\
                .limit(100)\
                .execute()
            
            data = response.data
            # Lista base de estrategias por defecto
            all_strats = ["caliente", "fria", "mixta", "balanceada", "unica", "real", "afinidad", "elite", "aleatoria"]
            
            if not data:
                return all_strats

            stats = {}
            for item in data:
                juego = item.get('juegos')
                if not juego or not isinstance(juego, dict): continue
                
                est = juego.get('estrategia')
                if not est: continue
                
                aciertos = item.get('aciertos_principales')
                if aciertos is None: continue
                
                if est not in stats:
                    stats[est] = []
                stats[est].append(float(aciertos))
            
            # Calcular promedios de forma segura
            averages = {k: sum(v)/len(v) if len(v) > 0 else 0 for k, v in stats.items()}
            # Ordenar por promedio descendente
            ranked = sorted(averages, key=averages.get, reverse=True)
            
            # Asegurarse de que todas las estrategias básicas estén en la lista (al final si no tienen datos)
            for s in all_strats:
                if s not in ranked:
                    ranked.append(s)
                    
            return ranked
        except Exception as e:
            print(f"Error al obtener ranking: {e}")
            return ["caliente", "fria", "mixta", "balanceada", "unica", "real"]

    def get_superballot_ranking(self):
        """
        Devuelve una lista de estrategias ordenadas por mejor rendimiento 
        específicamente en aciertos de Superbalota.
        """
        try:
            response = self.supabase.table("rendimiento")\
                .select("acierto_superbalota, juegos(estrategia)")\
                .order("created_at", desc=True)\
                .limit(120)\
                .execute()
            
            data = response.data
            all_strats = ["caliente", "fria", "mixta", "balanceada", "unica", "elite", "afinidad"]
            
            if not data:
                return all_strats

            stats = {}
            for item in data:
                if not item.get('juegos'): continue
                est = item['juegos']['estrategia']
                if est == 'real' or est == 'aleatoria': continue # Evitar recursión o azar puro
                
                hit = 1 if item['acierto_superbalota'] else 0
                if est not in stats:
                    stats[est] = []
                stats[est].append(hit)
            
            # Calcular promedios de acierto de SB
            averages = {k: sum(v)/len(v) for k, v in stats.items()}
            # Ordenar por mejor promedio de SB
            ranked = sorted(averages, key=averages.get, reverse=True)
            
            for s in all_strats:
                if s not in ranked:
                    ranked.append(s)
                    
            return ranked
        except Exception as e:
            print(f"Error al obtener ranking de SB: {e}")
            return ["caliente", "fria", "mixta", "balanceada", "elite"]

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

    def get_top_pairs(self, limit=50):
        """
        Analiza el historial para encontrar parejas de números que salen juntos con frecuencia.
        Retorna un set de tuplas (n1, n2) que han salido juntas al menos X veces.
        """
        try:
            response = self.supabase.table("historial")\
                .select("num1, num2, num3, num4, num5")\
                .eq("tipo", "Baloto")\
                .order("fecha", desc=True)\
                .limit(limit)\
                .execute()
            
            from itertools import combinations
            from collections import Counter
            
            pair_counter = Counter()
            for row in response.data:
                nums = sorted([row['num1'], row['num2'], row['num3'], row['num4'], row['num5']])
                # Generar todas las combinaciones de 2 números en este sorteo
                for pair in combinations(nums, 2):
                    pair_counter[pair] += 1
            
            # Retornamos parejas que han salido 2 o más veces en la ventana de tiempo
            return {pair for pair, count in pair_counter.items() if count >= 2}
        except Exception as e:
            print(f"Error al analizar parejas: {e}")
            return set()

    def get_last_strategy_play(self, strategy_name):
        """Obtiene el último juego registrado para una estrategia específica"""
        response = self.supabase.table("juegos")\
            .select("*")\
            .eq("estrategia", strategy_name)\
            .order("fecha_sorteo", desc=True)\
            .limit(1)\
            .execute()
        
        if response.data:
            return response.data[0]
        return None

    def get_game_result(self, date_str):
        """Obtiene el resultado ganador (historial) para una fecha dada"""
        response = self.supabase.table("historial")\
            .select("*")\
            .eq("fecha", date_str)\
            .eq("tipo", "Baloto")\
            .execute()
            
        if response.data:
            return response.data[0]
        return None

    def get_last_winning_result(self):
        """Obtiene el resultado del sorteo más reciente en el historial."""
        response = self.supabase.table("historial")\
            .select("*")\
            .eq("tipo", "Baloto")\
            .order("fecha", desc=True)\
            .limit(1)\
            .execute()
        
        if response.data:
            return response.data[0]
        return None

    def get_number_cycles(self, window=100):
        """Calcula el promedio de sorteos que tarda cada número en reaparecer."""
        try:
            res = self.supabase.table("historial")\
                .select("num1, num2, num3, num4, num5")\
                .eq("tipo", "Baloto")\
                .order("fecha", desc=True)\
                .limit(window)\
                .execute()
            
            draws = res.data
            number_gaps = {i: [] for i in range(1, 44)}
            last_seen = {i: -1 for i in range(1, 44)}

            for i, draw in enumerate(reversed(draws)): # De viejo a nuevo
                nums = [draw[f'num{j}'] for j in range(1, 6)]
                for n in nums:
                    if last_seen[n] != -1:
                        number_gaps[n].append(i - last_seen[n])
                    last_seen[n] = i
            
            # Promedio de ciclos
            cycles = {num: (sum(gaps)/len(gaps) if gaps else 20) for num, gaps in number_gaps.items()}
            return cycles
        except Exception:
            return {i: 10 for i in range(1, 44)}

    def get_momentum_numbers(self):
        """Detecta números con 'aceleración': salieron más en los últimos 10 que en los anteriores."""
        try:
            res = self.supabase.table("historial")\
                .select("num1, num2, num3, num4, num5")\
                .eq("tipo", "Baloto")\
                .order("fecha", desc=True)\
                .limit(30)\
                .execute()
            
            recent = res.data[:10]
            older = res.data[10:30]

            def count_freq(data_list):
                from collections import Counter
                flat = []
                for d in data_list: flat.extend([d[f'num{j}'] for j in range(1, 6)])
                return Counter(flat)

            freq_recent = count_freq(recent)
            freq_older = count_freq(older)

            momentum = []
            for i in range(1, 44):
                # Si sale más frecuentemente ahora que antes (normalizado)
                if freq_recent[i] / 10 > freq_older[i] / 20:
                    momentum.append(i)
            return momentum
        except Exception:
            return []

    def get_recent_full_historial(self, limit=200):
        """Obtiene los últimos resultados completos para evitar repeticiones."""
        res = self.supabase.table("historial")\
            .select("num1, num2, num3, num4, num5")\
            .eq("tipo", "Baloto")\
            .order("fecha", desc=True)\
            .limit(limit)\
            .execute()
        return [set([r[f'num{j}'] for j in range(1, 6)]) for r in res.data]

    def get_full_historial_data(self, limit=400):
        """Descarga el historial completo para procesamiento local (eficiencia)"""
        try:
            res = self.supabase.table("historial")\
                .select("num1, num2, num3, num4, num5, num6")\
                .eq("tipo", "Baloto")\
                .order("fecha", desc=True)\
                .limit(limit)\
                .execute()
            return res.data
        except Exception as e:
            print(f"Error al descargar historial completo: {e}")
            return []

    def get_affinity_next_number(self, current_nums, history_data=None):
        """
        Busca el número más afín. Si se pasa history_data (lista de dicts), 
        se procesa localmente para evitar consultas de red.
        """
        try:
            from collections import Counter
            import random
            
            # Si no hay previo, devolver uno caliente
            if not current_nums:
                hot = self.get_hot_numbers()
                return random.choice(hot) if hot else random.randint(1, 43)

            # Si no hay datos previos, cargarlos ahora (fallback)
            if history_data is None:
                res = self.supabase.table("historial")\
                    .select("num1, num2, num3, num4, num5")\
                    .eq("tipo", "Baloto")\
                    .order("fecha", desc=True)\
                    .limit(400)\
                    .execute()
                history_sets = [set([r[f'num{j}'] for j in range(1, 6)]) for r in res.data]
            else:
                # Filtrar solo los números principales del data pre-cargado
                history_sets = [set([r[f'num{j}'] for j in range(1, 6)]) for r in history_data]
            
            # 1. Intentar coincidencia con el grupo completo
            candidates = Counter()
            match_found = False
            
            for draw in history_sets:
                if set(current_nums).issubset(draw):
                    for n in draw:
                        if n not in current_nums:
                            candidates[n] += 1
                            match_found = True
            
            if match_found:
                return candidates.most_common(1)[0][0]
            
            # 2. Fallback: Buscar afinidad individual
            fallback_candidates = Counter()
            for draw in history_sets:
                intersection = set(current_nums).intersection(draw)
                if intersection:
                    weight = len(intersection)
                    for n in draw:
                        if n not in current_nums:
                            fallback_candidates[n] += weight
            
            if fallback_candidates:
                return fallback_candidates.most_common(1)[0][0]
            
            return random.randint(1, 43)
            
        except Exception as e:
            print(f"Error en afinidad: {e}")
            return random.randint(1, 43)

    def get_superballot_affinity(self, quinteto, history_data=None):
        """Busca qué Superbalota ha salido más veces con este quinteto"""
        try:
            if history_data is None:
                res = self.supabase.table("historial")\
                    .select("num1, num2, num3, num4, num5, num6")\
                    .eq("tipo", "Baloto")\
                    .order("fecha", desc=True)\
                    .limit(300)\
                    .execute()
                data = res.data
            else:
                data = history_data
            
            from collections import Counter
            sb_candidates = Counter()
            quinteto_set = set(quinteto)
            
            for r in data:
                draw_set = set([r[f'num{j}'] for j in range(1, 6)])
                intersection_size = len(quinteto_set.intersection(draw_set))
                if intersection_size >= 2: 
                    sb_candidates[r['num6']] += intersection_size
            
            return sb_candidates.most_common(1)[0][0] if sb_candidates else None
        except Exception:
            return None

if __name__ == "__main__":
    db = DBProvider()
    print(f"Mejor Estrategia Actual: {db.get_best_strategy()}")
    print(f"Números Calientes: {db.get_hot_numbers()}")
