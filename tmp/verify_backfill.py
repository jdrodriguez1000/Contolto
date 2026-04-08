import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def verify_juegos():
    res = supabase.table("juegos").select("id").eq("fecha_sorteo", "2026-04-04").execute()
    print(f"Games for 2026-04-04: {len(res.data)}")

if __name__ == "__main__":
    verify_juegos()
