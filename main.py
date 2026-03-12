
from core_v2.update_results import ResultsUpdater
from core_v2.performance_report import PerformanceReporter
from core_v2.game_generator import GameGenerator
import sys
import io

def main():
    print("==========================================================")
    print("🚀 INICIANDO EL FLUJO COMPLETO DE CONTOLTO v2")
    print("==========================================================")
    
    # 1. Actualización de resultados y calificación de jugadas anteriores
    print("\n[PASO 1] 🔄 Actualizando historial y calificando aciertos...")
    try:
        updater = ResultsUpdater()
        updater.run()
        print("✅ Paso 1 completado.")
    except Exception as e:
        print(f"❌ Error en el Paso 1: {e}")
        return

    # 2. Generación del reporte de rendimiento (Ranking)
    print("\n[PASO 2] 📊 Generando reporte detallado de rendimiento...")
    try:
        reporter = PerformanceReporter()
        reporter.generate_report()
        print("✅ Paso 2 completado.")
    except Exception as e:
        print(f"❌ Error en el Paso 2: {e}")
        return

    # 3. Generación de nuevas jugadas para el próximo sorteo
    print("\n[PASO 3] 🎲 Generando nuevas jugadas para el próximo sorteo...")
    try:
        generator = GameGenerator()
        generator.generate_all_and_save(save_to_db=True)
        print("✅ Paso 3 completado.")
    except Exception as e:
        print(f"❌ Error en el Paso 3: {e}")
        return

    print("\n" + "=" * 58)
    print("✨ TODO EL PROCESO SE HA COMPLETADO CON ÉXITO ✨")
    print("==========================================================")

if __name__ == "__main__":
    main()
