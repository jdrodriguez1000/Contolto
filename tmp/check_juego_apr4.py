import requests
import json

url = "https://bftecvvvtlbezybeznkt.supabase.co/rest/v1"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdGVjdnZ2dGxiZXp5YmV6bmt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM5ODI4NywiZXhwIjoyMDg1OTc0Mjg3fQ.a-jIxfZ1Z0MjKu7KImDQrcoLMCyqyLGOFcOYvG7cggA"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

def check_juego_apr4():
    resp = requests.get(f"{url}/juegos?fecha_sorteo=eq.2026-04-04&estrategia=eq.real", headers=headers)
    data = resp.json()
    print(f"Encontrados {len(data)} juegos REAL para 2026-04-04:")
    for g in data:
        print(f"Juego ID: {g['id']}, Numbers: {g['num1']},{g['num2']},{g['num3']},{g['num4']},{g['num5']} S:{g['num6']}")

if __name__ == "__main__":
    check_juego_apr4()
