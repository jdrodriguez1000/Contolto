import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def check_counts():
    try:
        # Count all in juegos strategy = 'real' EXACTLY
        res_j_real = supabase.table("juegos").select("id", count="exact").eq("estrategia", "real").execute()
        res_j_unica = supabase.table("juegos").select("id", count="exact").eq("estrategia", "unica").execute()
        
        # Count all in rendement exactly for those strategies
        res_r_real = supabase.table("rendimiento").select("id", "juegos!inner(estrategia)", count="exact").eq("juegos.estrategia", "real").execute()
        res_r_unica = supabase.table("rendimiento").select("id", "juegos!inner(estrategia)", count="exact").eq("juegos.estrategia", "unica").execute()

        with open("tmp/counts_output.txt", "w") as f:
            f.write(f"REAL games: juegos={res_j_real.count}, rendimiento={res_r_real.count}\n")
            f.write(f"UNICA games: juegos={res_j_unica.count}, rendimiento={res_r_unica.count}\n")
            
    except Exception as e:
        with open("tmp/counts_output.txt", "w") as f:
            f.write(f"Error: {e}\n")

if __name__ == "__main__":
    check_counts()
