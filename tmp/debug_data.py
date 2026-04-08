import requests
import json

url = "https://bftecvvvtlbezybeznkt.supabase.co/rest/v1"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdGVjdnZ2dGxiZXp5YmV6bmt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM5ODI4NywiZXhwIjoyMDg1OTc0Mjg3fQ.a-jIxfZ1Z0MjKu7KImDQrcoLMCyqyLGOFcOYvG7cggA"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

def get_latest_historial():
    params = {
        "tipo": "eq.Baloto",
        "order": "fecha.desc",
        "limit": 1
    }
    resp = requests.get(f"{url}/historial", headers=headers, params=params)
    return resp.json()

def get_latest_real_rendimiento():
    # Join with juegos where estrategia = 'real'
    params = {
        "select": "aciertos_principales,acierto_superbalota,created_at,juegos!inner(estrategia,fecha_sorteo,num1,num2,num3,num4,num5,num6)",
        "juegos.estrategia": "eq.real",
        "order": "created_at.desc",
        "limit": 5
    }
    resp = requests.get(f"{url}/rendimiento", headers=headers, params=params)
    return resp.json()

def get_latest_real_juegos():
    params = {
        "estrategia": "eq.real",
        "order": "fecha_sorteo.desc",
        "limit": 5
    }
    resp = requests.get(f"{url}/juegos", headers=headers, params=params)
    return resp.json()

if __name__ == "__main__":
    print("--- ULTIMO HISTORIAL ---")
    print(json.dumps(get_latest_historial(), indent=2))
    print("\n--- ULTIMOS RENDIMIENTOS REAL ---")
    print(json.dumps(get_latest_real_rendimiento(), indent=2))
    print("\n--- ULTIMOS JUEGOS REAL ---")
    print(json.dumps(get_latest_real_juegos(), indent=2))
