import requests
import json

url = "https://bftecvvvtlbezybeznkt.supabase.co/rest/v1"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdGVjdnZ2dGxiZXp5YmV6bmt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM5ODI4NywiZXhwIjoyMDg1OTc0Mjg3fQ.a-jIxfZ1Z0MjKu7KImDQrcoLMCyqyLGOFcOYvG7cggA"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

def check_games_for_date(date):
    resp = requests.get(f"{url}/juegos?fecha_sorteo=eq.{date}", headers=headers)
    games = resp.json()
    print(f"\nJuegos para la fecha {date}: {len(games)}")
    strats = {}
    for g in games:
        e = g['estrategia']
        strats[e] = strats.get(e, 0) + 1
    print(f"Estrategias: {strats}")

if __name__ == "__main__":
    check_games_for_date("2026-04-04")
    check_games_for_date("2026-04-01")
