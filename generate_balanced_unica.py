
import random
import os
import sys

# Add parent directory to path to import core_v2 modules
sys.path.append(os.getcwd())

from core_v2.db_provider import DBProvider
from core_v2.game_generator import GameGenerator

def is_consecutive(nums):
    unique = sorted(set(nums))
    for i in range(len(unique) - 1):
        if unique[i] + 1 == unique[i+1]:
            return True
    return False

def get_odd_even_stats(nums):
    odds = sum(1 for n in nums if n % 2 != 0)
    evens = sum(1 for n in nums if n % 2 == 0)
    return odds, evens

def generate_balanced_unica():
    db = DBProvider()
    gen = GameGenerator()
    
    # Simulating the strategy selection provided by the user (80% Fria, 20% Caliente)
    ranking = db.get_strategy_ranking()
    filtered_ranking = [r for r in ranking if r != 'real' and r != 'unica']
    if len(filtered_ranking) < 2:
        strat_80 = "fria"
        strat_20 = "caliente"
    else:
        strat_80 = filtered_ranking[0]
        strat_20 = filtered_ranking[1]
        
    print(f"Buscando con 80% {strat_80.upper()} y 20% {strat_20.upper()}")
    
    attempts = 0
    valid_candidates = []
    
    # Loop to find valid combinations
    while len(valid_candidates) < 5 and attempts < 100:
        attempts += 1
        
        # Get fresh numbers
        if strat_80 == "fria": nums_main = gen.generate_fria()
        elif strat_80 == "caliente": nums_main = gen.generate_caliente()
        elif strat_80 == "mixta": nums_main = gen.generate_mixta()
        else: nums_main = gen.generate_balanceada()
        
        if strat_20 == "fria": nums_sec = gen.generate_fria()
        elif strat_20 == "caliente": nums_sec = gen.generate_caliente()
        elif strat_20 == "mixta": nums_sec = gen.generate_mixta()
        else: nums_sec = gen.generate_balanceada()
        
        # Select 4 from Main
        if len(nums_main) < 4: continue
        base = random.sample(nums_main, 4)
        
        # Select 1 from Secondary
        avail = [x for x in nums_sec if x not in base]
        if not avail: continue
        fifth = random.choice(avail)
        
        combo = sorted(base + [fifth])
        
        # Validación unificada con el motor principal (Suma, Paridad, Cuadrantes, Consecutivos)
        if not gen._is_valid_play(combo): continue
        
        if combo not in valid_candidates:
            valid_candidates.append(combo)
            
    print(f"\n--- Candidatos Encontrados ({len(valid_candidates)} opciones) ---")
    sb = gen.select_superballot()
    
    for i, c in enumerate(valid_candidates):
        o, e = get_odd_even_stats(c)
        print(f"Opción {i+1}: {c} (Impares: {o}, Pares: {e}) SB: {sb}")

if __name__ == "__main__":
    generate_balanced_unica()
