
import os
from core_v2.db_provider import DBProvider
from core_v2.game_generator import GameGenerator
from datetime import datetime

def check():
    db = DBProvider()
    gen = GameGenerator()
    next_date = gen.get_next_draw_date()
    print(f"Target Draw Date: {next_date}")
    
    # Check if there are games for this date
    response = db.supabase.table("juegos").select("estrategia").eq("fecha_sorteo", next_date).execute()
    
    if not response.data:
        print(f"No games found for date {next_date}")
        # Try finding the latest date with games
        latest_response = db.supabase.table("juegos").select("fecha_sorteo").order("fecha_sorteo", desc=True).limit(1).execute()
        if latest_response.data:
            latest_date = latest_response.data[0]['fecha_sorteo']
            print(f"Latest date with games: {latest_date}")
            response = db.supabase.table("juegos").select("estrategia").eq("fecha_sorteo", latest_date).execute()
            strats = [r['estrategia'] for r in response.data]
            from collections import Counter
            print(f"Strategies for {latest_date}: {Counter(strats)}")
        else:
            print("No games found in the entire table.")
        return

    strats = [r['estrategia'] for r in response.data]
    from collections import Counter
    counts = Counter(strats)
    print(f"\n--- Strategy counts for {next_date} ---")
    for s, c in counts.items():
        print(f"  {s}: {c}")
    
    expected_strats = ["caliente", "fria", "mixta", "balanceada", "elite", "real", "unica", "aleatoria"]
    missing = [s for s in expected_strats if s not in counts]
    if missing:
        print(f"\n❌ MISSING strategies for {next_date}: {missing}")
    else:
        print(f"\n✅ All expected strategies exist for {next_date}.")

if __name__ == "__main__":
    check()
