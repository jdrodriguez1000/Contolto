import requests
import json

url = "https://bftecvvvtlbezybeznkt.supabase.co/rest/v1"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdGVjdnZ2dGxiZXp5YmV6bmt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM5ODI4NywiZXhwIjoyMDg1OTc0Mjg3fQ.a-jIxfZ1Z0MjKu7KImDQrcoLMCyqyLGOFcOYvG7cggA"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

def check_data():
    # 1. Latest Historial
    h = requests.get(f"{url}/historial?tipo=eq.Baloto&order=fecha.desc&limit=1", headers=headers).json()
    print(f"Ultimo Sorteo: {h[0]['fecha'] if h else 'N/A'}")

    # 2. Latest Real Rendimiento
    r = requests.get(f"{url}/rendimiento?select=aciertos_principales,acierto_superbalota,created_at,juegos!inner(estrategia,fecha_sorteo)&juegos.estrategia=eq.real&order=created_at.desc&limit=5", headers=headers).json()
    print("\nUltimos Rendimientos REAL:")
    for item in r:
        j = item['juegos']
        print(f"Sorteo: {j['fecha_sorteo']}, Creado: {item['created_at']}, Aciertos: {item['aciertos_principales']}")

    # 3. Latest Real Juegos (even without rendimiento)
    j = requests.get(f"{url}/juegos?estrategia=eq.real&order=fecha_sorteo.desc&limit=5", headers=headers).json()
    print("\nUltimos Juegos REAL (en tabla juegos):")
    for item in j:
        print(f"Sorteo: {item['fecha_sorteo']}, Creado: {item['created_at']}, Estrategia: {item['estrategia']}")

if __name__ == "__main__":
    check_data()
