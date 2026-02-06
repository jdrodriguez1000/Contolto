
import os
import sys
import io
from datetime import datetime
from core_v2.db_provider import DBProvider

# Configurar salida para evitar errores de encoding en Windows
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

class PerformanceReporter:
    def __init__(self):
        self.db = DBProvider()
        self.report_path = os.path.join("reports", "performance_history_report.txt")

    def generate_report(self):
        output = io.StringIO()
        
        def smart_print(text=""):
            # Imprime a la consola
            print(text)
            # Acumula para el archivo
            output.write(text + "\n")

        smart_print("\n[ REPORTE DETALLADO DE RENDIMIENTO - CONTOLTO v2 ]")
        smart_print("=" * 90)

        # 1. Obtener los últimos 15 registros de rendimiento calificados
        rendimiento_data = self.db.supabase.table("rendimiento")\
            .select("*, juegos(*)")\
            .order("created_at", desc=True)\
            .limit(15)\
            .execute().data

        if not rendimiento_data:
            smart_print("(!) No hay datos de rendimiento calificados aun.")
            return

        # Obtener todas las fechas únicas para traer el historial de una sola vez
        fechas = list(set([r['juegos']['fecha_sorteo'] for r in rendimiento_data if r.get('juegos')]))
        historial_raw = self.db.supabase.table("historial")\
            .select("*")\
            .in_("fecha", fechas)\
            .execute().data
        
        # Mapear historial por fecha para acceso rápido
        historial_map = {h['fecha']: h for h in historial_raw}

        header = f"{'FECHA':<12} | {'ESTRATEGIA':<12} | {'S.B':<3} | {'JUGADA (N1-N5 + SB)':<22} | {'GANADORA (N1-N5 + SB)':<22} | {'ACIERTOS'}"
        smart_print(header)
        smart_print("-" * 110)

        for ref in rendimiento_data:
            juego = ref.get('juegos', {})
            if not juego: continue
            
            fecha = juego.get('fecha_sorteo', 'N/A')
            estrategia = juego.get('estrategia', 'N/A').upper()
            num_jugados = [juego[f'num{i}'] for i in range(1, 6)]
            sb_jugada = juego['num6']
            
            ganador = historial_map.get(fecha)
            if not ganador:
                continue

            num_ganadores = [ganador[f'num{i}'] for i in range(1, 6)]
            sb_ganadora = ganador['num6']
            
            # Identificar coincidencias
            coincidencias = set(num_jugados).intersection(set(num_ganadores))
            matches_str = ",".join(map(str, sorted(list(coincidencias)))) if coincidencias else "Ninguno"
            acierto_sb = "OK" if sb_jugada == sb_ganadora else "NO"
            
            # Formateo de jugada y ganadora
            jugada_str = f"{num_jugados} + {sb_jugada}"
            ganadora_str = f"{num_ganadores} + {sb_ganadora}"
            
            aciertos_count = ref.get('aciertos_principales', 0)
            resumen_aciertos = f"{aciertos_count} (+SB)" if acierto_sb == "OK" else f"{aciertos_count}"
            
            linea = f"{fecha:<12} | {estrategia:<12} | {acierto_sb:<3} | {jugada_str:<22} | {ganadora_str:<22} | {resumen_aciertos:<8} (Coinciden: {matches_str})"
            smart_print(linea)

        # 2. Ranking de Estrategias
        smart_print("\n" + "=" * 90)
        smart_print("[ RANKING DE ESTRATEGIAS - ALL TIME ]")
        smart_print("-" * 90)
        
        all_perf = self.db.supabase.table("rendimiento").select("*, juegos(estrategia)").execute().data
        ranking = {}
        for p in all_perf:
            if not p.get('juegos'): continue
            est = p['juegos']['estrategia']
            if est not in ranking:
                ranking[est] = {"total": 0, "sum_aciertos": 0, "sb": 0}
            ranking[est]["total"] += 1
            ranking[est]["sum_aciertos"] += p['aciertos_principales']
            if p['acierto_superbalota']:
                ranking[est]["sb"] += 1
        
        sorted_ranking = sorted(ranking.items(), key=lambda x: x[1]["sum_aciertos"]/x[1]["total"] if x[1]["total"] > 0 else 0, reverse=True)

        for est, data in sorted_ranking:
            avg = data["sum_aciertos"] / data["total"]
            smart_print("%-12s | Promedio: %.2f | S.B. Ganadas: %d | Total Juegos: %d" % (est.upper(), avg, data['sb'], data['total']))

        smart_print("=" * 90)
        smart_print(f"Reporte generado el: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        smart_print("Nota: El reporte muestra cuales numeros especificos muerden la suerte.")

        # Guardar en archivo
        try:
            os.makedirs("reports", exist_ok=True)
            with open(self.report_path, "w", encoding="utf-8") as f:
                f.write(output.getvalue())
            print(f"\n[OK] Copia detallada guardada en: {self.report_path}")
        except Exception as e:
            print(f"\n[!] Error al guardar el archivo: {e}")

if __name__ == "__main__":
    reporter = PerformanceReporter()
    reporter.generate_report()
