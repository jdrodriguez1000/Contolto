
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
        
        # Nuevos pools analíticos para ELITE
        self.cycles = self.db.get_number_cycles()
        self.momentum_pool = self.db.get_momentum_numbers()
        self.recent_winners = self.db.get_recent_full_historial(limit=150)
        
        # Cargar parejas frecuentes (Afinidad)
        self.affine_pairs = self.db.get_top_pairs(limit=60)
        
        # Cargar últimos números ganadores para la regla de exclusión
        last_res = self.db.get_last_winning_result()
        if last_res:
            self.last_won_nums = {last_res[f'num{i}'] for i in range(1, 6)}
            self.last_won_sb = last_res.get('num6')
        else:
            self.last_won_nums = set()
            self.last_won_sb = None

    def get_next_draw_date(self):
        now = datetime.now()
        current_weekday = now.weekday()
        current_hour = now.hour
        draw_days = [0, 2, 5] 
        if current_weekday in draw_days and current_hour < 20:
            return now.strftime("%Y-%m-%d")
        for i in range(1, 8):
            next_day = now + timedelta(days=i)
            if next_day.weekday() in draw_days:
                return next_day.strftime("%Y-%m-%d")
        return now.strftime("%Y-%m-%d")

    def _is_statistically_probable(self, nums):
        s = sum(nums)
        if not (90 <= s <= 140): return False
        evens = sum(1 for n in nums if n % 2 == 0)
        if evens not in [2, 3]: return False
        z1 = any(1 <= n <= 14 for n in nums)
        z2 = any(15 <= n <= 28 for n in nums)
        z3 = any(29 <= n <= 43 for n in nums)
        if not (z1 and z2 and z3): return False
        return True

    def _check_high_low(self, nums):
        """Filtro de balance entre números bajos (1-21) y altos (22-43)"""
        lows = sum(1 for n in nums if 1 <= n <= 21)
        return lows in [2, 3]

    def _check_spacings(self, nums):
        """Evita jugadas con distancias extremas entre números."""
        s = sorted(nums)
        gaps = [s[i+1] - s[i] for i in range(len(s)-1)]
        if max(gaps) > 15: return False # Demasiado salto
        if s[-1] - s[0] < 22: return False # Demasiado agrupados
        return True

    def _check_historical_similarity(self, nums):
        """
        Descarta si la jugada coincide en 3 o más números con algún 
        ganador de los últimos 150 sorteos.
        """
        current_set = set(nums)
        for winner in self.recent_winners:
            intersection = current_set.intersection(winner)
            if len(intersection) >= 3:
                return False
        return True

    def _check_pair_affinity(self, nums):
        if not self.affine_pairs: return True
        from itertools import combinations
        current_pairs = set(combinations(sorted(nums), 2))
        return bool(current_pairs.intersection(self.affine_pairs))

    def _is_valid_play(self, nums, is_main=True, is_elite=False):
        s = sorted(nums)
        for i in range(len(s) - 1):
            if s[i+1] - s[i] == 1: return False
        
        if is_main:
            intersection = set(nums).intersection(self.last_won_nums)
            if len(intersection) >= 2: return False

        if not self._is_statistically_probable(nums): return False
        
        # Filtros adicionales para ELITE
        if is_elite:
            if not self._check_high_low(nums): return False
            if not self._check_spacings(nums): return False
            if not self._check_historical_similarity(nums): return False
        
        if not self._check_pair_affinity(nums): return False
        return True

    def select_superballot(self):
        stats = self.db.get_superballot_stats()
        scores = {i: 0 for i in range(1, 17)}
        for num, gap in stats['gaps'].items():
            if 5 <= gap <= 15: scores[num] += 10
            elif gap > 20: scores[num] += 3
        for num in stats['trending']: scores[num] += 2
        if self.last_won_sb in scores: scores[self.last_won_sb] = -99
        return max(scores, key=scores.get)

    def select_sb_caliente(self):
        stats = self.db.get_superballot_stats()
        trending = [n for n in stats.get('trending', []) if n != self.last_won_sb]
        return random.choice(trending) if trending else random.randint(1, 16)

    def select_sb_fria(self):
        stats = self.db.get_superballot_stats()
        gaps = {k: v for k, v in stats.get('gaps', {}).items() if k != self.last_won_sb}
        return max(gaps, key=gaps.get) if gaps else random.randint(1, 16)

    def generate_fria(self):
        for _ in range(200):
            nums = random.sample(self.cold_pool, 4)
            remaining = list(set(range(1, 44)) - set(nums))
            nums.append(random.choice(remaining))
            if self._is_valid_play(nums): return sorted(nums)
        return sorted(random.sample(range(1, 44), 5))

    def generate_caliente(self):
        for _ in range(200):
            nums = random.sample(self.hot_pool, 4)
            remaining = list(set(range(1, 44)) - set(nums))
            nums.append(random.choice(remaining))
            if self._is_valid_play(nums): return sorted(nums)
        return sorted(random.sample(range(1, 44), 5))

    def generate_balanceada(self):
        for _ in range(200):
            nums = [random.randint(1, 10), random.randint(11, 20), random.randint(21, 30), random.randint(31, 40), random.randint(41, 43)]
            if self._is_valid_play(nums): return sorted(nums)
        return sorted(random.sample(range(1, 44), 5))

    def generate_mixta(self):
        for _ in range(200):
            nums = random.sample(self.hot_pool, 2) + random.sample(self.cold_pool, 2)
            remaining = list(set(range(1, 44)) - set(nums))
            nums.append(random.choice(remaining))
            if self._is_valid_play(nums): return sorted(nums)
        return sorted(random.sample(range(1, 44), 5))

    def generate_elite(self):
        """
        Estrategia Maestra: Ciclo + Momentum + Filtros Elite.
        """
        # Calcular números que están 'due' (les toca salir según ciclo)
        # Combinar con momentum
        stats_sb = self.db.get_superballot_stats()
        gaps_now = stats_sb.get('gaps', {})
        due_numbers = [num for num, gap in gaps_now.items() if num in self.cycles and gap > self.cycles[num]]
        
        elite_pool = list(set(due_numbers) | set(self.momentum_pool) | set(self.hot_pool))
        if len(elite_pool) < 10: elite_pool = list(range(1, 44))

        for _ in range(500): # Más intentos por ser más restrictivo
            nums = random.sample(elite_pool, 5)
            if self._is_valid_play(nums, is_elite=True):
                return sorted(nums)
        
        # Fallback si el pool elite es muy restrictivo
        return self.generate_caliente()

    def _get_nums_from_strat(self, strat_name):
        if strat_name == "caliente": return self.generate_caliente()
        if strat_name == "fria": return self.generate_fria()
        if strat_name == "balanceada": return self.generate_balanceada()
        if strat_name == "mixta": return self.generate_mixta()
        if strat_name == "elite": return self.generate_elite()
        if strat_name == "unica": 
            nums, _ = self.generate_unica()
            return nums
        return self.generate_balanceada()

    def generate_real(self):
        ranking = self.db.get_strategy_ranking()
        filtered_ranking = [r for r in ranking if r != 'real']
        strat_80 = filtered_ranking[0] if filtered_ranking else "caliente"
        strat_20 = filtered_ranking[1] if len(filtered_ranking) > 1 else "mixta"
        
        for _ in range(200):
            nums_main = self._get_nums_from_strat(strat_80)
            nums_secondary = self._get_nums_from_strat(strat_20)
            base = random.sample(nums_main, 4)
            available = [n for n in nums_secondary if n not in base]
            final_num = random.choice(available) if available else random.choice(list(set(range(1, 44)) - set(base)))
            candidate = base + [final_num]
            if self._is_valid_play(candidate): return sorted(candidate)
        return sorted(candidate)

    def generate_aleatoria(self):
        return sorted(random.sample(range(1, 44), 5)), random.randint(1, 16)

    def generate_unica(self):
        last_play = self.db.get_last_strategy_play("unica")
        if not last_play: return sorted([2, 10, 15, 33, 43]), 7
        result = self.db.get_game_result(last_play['fecha_sorteo'])
        if not result: return sorted([last_play[f'num{i}'] for i in range(1, 6)]), last_play.get('num6', 7)
        
        played = {last_play[f'num{i}'] for i in range(1, 6)}
        winning = {result[f'num{i}'] for i in range(1, 6)}
        hits = played.intersection(winning)
        
        new_comb = list(played - hits)
        potential = [n for n in self.hot_pool if n not in new_comb and n not in hits]
        while len(new_comb) < 5:
            if potential: new_comb.append(potential.pop(0))
            else: new_comb.append(random.choice(list(set(range(1, 44)) - set(new_comb))))
        
        played_sb = last_play.get('num6', 7)
        final_sb = self.select_superballot() if played_sb == result.get('num6') else played_sb
        if not self._is_valid_play(new_comb): return self.generate_caliente(), final_sb
        return sorted(new_comb), final_sb

    def generate_all_and_save(self, save_to_db=False):
        fecha = self.get_next_draw_date()
        results = {"metadata": {"fecha_generacion": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "fecha_sorteo_objetivo": fecha}, "juegos": []}
        
        strats = {
            "caliente": (self.generate_caliente, self.select_sb_caliente),
            "fria": (self.generate_fria, self.select_sb_fria),
            "mixta": (self.generate_mixta, self.select_superballot),
            "balanceada": (self.generate_balanceada, lambda: random.randint(1, 16)),
            "elite": (self.generate_elite, self.select_superballot),
            "real": (self.generate_real, self.select_superballot),
            "unica": (self.generate_unica, None),
            "aleatoria": (self.generate_aleatoria, None)
        }
        
        for name, funcs in strats.items():
            if name in ["unica", "aleatoria"]:
                nums, sb = funcs[0]()
            else:
                nums = funcs[0]()
                sb = funcs[1]()
            
            juego = {"fecha_sorteo": fecha, "estrategia": name, "num1": nums[0], "num2": nums[1], "num3": nums[2], "num4": nums[3], "num5": nums[4], "num6": sb}
            results["juegos"].append(juego)
            print(f"✅ [{name.upper()}]: {nums} SB: {sb}")

        os.makedirs("reports", exist_ok=True)
        with open("reports/last_recommendation.json", "w", encoding="utf-8") as f:
            json.dump(results, f, indent=4, ensure_ascii=False)

        if save_to_db:
            for j in results["juegos"]:
                self.db.supabase.table("juegos").delete().match({"fecha_sorteo": fecha, "estrategia": j["estrategia"]}).execute()
            self.db.supabase.table("juegos").insert(results["juegos"]).execute()
            print(f"✅ Juegos sincronizados (incluyendo ELITE).")

if __name__ == "__main__":
    gen = GameGenerator()
    gen.generate_all_and_save(save_to_db=True)
