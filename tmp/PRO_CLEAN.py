import os
from supabase import create_client
from dotenv import load_dotenv

# Cargamos las credenciales oficiales de tu proyecto
load_dotenv('.env')
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_ANON_KEY")
supabase = create_client(url, key)

# Limpiamos el registro del 4 de abril (ID 38008)
print(f"Limpiando rendimiento para Juego ID 38008...")
res = supabase.table("rendimiento").delete().eq("juego_id", 38008).execute()
print(f"Resultado: {res}")
