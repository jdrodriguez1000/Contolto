import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def debug_update():
    # 1. Get games for April 4
    juegos = supabase.table("juegos").select("*").eq("fecha_sorteo", "2026-04-04").execute().data
    print(f"Juegos for April 4: {len(juegos)}")
    
    # 2. Check if they have performance
    juego_ids = [j['id'] for j in juegos]
    rendimiento_res = supabase.table("rendimiento").select("juego_id").in_("juego_id", juego_ids).execute()
    print(f"Already scored: {len(rendimiento_res.data)}")
    
    # 3. Check corresponding historial
    hist_res = supabase.table("historial").select("*").eq("fecha", "2026-04-04").eq("tipo", "Baloto").execute()
    print(f"Winner found in historial: {len(hist_res.data)}")
    if hist_res.data:
        print(f"Winner detail: {hist_res.data[0]}")

if __name__ == "__main__":
    debug_update()
