import requests
from datetime import datetime

url = 'https://bftecvvvtlbezybeznkt.supabase.co/rest/v1'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdGVjdnZ2dGxiZXp5YmV6bmt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM5ODI4NywiZXhwIjoyMDg1OTc0Mjg3fQ.a-jIxfZ1Z0MjKu7KImDQrcoLMCyqyLGOFcOYvG7cggA'
headers = {'apikey': key, 'Authorization': f'Bearer {key}'}

# 1. Obtenemos juegos pendientes
juegos = requests.get(f'{url}/juegos?id=eq.38008', headers=headers).json()
# 2. Obtenemos el historial de esa fecha
historial = requests.get(f'{url}/historial?fecha=eq.2026-04-04', headers=headers).json()

print(f"--- DEBUG DE CALIFICACIÓN (4 ABRIL) ---")
print(f"Juego Real (ID {juegos[0]['id']}):")
j = juegos[0]
print(f" - Fecha Sorteo: '{j['fecha_sorteo']}'")
print(f" - Tipo: '{j['tipo']}'")
print(f" - Números: {j['num1']},{j['num2']},{j['num3']},{j['num4']},{j['num5']} (SB: {j['num6']})")

print(f"\nHistorial Encontrado:")
for h in historial:
    f_norm = str(h['fecha']).split('T')[0].split(' ')[0].strip()
    print(f" - ID: {h['id']} | Fecha: '{h['fecha']}' (Norm: '{f_norm}') | Tipo: '{h['tipo']}'")
    print(f" - Números: {h['num1']},{h['num2']},{h['num3']},{h['num4']},{h['num5']} (SB: {h['num6']})")
