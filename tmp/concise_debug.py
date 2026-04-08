import requests
url = "https://bftecvvvtlbezybeznkt.supabase.co/rest/v1"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdGVjdnZ2dGxiZXp5YmV6bmt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM5ODI4NywiZXhwIjoyMDg1OTc0Mjg3fQ.a-jIxfZ1Z0MjKu7KImDQrcoLMCyqyLGOFcOYvG7cggA"
headers = {"apikey": key, "Authorization": f"Bearer {key}"}
g = requests.get(f"{url}/juegos?id=eq.38008", headers=headers).json()[0]
print(f"Juego: {g['fecha_sorteo']}, Tipo: {g.get('tipo', 'None')}")
w = requests.get(f"{url}/historial?fecha=eq.{g['fecha_sorteo']}", headers=headers).json()
for i in w: print(f"Ganador: {i['tipo']}, Fecha: {i['fecha']}")
