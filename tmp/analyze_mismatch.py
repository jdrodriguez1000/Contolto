import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def analyze_mismatch():
    target_date = "2026-04-04"
    
    # 1. Total games in 'juegos' for that date
    res_j = supabase.table("juegos").select("count").eq("fecha_sorteo", target_date).execute()
    count_j = res_j.count if hasattr(res_j, 'count') else (len(res_j.data) if res_j.data else 0)
    
    # 2. Total in 'rendimiento' for those games
    # We need to join but let's just check the counts
    res_r = supabase.table("rendimiento").select("id", "juegos!inner(fecha_sorteo, estrategia)").eq("juegos.fecha_sorteo", target_date).execute()
    count_r = len(res_r.data) if res_r.data else 0
    
    # 3. Check 'historial' for that date
    res_h = supabase.table("historial").select("*").eq("fecha", target_date).execute()
    
    print(f"Date: {target_date}")
    print(f"Juegos (count): {count_j}")
    print(f"Rendimiento (count): {count_r}")
    print(f"Historial results:")
    for h in res_h.data or []:
        print(f"  - Tipo: {h['tipo']}, Números: {h['num1']}-{h['num2']}-{h['num3']}-{h['num4']}-{h['num5']} (SB: {h['num6']})")

if __name__ == "__main__":
    analyze_mismatch()
