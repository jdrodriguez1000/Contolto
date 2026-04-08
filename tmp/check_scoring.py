import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def check_scoring():
    # Check if there are any records in 'rendimiento' linked to games from 2026-04-04
    res = supabase.table("rendimiento").select("id, juegos!inner(fecha_sorteo)").eq("juegos.fecha_sorteo", "2026-04-04").execute()
    print(f"Scored games for 2026-04-04: {len(res.data)}")

if __name__ == "__main__":
    check_scoring()
