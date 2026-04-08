from core_v2.db_provider import DBProvider
db = DBProvider()
h = db.supabase.table('historial').select('fecha').eq('id', 1128).execute().data[0]
j = db.supabase.table('juegos').select('fecha_sorteo').eq('id', 38008).execute().data[0]
val_h = h['fecha']
val_j = j['fecha_sorteo']
print(f"HISTORIAL DATE: '{val_h}' (len: {len(str(val_h))}) type: {type(val_h)}")
print(f"JUEGO DATE:     '{val_j}' (len: {len(str(val_j))}) type: {type(val_j)}")
print(f"MATCH? {val_h == val_j}")
if val_h != val_j:
    print(f"DIFF: '{val_h.strip()}' == '{val_j.strip()}': {val_h.strip() == val_j.strip()}")
