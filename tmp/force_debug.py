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

def force_debug_38008():
    # 1. Get the game
    game = requests.get(f"{url}/juegos?id=eq.38008", headers=headers).json()[0]
    date_game = game['fecha_sorteo']
    tipo_game = game.get('tipo', 'No especificado')
    print(f"JUEGO ID 38008: Fecha={date_game}, Tipo={tipo_game}")
    
    # 2. Get the winner for that date
    winner_res = requests.get(f"{url}/historial?fecha=eq.{date_game}", headers=headers).json()
    if not winner_res:
        print(f"ERROR: No se encontró ganador en historial para la fecha {date_game}")
        return
    
    print(f"Encontrados {len(winner_res)} ganadores para esa fecha:")
    for w in winner_res:
        print(f" - Tipo: {w['tipo']}, Numeros: {w['num1']},{w['num2']},{w['num3']},{w['num4']},{w['num5']} S:{w['num6']}")
        
    # 3. Simulate match
    # we take the first winner if not specified
    winner = None
    if tipo_game.lower() != 'no especificado':
        for w in winner_res:
            if w['tipo'].lower() == tipo_game.lower():
                winner = w
                break
    
    if not winner:
        winner = winner_res[0] # Fallback
    
    print(f"SIMULACIÓN: Comparando contra ganador tipo {winner['tipo']}")
    
if __name__ == "__main__":
    force_debug_38008()
