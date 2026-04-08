import requests
url = "https://bftecvvvtlbezybeznkt.supabase.co/rest/v1"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdGVjdnZ2dGxiZXp5YmV6bmt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM5ODI4NywiZXhwIjoyMDg1OTc0Mjg3fQ.a-jIxfZ1Z0MjKu7KImDQrcoLMCyqyLGOFcOYvG7cggA"
headers = {"apikey": key, "Authorization": f"Bearer {key}"}
w = requests.get(f"{url}/historial?fecha=eq.2026-04-04", headers=headers).json()
for h in w:
    print(f"[{h['tipo']}] {h['num1']},{h['num2']},{h['num3']},{h['num4']},{h['num5']} | {h['num6']}")
    
j = requests.get(f"{url}/juegos?id=eq.38008", headers=headers).json()[0]
print(f"Juego [Real]: {j['num1']},{j['num2']},{j['num3']},{j['num4']},{j['num5']} | {j['num6']}")
