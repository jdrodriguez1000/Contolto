import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def check_historial():
    res = supabase.table("historial").select("tipo").eq("fecha", "2026-04-04").execute()
    print(f"Tipo for 2026-04-04: {[d['tipo'] for d in res.data]}")

if __name__ == "__main__":
    check_historial()
