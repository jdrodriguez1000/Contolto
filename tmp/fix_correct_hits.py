import requests
import json
from datetime import datetime

url = "https://bftecvvvtlbezybeznkt.supabase.co/rest/v1"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdGVjdnZ2dGxiZXp5YmV6bmt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM5ODI4NywiZXhwIjoyMDg1OTc0Ijg3fQ.a-jIxfZ1Z0MjKu7KImDQrcoLMCyqyLGOFcOYvG7cggA"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

def fix_qualification_38008():
    # 1. Delete existing wrong record
    requests.delete(f"{url}/rendimiento?juego_id=eq.38008", headers=headers)
    
    # 2. Get correct Baloto winner for 2026-04-04
    winner = requests.get(f"{url}/historial?fecha=eq.2026-04-04&tipo=eq.Baloto", headers=headers).json()[0]
    
    # 3. Get the game
    game = requests.get(f"{url}/juegos?id=eq.38008", headers=headers).json()[0]
    
    # 4. Correct Match
    win_nums = {winner['num1'], winner['num2'], winner['num3'], winner['num4'], winner['num5']}
    play_nums = {game['num1'], game['num2'], game['num3'], game['num4'], game['num5']}
    aciertos = len(play_nums.intersection(win_nums))
    sb = (game['num6'] == winner['num6'])
    
    # 5. Insert CORRECT record
    payload = {
        "juego_id": 38008,
        "aciertos_principales": aciertos,
        "acierto_superbalota": sb,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    resp = requests.post(f"{url}/rendimiento", headers=headers, json=payload)
    return f"CORREGIDO: ID 38008 ahora tiene {aciertos} aciertos."

if __name__ == "__main__":
    print(fix_qualification_38008())
