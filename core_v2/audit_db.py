import os
import sys
from dotenv import load_dotenv
from supabase import create_client

def main():
    load_dotenv()
    url = os.environ.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_ANON_KEY')
    if not url or not key:
        print("ERROR: SUPABASE_URL or SUPABASE_ANON_KEY not found in .env")
        return

    supabase = create_client(url, key)
    
    # 1. Fetch ALL Juegos
    print("[1/3] Cargando todos los juegos...")
    all_juegos = []
    from_idx = 0
    to_idx = 999
    while True:
        res = supabase.table('juegos').select('id, estrategia').range(from_idx, to_idx).execute()
        all_juegos.extend(res.data)
        if len(res.data) < 1000: break
        from_idx += 1000
        to_idx += 1000

    j_map = {j['id']: (j['estrategia'] or '').lower().strip() for j in all_juegos}
    print(f"Total juegos cargados: {len(all_juegos)}")
    
    # 2. Fetch ALL Rendimiento
    print("[2/3] Cargando todo el rendimiento...")
    all_rend = []
    from_idx = 0
    to_idx = 999
    while True:
        res = supabase.table('rendimiento').select('id, juego_id').range(from_idx, to_idx).execute()
        all_rend.extend(res.data)
        if len(res.data) < 1000: break
        from_idx += 1000
        to_idx += 1000
    
    print(f"Total registros rendimiento cargados: {len(all_rend)}")
    
    # 3. Analyze
    print("[3/3] Analizando...")
    counts = {}
    for r in all_rend:
        est = j_map.get(r['juego_id'], 'orphaned')
        counts[est] = counts.get(est, 0) + 1
    
    print("\n[ RESULTADOS DE AUDITORÍA ]")
    print("-" * 30)
    for est, count in sorted(counts.items(), key=lambda x: x[1], reverse=True):
        print(f"{est.upper():<15}: {count}")

if __name__ == "__main__":
    main()
