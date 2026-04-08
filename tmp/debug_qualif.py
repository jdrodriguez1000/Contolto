from core_v2.update_results import ResultsUpdater
from core_v2.db_provider import DBProvider

def debug_qualification():
    updater = ResultsUpdater()
    db = DBProvider()
    ids = [665, 67506, 38008, 61434]
    
    print("--- DEBUG CALIFICACION ---")
    juegos = db.supabase.table('juegos').select('*').in_('id', ids).execute().data
    print(f"Juegos encontrados: {len(juegos)}")
    
    historial = db.supabase.table('historial').select('*').execute().data
    print(f"Registros en historial: {len(historial)}")
    
    performance_batch = []
    
    for j in juegos:
        id_juego = j['id']
        fecha = j['fecha_sorteo']
        tipo = j.get('tipo', 'Baloto') # Default to Baloto if missing
        
        winners = [h for h in historial if h['fecha'] == fecha]
        print(f"ID {id_juego} ({fecha}): {len(winners)} ganadores encontrados en historial")
        
        if not winners:
            print(f"  -> No hay ganadores para la fecha {fecha}")
            continue
            
        winner = None
        if tipo:
            for w in winners:
                if w['tipo'].lower() == (tipo.lower() if tipo else 'baloto'):
                    winner = w
                    break
        
        if not winner:
            winner = winners[0] # Fallback
            
        print(f"  -> Usando ganador ID {winner['id']} ({winner['tipo']})")
        
        # Comparación
        play_nums = [j['num1'], j['num2'], j['num3'], j['num4'], j['num5']]
        win_nums = [winner['num1'], winner['num2'], winner['num3'], winner['num4'], winner['num5']]
        
        matching = len(set(play_nums) & set(win_nums))
        sb_match = j['num6'] == winner['num6']
        
        print(f"  -> Resultado: {matching} aciertos + SB:{sb_match}")
        
        performance_batch.append({
            "juego_id": id_juego,
            "aciertos_principales": matching,
            "acierto_superbalota": sb_match
        })

    if performance_batch:
        print(f"\nIntentando insertar {len(performance_batch)} calificados...")
        try:
            res = db.supabase.table("rendimiento").insert(performance_batch).execute()
            print("SUCCESS: Insercion completada!")
        except Exception as e:
            print(f"ERROR en insercion: {e}")
    else:
        print("\nNo se generaron calificaciones.")

if __name__ == "__main__":
    debug_qualification()
