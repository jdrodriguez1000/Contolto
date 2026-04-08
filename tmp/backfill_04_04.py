import os
import sys
from datetime import datetime
from core_v2.game_generator import GameGenerator
from core_v2.db_provider import DBProvider

def backfill():
    # 1. Init
    db = DBProvider()
    generator = GameGenerator()
    target_date = "2026-04-04"
    
    print(f"[*] Iniciando backfill para la fecha: {target_date}")
    
    # 2. Definir las estrategias a generar (como en generate_all_and_save)
    configs = [
        ("caliente", 300), ("fria", 300), ("mixta", 300),
        ("balanceada", 300), ("elite", 300), ("real", 1),
        ("unica", 1), ("aleatoria", 300)
    ]
    
    all_new_games = []
    
    for strategy_name, count in configs:
        print(f"[*] Generando {count} juegos para {strategy_name}...")
        for _ in range(count):
            if strategy_name == "aleatoria":
                nums, sb = generator.generate_aleatoria()
            elif strategy_name == "unica":
                nums, sb = generator.generate_unica()
            else:
                method = getattr(generator, f"generate_{strategy_name}")
                nums = method()
                sb = generator.select_superballot()
                
            game_data = {
                "num1": nums[0],
                "num2": nums[1],
                "num3": nums[2],
                "num4": nums[3],
                "num5": nums[4],
                "num6": sb,
                "estrategia": strategy_name,
                "fecha_sorteo": target_date,
                "created_at": datetime.now().isoformat()
            }
            all_new_games.append(game_data)
            
    # 3. Guardar en DB por bloques
    if all_new_games:
        batch_size = 50
        print(f"[*] Sincronizando {len(all_new_games)} juegos en bloques de {batch_size}...")
        for i in range(0, len(all_new_games), batch_size):
            batch = all_new_games[i : i + batch_size]
            db.supabase.table("juegos").insert(batch).execute()
        print("[SUCCESS] Juegos del 2026-04-04 guardados exitosamente.")
    else:
        print("[!] No se generó ningún juego.")

if __name__ == "__main__":
    backfill()
