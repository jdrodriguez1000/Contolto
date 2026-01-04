from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os
import pandas as pd
from typing import List, Optional

# Add parent directory to sys.path to import existing modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import existing logic
# Note: We import functions, not just run the scripts
import new_game
import historical
import successes

app = FastAPI(title="Baloto API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class GameRequest(BaseModel):
    date: str # DD-MM-YYYY
    game_type: str = "Baloto" # "Baloto" or "Revancha"

class GameResponse(BaseModel):
    num1: int
    num2: int
    num3: int
    num4: int
    num5: int
    num6: int
    fecha_juego: str

class HistoryResponse(BaseModel):
    tipo: str
    fecha: str
    num1: int
    num2: int
    num3: int
    num4: int
    num5: int
    num6: int

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"message": "Baloto API is running"}

@app.get("/history", response_model=List[HistoryResponse])
def get_history():
    """Returns the full history of games."""
    try:
        data, _ = historical.cargar_historico_desde_csv(historical.HISTORICO_CSV_FILE)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/update-history")
def update_history_endpoint():
    """Triggers the scraping process to update history."""
    try:
        # Re-use logic from historical.py main block
        local_historico_list, _ = historical.cargar_historico_desde_csv(historical.HISTORICO_CSV_FILE)
        
        ultima_fecha_local = None
        if local_historico_list:
            try:
                ultima_fecha_local = historical.parse_baloto_date(local_historico_list[0]['fecha'])
            except ValueError:
                ultima_fecha_local = None

        url_base = "https://www.baloto.com/resultados"
        nuevos, _ = historical.obtener_nuevos_resultados_baloto_incremental(url_base, ultima_fecha_local, historical.ULTIMA_PAGINA_CON_DATOS)
        
        if nuevos:
            # Merge logic
            current_local_combinations_set = set()
            for sorteo in local_historico_list:
                nums = sorted([sorteo['num1'], sorteo['num2'], sorteo['num3'], sorteo['num4'], sorteo['num5']])
                sb = sorteo['num6']
                combinacion_str = "-".join(map(str, nums)) + f"-{sb}"
                current_local_combinations_set.add(combinacion_str)

            sorteos_para_agregar = []
            for nuevo in nuevos:
                nums = sorted([nuevo['num1'], nuevo['num2'], nuevo['num3'], nuevo['num4'], nuevo['num5']])
                sb = nuevo['num6']
                combinacion_str = "-".join(map(str, nums)) + f"-{sb}"
                if combinacion_str not in current_local_combinations_set:
                    sorteos_para_agregar.append(nuevo)
            
            final_list = sorteos_para_agregar + local_historico_list
            final_list.sort(key=lambda x: historical.parse_baloto_date(x['fecha']), reverse=True)
            historical.guardar_historico_en_csv(historical.HISTORICO_CSV_FILE, final_list)
            return {"message": f"Updated with {len(sorteos_para_agregar)} new games."}
        else:
            return {"message": "No new games found. History is up to date."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate", response_model=GameResponse)
def generate_game(request: GameRequest):
    """Generates a new optimized game."""
    try:
        # Parse date
        try:
            fecha_dt = new_game.parse_input_date(request.date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use DD-MM-YYYY")

        # Load data needed for generation
        # Note: new_game.JUEGO_SELECCIONADO is a global, we might need to patch it or pass it if possible.
        # The functions in new_game take arguments, so we can pass data.
        
        # 1. Load history
        hist_comb, hist_nums, sb_dates, hist_unsorted = new_game.cargar_historico_para_analisis_y_unicidad(
            new_game.HISTORICO_CSV_FILE, request.game_type
        )
        
        # 2. Quartiles
        quartiles = new_game.calcular_cuartiles_historicos(hist_nums)
        
        # 3. Superbalota stats
        last_dates_sb, avg_days_sb = new_game.calcular_promedios_repeticion_superbalotas(sb_dates)
        
        # 4. Proximity scores
        prox_scores_main = new_game.calcular_puntajes_proximidad(
            hist_unsorted, 
            new_game.NUM_MIN_PRINCIPALES, 
            new_game.NUM_MAX_PRINCIPALES, 
            new_game.PROXIMIDAD_RANGES
        )
        
        sb_winners = [sb for _, sb in sb_dates]
        prox_scores_sb = new_game.calcular_puntajes_proximidad(
            [sb_winners], 
            new_game.NUM_MIN_SUPERBALOTA, 
            new_game.NUM_MAX_SUPERBALOTA, 
            new_game.PROXIMIDAD_RANGES
        )

        # 5. Generate
        nuevo_juego = new_game.generar_nueva_combinacion_unica(
            fecha_dt, hist_comb, quartiles, last_dates_sb, avg_days_sb, prox_scores_main, prox_scores_sb
        )

        if nuevo_juego:
            # Save to history
            new_game.guardar_juego_generado_en_historial(request.date, nuevo_juego)
            
            # Return response
            return {
                **nuevo_juego,
                "fecha_juego": request.date
            }
        else:
            raise HTTPException(status_code=400, detail="Could not generate a unique optimized game after max attempts.")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/check-success")
def check_success():
    """Checks the latest generated game against official results."""
    try:
        result = successes.obtener_resultados_verificacion()
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
