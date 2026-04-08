
import os
from core_v2.game_generator import GameGenerator

def test_real():
    try:
        gen = GameGenerator()
        print("Initialising GameGenerator...")
        nums = gen.generate_real()
        print(f"Generated Numbers (Real): {nums}")
        sb = gen.select_superballot()
        print(f"Generated SB (Real): {sb}")
        
        juego = {
            "fecha_sorteo": gen.get_next_draw_date(),
            "estrategia": "real",
            "num1": nums[0],
            "num2": nums[1],
            "num3": nums[2],
            "num4": nums[3],
            "num5": nums[4],
            "num6": sb
        }
        print(f"Full game object: {juego}")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_real()
