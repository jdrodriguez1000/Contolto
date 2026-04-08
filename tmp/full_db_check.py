
import os
from core_v2.db_provider import DBProvider

def full_count():
    db = DBProvider()
    response = db.supabase.table("juegos").select("fecha_sorteo, estrategia").execute()
    data = response.data or []
    
    counts = {}
    for r in data:
        f = r['fecha_sorteo']
        e = r['estrategia']
        key = (f, e)
        counts[key] = counts.get(key, 0) + 1
    
    print("\n--- All Games in 'juegos' table ---")
    for (f, e), c in sorted(counts.items(), key=lambda x: (x[0][0], x[0][1])):
        print(f"  {f} | {e:12} | {c} games")

if __name__ == "__main__":
    full_count()
