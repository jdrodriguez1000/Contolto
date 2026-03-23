import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function POST() {
  try {
    // Ruta al script main.py desde el directorio raíz del proyecto
    const projectRoot = path.resolve(process.cwd(), '..', '..');
    const pythonScript = path.resolve(projectRoot, 'main.py');

    console.log('[REGENERATE] Iniciando regeneración de números');
    console.log('[REGENERATE] Project root:', projectRoot);
    console.log('[REGENERATE] Python script:', pythonScript);

    try {
      // Intentar con python3 primero, luego python
      let result;
      try {
        result = await execFileAsync('python3', [pythonScript], {
          cwd: projectRoot,
          timeout: 60000,
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        });
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          // python3 no encontrado, intentar python
          result = await execFileAsync('python', [pythonScript], {
            cwd: projectRoot,
            timeout: 60000,
            maxBuffer: 10 * 1024 * 1024
          });
        } else {
          throw err;
        }
      }

      console.log('[REGENERATE] Script completado exitosamente');
      console.log('[REGENERATE] Output:', result.stdout.substring(0, 500));

      return NextResponse.json({
        success: true,
        message: 'Números regenerados exitosamente',
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('[REGENERATE] Error ejecutando script:', error.message);
      console.error('[REGENERATE] Stderr:', error.stderr);
      console.error('[REGENERATE] Stdout:', error.stdout);

      return NextResponse.json({
        success: false,
        message: 'Error al regenerar números',
        error: error.message || String(error),
        details: error.stderr || error.stdout
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[REGENERATE] Error interno:', error.message);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message || String(error)
    }, { status: 500 });
  }
}
