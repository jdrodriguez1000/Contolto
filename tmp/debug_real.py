import requests
import json

url = "https://bftecvvvtlbezybeznkt.supabase.co/rest/v1"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdGVjdnZ2dGxiZXp5YmV6bmt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM5ODI4NywiZXhwIjoyMDg1OTc0Mjg3fQ.a-jIxfZ1Z0MjKu7KImDQrcoLMCyqyLGOFcOYvG7cggA"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

def check_all_real():
    # Fetch latest 10 rendimientos joined with juegos for 'real' strategy
    params = {
        "select": "aciertos_principales,acierto_superbalota,created_at,juegos!inner(*)",
        "juegos.estrategia": "eq.real",
        "order": "created_at.desc",
        "limit": 10
    }
    resp = requests.get(f"{url}/rendimiento", headers=headers, params=params)
    data = resp.json()
    
    print(f"Encontrados {len(data)} registros REAL en rendimiento:")
    for i, r in enumerate(data):
        j = r['juegos']
        print(f"[{i}] Sorteo: {j['fecha_sorteo']}, Aciertos: {r['aciertos_principales']}, Numeros: {j['num1']},{j['num2']},{j['num3']},{j['num4']},{j['num5']} | SB: {j['num6']}")

if __name__ == "__main__":
    check_all_real()
