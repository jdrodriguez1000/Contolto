
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

        # 1. Obtener los últimos registros de rendimiento 
        # (Mostramos un resumen por estrategia del último sorteo)
        rendimiento_data = self.db.supabase.table("rendimiento")\
            .select("*, juegos(*)")\
            .order("created_at", desc=True)\
            .limit(10000)\
            .execute().data

        if not rendimiento_data:
            smart_print("(!) No hay datos de rendimiento calificados aun.")
            return

        # Agrupar por fecha y estrategia para el resumen
        resumen_sorteo = {}
        for ref in rendimiento_data:
            juego = ref.get('juegos')
            if not juego: continue
            fecha = juego['fecha_sorteo']
            est = juego['estrategia']
            
            key = (fecha, est)
            if key not in resumen_sorteo:
                resumen_sorteo[key] = {"total": 0, "hits": 0, "sb": 0}
            
            resumen_sorteo[key]["total"] += 1
            resumen_sorteo[key]["hits"] += ref['aciertos_principales']
            if ref['acierto_superbalota']:
                resumen_sorteo[key]["sb"] += 1

        header = f"{'FECHA':<12} | {'ESTRATEGIA':<12} | {'TOTAL JUEGOS':<14} | {'PROM. ACIERTOS':<15} | {'SB GANADAS'}"
        smart_print(header)
        smart_print("-" * 80)

        # Mostrar solo los sorteos más recientes (agrupados)
        sorted_keys = sorted(resumen_sorteo.keys(), reverse=True)[:15]
        for key in sorted_keys:
            fecha, est = key
            data = resumen_sorteo[key]
            avg = (data["hits"] + data["sb"]) / data["total"]
            linea = f"{fecha:<12} | {est.upper():<12} | {data['total']:<14} | {avg:<15.2f} | {data['sb']}"
            smart_print(linea)

        # 2. Ranking de Estrategias
        smart_print("\n" + "=" * 90)
        smart_print("[ RANKING DE ESTRATEGIAS - ALL TIME ]")
        smart_print("-" * 90)
        
        all_perf = []
        from_idx = 0
        to_idx = 999
        has_more = True
        
        while has_more:
            batch = self.db.supabase.table("rendimiento").select("*, juegos(estrategia)").range(from_idx, to_idx).execute().data
            if batch:
                all_perf.extend(batch)
                from_idx += 1000
                to_idx += 1000
                if len(batch) < 1000:
                    has_more = False
            else:
                has_more = False

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
        
        sorted_ranking = sorted(ranking.items(), key=lambda x: (x[1]["sum_aciertos"] + x[1]["sb"]) / x[1]["total"] if x[1]["total"] > 0 else 0, reverse=True)

        for est, data in sorted_ranking:
            avg = (data["sum_aciertos"] + data["sb"]) / data["total"]
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
