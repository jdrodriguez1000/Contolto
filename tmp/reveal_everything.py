import requests
url = "https://bftecvvvtlbezybeznkt.supabase.co/rest/v1"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdGVjdnZ2dGxiZXp5YmV6bmt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM5ODI4NywiZXhwIjoyMDg1OTc0Ijg3fQ.a-jIxfZ1Z0MjKu7KImDQrcoLMCyqyLGOFcOYvG7cggA"
headers = {"apikey": key, "Authorization": f"Bearer {key}"}
# Check historical for 2026-04-04 - NO FILTERS
resp = requests.get(f"{url}/historial?fecha=eq.2026-04-04", headers=headers).json()
print("DATOS DEL 4 DE ABRIL EN HISTORIAL:")
for i, h in enumerate(resp):
    print(f"[{i}] Tipo: '{h['tipo']}', Numeros: {h['num1']},{h['num2']},{h['num3']},{h['num4']},{h['num5']} SB: {h['num6']}")
