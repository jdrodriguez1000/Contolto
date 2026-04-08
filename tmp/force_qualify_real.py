import requests
import json
from datetime import datetime

url = "https://bftecvvvtlbezybeznkt.supabase.co/rest/v1"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdGVjdnZ2dGxiZXp5YmV6bmt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM5ODI4NywiZXhwIjoyMDg1OTc0Mjg3fQ.a-jIxfZ1Z0MjKu7KImDQrcoLMCyqyLGOFcOYvG7cggA"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

def force_qualify_one(juego_id):
    # 1. Get the game
    game = requests.get(f"{url}/juegos?id=eq.{juego_id}", headers=headers).json()[0]
    date = game['fecha_sorteo']
    
    # 2. Get the winner (we know it exists from my check)
    winner_res = requests.get(f"{url}/historial?fecha=eq.{date}", headers=headers).json()
    if not winner_res: return "No winner"
    winner = winner_res[0]
    
    # 3. Calculate hits
    win_nums = {winner['num1'], winner['num2'], winner['num3'], winner['num4'], winner['num5']}
    play_nums = {game['num1'], game['num2'], game['num3'], game['num4'], game['num5']}
    aciertos = len(play_nums.intersection(win_nums))
    sb = (game['num6'] == winner['num6'])
    
    # 4. Insert into rendimiento
    payload = {
        "juego_id": juego_id,
        "aciertos_principales": aciertos,
        "acierto_superbalota": sb,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    # Check if exists first to avoid duplication error
    exists = requests.get(f"{url}/rendimiento?juego_id=eq.{juego_id}", headers=headers).json()
    if exists:
        return "Already exists in rendimiento"
        
    resp = requests.post(f"{url}/rendimiento", headers=headers, json=payload)
    if resp.status_code in [201, 200, 204]:
        return f"SUCCESS: Qualified {juego_id} with {aciertos} hits"
    else:
        return f"FAILED: {resp.text}"

if __name__ == "__main__":
    print(force_qualify_one(38008))
