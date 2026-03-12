
import random
import os
import sys

# Add parent directory to path to import core_v2 modules
sys.path.append(os.getcwd())

from core_v2.db_provider import DBProvider
from core_v2.game_generator import GameGenerator

def generate_optimal_unica_base():
    db = DBProvider()
    gen = GameGenerator()
    
    # 1. Obtener Ranking Real
    ranking = db.get_strategy_ranking()
    print(f"Ranking Actual: {ranking}")
    
    # 2. Aplicar lógica: Si Real es #1, la ignoramos para la base (o si aparece, la filtramos)
    # Queremos 80% de la mejor NO-Real y 20% de la segunda mejor NO-Real
    filtered_ranking = [r for r in ranking if r != 'real' and r != 'unica'] 
    # Notamos que 'unica' también debería filtrarse si estamos generando su "semilla" inicial 
    # para no depender de su propia historia vacía o contaminada.
    
    if len(filtered_ranking) < 2:
        filtered_ranking = ["caliente", "fria", "mixta", "balanceada"]

    strat_80 = filtered_ranking[0]
    strat_20 = filtered_ranking[1]
    
    print(f"Generando nueva base ÚNICA con: 80% {strat_80.upper()} y 20% {strat_20.upper()}")
    
    # 3. Generar números
    # Usamos el método _get_nums_from_strat que acabamos de crear en GameGenerator
    # Pero como es 'private' (empieza con _), accedemos a él o usamos las funciones directas.
    # Usaremos las funciones directas mapeadas para ser explícitos.
    
    strategies = {
        "caliente": gen.generate_caliente,
        "fria": gen.generate_fria,
        "mixta": gen.generate_mixta,
        "balanceada": gen.generate_balanceada
    }
    
    nums_main = strategies[strat_80]()
    nums_secondary = strategies[strat_20]()
    
    # Seleccionar 4 números de la estrategia principal
    base_selection = random.sample(nums_main, 4)
    
    # Seleccionar 1 número de la estrategia secundaria
    available_secondary = [n for n in nums_secondary if n not in base_selection]
    if not available_secondary:
         remaining = list(set(range(1, 44)) - set(base_selection))
         final_num = random.choice(remaining)
    else:
        final_num = random.choice(available_secondary)
        
    final_combination = sorted(base_selection + [final_num])
    
    # 4. Superbalota
    # La lógica de consenso: ver qué dice la caliente, fria, mixta, balanceada.
    # O usar la mejor SB detectada por estadísticas.
    # Usaremos la mejor SB estadística actual.
    sb = gen.select_superballot()
    
    print(f"\n✨ NUEVA COMBINACIÓN ÚNICA SUGERIDA ✨")
    print(f"Números: {final_combination}")
    print(f"Superbalota: {sb}")

if __name__ == "__main__":
    generate_optimal_unica_base()
