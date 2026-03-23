import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST() {
  return new Promise((resolve) => {
    try {
      // Ruta al script main.py desde el directorio raíz del proyecto
      // En producción: /vercel/path0/main.py
      // En desarrollo: ruta relativa desde dashboard
      const projectRoot = path.resolve(process.cwd(), '..', '..');
      const pythonScript = path.resolve(projectRoot, 'main.py');

      // Ejecutar el script Python desde la raíz del proyecto
      const python = spawn('python', [pythonScript], {
        cwd: projectRoot,
        timeout: 60000 // 60 segundos timeout
      });

      let stdout = '';
      let stderr = '';

      python.stdout?.on('data', (data) => {
        stdout += data.toString();
        console.log(`[REGENERATE] ${data}`);
      });

      python.stderr?.on('data', (data) => {
        stderr += data.toString();
        console.error(`[REGENERATE ERROR] ${data}`);
      });

      python.on('close', (code) => {
        if (code === 0) {
          console.log('[REGENERATE] Script completado exitosamente');
          resolve(NextResponse.json({
            success: true,
            message: 'Números regenerados exitosamente',
            timestamp: new Date().toISOString()
          }));
        } else {
          console.error(`[REGENERATE] Script terminó con código ${code}`);
          resolve(NextResponse.json({
            success: false,
            message: `Error en la regeneración (código ${code})`,
            error: stderr
          }, { status: 500 }));
        }
      });

      python.on('error', (err) => {
        console.error('[REGENERATE] Error al ejecutar:', err);
        resolve(NextResponse.json({
          success: false,
          message: 'Error al ejecutar el script',
          error: err.message
        }, { status: 500 }));
      });

    } catch (error) {
      console.error('[REGENERATE] Error:', error);
      resolve(NextResponse.json({
        success: false,
        message: 'Error interno del servidor',
        error: String(error)
      }, { status: 500 }));
    }
  });
}
