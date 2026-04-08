import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def inspect_games():
    res = supabase.table("juegos").select("id, fecha_sorteo").eq("fecha_sorteo", "2026-04-04").limit(5).execute()
    print(f"Games for April 4: {res.data}")
    
    res_h = supabase.table("historial").select("fecha").eq("fecha", "2026-04-04").execute()
    print(f"Historial for April 4: {res_h.data}")

if __name__ == "__main__":
    inspect_games()
