import requests
import json

url = "https://bftecvvvtlbezybeznkt.supabase.co/rest/v1"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdGVjdnZ2dGxiZXp5YmV6bmt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM5ODI4NywiZXhwIjoyMDg1OTc0Mjg3fQ.a-jIxfZ1Z0MjKu7KImDQrcoLMCyqyLGOFcOYvG7cggA"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

def check_historial():
    resp = requests.get(f"{url}/historial?order=fecha.desc&limit=5", headers=headers).json()
    print("Últimos 5 registros en HISTORIAL:")
    for h in resp:
        print(f"- Fecha: {h['fecha']}, Numeros: {h['num1']},{h['num2']},{h['num3']},{h['num4']},{h['num5']} | SB: {h['num6']}")

if __name__ == "__main__":
    check_historial()
