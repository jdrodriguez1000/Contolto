import React from 'react';
import { Trophy } from 'lucide-react';

interface ClusterAnalysisPanelProps {
  selectedNumber: number | null;
  analysis: {
    friends: number[];
    pairHits: Record<number, number>;
    combos: { combo3: number; combo4: number; combo5: number };
    totalWins: number;
    chemistry: { evens: number; odds: number; ranges: { r1: number; r2: number; r3: number; r4: number } };
    superballAffinities: { num: number; count: number }[];
  } | null;
}

const ClusterAnalysisPanel: React.FC<ClusterAnalysisPanelProps> = ({ selectedNumber, analysis }) => {
  return (
    <article className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #fbbf24', display: 'flex', flexDirection: 'column' }}>
      {selectedNumber && analysis ? (
        <div className="animate-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
             <div className="number-badge" style={{ width: '50px', height: '50px', fontSize: '1.4rem', background: 'transparent', borderColor: '#fbbf24', color: '#fbbf24', borderWidth: '2px' }}>{selectedNumber}</div>
             <div>
               <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' }}>ANÁLISIS DE CLUSTER</div>
               <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Número base + 4 acompañantes</div>
             </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.75rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trophy size={14} style={{ color: '#3b82f6' }} /> AFINIDAD DIRECTA (MEJORES AMIGOS)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
               {analysis.friends.map(n => (
                 <div key={n} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(59, 130, 246, 0.05)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                   <div className="number-badge" style={{ width: '26px', height: '26px', fontSize: '0.8rem', background: '#3b82f6', border: 'none' }}>{n}</div>
                   <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff' }}>{analysis.pairHits[n]} hits</div>
                 </div>
               ))}
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '1rem', opacity: 0.8 }}>RENDIMIENTO DEL COMBO (HISTÓRICO)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                 <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                   <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981' }}>{analysis.combos.combo3}</div>
                   <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>3 Hits</div>
                 </div>
                 <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                   <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#3b82f6' }}>{analysis.combos.combo4}</div>
                   <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>4 Hits</div>
                 </div>
                 <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(251, 191, 36, 0.08)', borderRadius: '10px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                   <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fbbf24' }}>{analysis.combos.combo5}</div>
                   <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>5 Hits</div>
                 </div>
              </div>
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{analysis.totalWins} premios totales acumulados</div>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '1rem', opacity: 0.8 }}>BALANCE QUÍMICO DEL GRUPO</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 2fr', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{analysis.chemistry.evens}P / {analysis.chemistry.odds}I</div>
                  <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>Pares/Impares</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem' }}>
                   {[{l:'R1',v:analysis.chemistry.ranges.r1},{l:'R2',v:analysis.chemistry.ranges.r2},{l:'R3',v:analysis.chemistry.ranges.r3},{l:'R4',v:analysis.chemistry.ranges.r4}].map(r => (
                     <div key={r.l} style={{ textAlign: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                       <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{r.v}</div>
                       <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>{r.l}</div>
                     </div>
                   ))}
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '1rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <Trophy size={14} style={{ color: '#f59e0b' }} /> TRINIDAD DE SUPERBALOTAS (AFINIDAD)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                 {analysis.superballAffinities.map((sb, i) => (
                   <div key={i} style={{ 
                     textAlign: 'center', padding: '0.75rem', background: 'rgba(245, 158, 11, 0.05)', 
                     borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.1)',
                     position: 'relative'
                   }}>
                     <div style={{ fontSize: '0.55rem', position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', background: '#1e293b', padding: '0 5px', color: '#f59e0b', fontWeight: 'bold', borderRadius: '4px' }}>
                       {i === 0 ? 'ESTELAR' : (i === 1 ? 'ALTA' : 'MEDIA')}
                     </div>
                     <div className="number-badge" style={{ margin: '0 auto 0.5rem', width: '32px', height: '32px', fontSize: '1rem', background: 'transparent', borderColor: '#f59e0b', color: '#f59e0b', borderWidth: '1.5px' }}>{sb.num}</div>
                     <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#fff' }}>{sb.count} hits</div>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '0.9rem', opacity: 0.3, textAlign: 'center', padding: '3rem' }}>
          Selecciona un número del selector superior para iniciar el análisis profundo de afinidades
        </div>
      )}
    </article>
  );
};

export default ClusterAnalysisPanel;
