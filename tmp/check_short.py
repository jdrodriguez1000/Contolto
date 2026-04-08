import requests
import json

url = "https://bftecvvvtlbezybeznkt.supabase.co/rest/v1"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdGVjdnZ2dGxiZXp5YmV6bmt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM5ODI4NywiZXhwIjoyMDg1OTc0Mjg3fQ.a-jIxfZ1Z0MjKu7KImDQrcoLMCyqyLGOFcOYvG7cggA"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

def check_short():
    params = {
        "select": "juegos!inner(fecha_sorteo,num1,num2,num3,num4,num5,num6)",
        "juegos.estrategia": "eq.real",
        "order": "created_at.desc",
        "limit": 5
    }
    r = requests.get(f"{url}/rendimiento", headers=headers, params=params).json()
    for item in r:
        j = item['juegos']
        print(f"Sorteo: {j['fecha_sorteo']} -> {j['num1']},{j['num2']},{j['num3']},{j['num4']},{j['num5']} S:{j['num6']}")

if __name__ == "__main__":
    check_short()
