
import random
import os
import json
from datetime import datetime, timedelta
from core_v2.db_provider import DBProvider

class GameGenerator:
    def __init__(self):
        self.db = DBProvider()
        self.hot_pool = self.db.get_hot_numbers()
        self.cold_pool = self.db.get_cold_numbers()
        self.best_strat = self.db.get_best_strategy()

    def get_next_draw_date(self):
        """
        Calcula la fecha del próximo sorteo. 
        Días de juego: Lunes(0), Miércoles(2), Sábado(5).
        Cutoff: 8:00 PM (20:00).
        """
        now = datetime.now()
        current_weekday = now.weekday()
        current_hour = now.hour
        
        # Días de sorteo: Lunes(0), Miércoles(2), Sábado(5)
        draw_days = [0, 2, 5] 
        
        # Si hoy es día de sorteo pero es antes de las 8 PM, el sorteo es HOY
        if current_weekday in draw_days and current_hour < 20:
            return now.strftime("%Y-%m-%d")
        
        # De lo contrario, buscar desde mañana el próximo día de sorteo
        for i in range(1, 8):
            next_day = now + timedelta(days=i)
            if next_day.weekday() in draw_days:
                return next_day.strftime("%Y-%m-%d")
                
        return now.strftime("%Y-%m-%d")

    def select_superballot(self):
        stats = self.db.get_superballot_stats()
        scores = {i: 0 for i in range(1, 17)}
        max_gap = max(stats['gaps'].values())
        for num, gap in stats['gaps'].items():
            if gap > 20: scores[num] += 3
            if gap > 10: scores[num] += 1
        for num in stats['trending']:
            scores[num] += 2
        if stats.get('last') in scores:
            scores[stats['last']] -= 2
        best_sb = max(scores, key=scores.get)
        return best_sb

    def generate_fria(self):
        nums = random.sample(self.cold_pool, 4)
        nums.append(random.choice(list(set(range(1, 44)) - set(nums))))
        return sorted(nums)

    def generate_caliente(self):
        nums = random.sample(self.hot_pool, 4)
        remaining = list(set(range(1, 44)) - set(nums))
        nums.append(random.choice(remaining))
        return sorted(nums)

    def generate_balanceada(self):
        nums = []
        ranges = [(1, 10), (11, 20), (21, 30), (31, 40), (41, 43)]
        for r in ranges:
            nums.append(random.randint(r[0], r[1]))
        return sorted(nums)

    def generate_mixta(self):
        nums = random.sample(self.hot_pool, 2)
        nums.extend(random.sample(self.cold_pool, 2))
        remaining = list(set(range(1, 44)) - set(nums))
        nums.append(random.choice(remaining))
        return sorted(nums)

    def generate_real(self):
        base_strat = self.best_strat
        if base_strat == 'real':
            base_strat = 'balanceada' 
        if base_strat == 'fria': base_nums = random.sample(self.cold_pool, 4)
        elif base_strat == 'caliente': base_nums = random.sample(self.hot_pool, 4)
        elif base_strat == 'balanceada': base_nums = self.generate_balanceada()[:4]
        else: base_nums = self.generate_mixta()[:4]
        extra_pool = [n for n in self.hot_pool if n not in base_nums]
        if not extra_pool: extra_pool = list(set(range(1,44)) - set(base_nums))
        final_nums = base_nums + [random.choice(extra_pool)]
        return sorted(final_nums)

    def generate_all_and_save(self, save_to_db=False):
        fecha_sorteo = self.get_next_draw_date()
        results = {
            "metadata": {
                "fecha_generacion": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "fecha_sorteo_objetivo": fecha_sorteo,
                "mejor_estrategia_detectada": self.best_strat,
                "reglas_temporales": "Mon-Wed-Sat, Cutoff 8:00 PM"
            },
            "juegos": []
        }
        
        strategies = {
            "caliente": self.generate_caliente,
            "fria": self.generate_fria,
            "mixta": self.generate_mixta,
            "balanceada": self.generate_balanceada,
            "real": self.generate_real
        }
        
        for name, func in strategies.items():
            nums = func()
            sb = self.select_superballot()
            juego = {
                "fecha_sorteo": fecha_sorteo,
                "estrategia": name,
                "num1": nums[0],
                "num2": nums[1],
                "num3": nums[2],
                "num4": nums[3],
                "num5": nums[4],
                "num6": sb
            }
            results["juegos"].append(juego)
            print(f"✅ Generado [{name.upper()}]: {nums} SB: {sb}")

        # 1. Guardar archivo JSON
        os.makedirs("reports", exist_ok=True)
        with open("reports/last_recommendation.json", "w", encoding="utf-8") as f:
            json.dump(results, f, indent=4, ensure_ascii=False)
        print(f"\n📂 Reporte JSON guardado en: reports/last_recommendation.json")

        # 2. Subir a la base de datos con limpieza de duplicados
        if save_to_db:
            print("\n📤 Sincronizando juegos con Supabase...")
            try:
                for juego in results["juegos"]:
                    # Limpiamos cualquier entrada previa para esta fecha y estrategia
                    self.db.supabase.table("juegos")\
                        .delete()\
                        .match({"fecha_sorteo": fecha_sorteo, "estrategia": juego["estrategia"]})\
                        .execute()
                
                # Insertamos el nuevo set de juegos
                self.db.supabase.table("juegos").insert(results["juegos"]).execute()
                print(f"✅ Juegos sincronizados exitosamente para el sorteo del {fecha_sorteo}.")
            except Exception as e:
                print(f"❌ Error al sincronizar con la DB: {e}")

if __name__ == "__main__":
    gen = GameGenerator()
    gen.generate_all_and_save(save_to_db=True)
