import React from 'react';
import { Share2 } from 'lucide-react';

interface ClusterConfluenceCircleProps {
  selectedNumber: number | null;
  onSelect: (num: number) => void;
  affinityLinks: any[];
  clusterFriends: number[];
}

const ClusterConfluenceCircle: React.FC<ClusterConfluenceCircleProps> = ({ 
  selectedNumber, 
  onSelect, 
  affinityLinks, 
  clusterFriends 
}) => {
  const radius = 260;
  const cx = 300;
  const cy = 300;

  return (
    <article className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
      
      <div className="card-title" style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Share2 size={18} style={{ color: '#3b82f6' }} /> RED DE AFINIDAD CRONOLÓGICA
        </div>
        <div style={{ fontSize: '0.7rem', opacity: 0.6, background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px' }}>
          Afinidad {'>='} 3 hits
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '450px' }}>
        <svg viewBox="0 0 600 600" style={{ width: '100%', maxWidth: '560px', height: 'auto' }}>
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Enlaces base (todos los >= 3) */}
          {affinityLinks.map((link) => {
            const angleA = (link.a - 1) * (360 / 43) * (Math.PI / 180) - Math.PI / 2;
            const angleB = (link.b - 1) * (360 / 43) * (Math.PI / 180) - Math.PI / 2;
            const x1 = cx + radius * Math.cos(angleA), y1 = cy + radius * Math.sin(angleA);
            const x2 = cx + radius * Math.cos(angleB), y2 = cy + radius * Math.sin(angleB);
            
            return (
              <line 
                key={`${link.a}-${link.b}`} 
                x1={x1} y1={y1} x2={x2} y2={y2} 
                stroke="rgba(255,255,255,0.04)" 
                strokeWidth={1}
              />
            );
          })}

          {/* Enlaces (Links) Activos - Encima de los grises */}
          {affinityLinks.map((link) => {
            const angleA = (link.a - 1) * (360 / 43) * (Math.PI / 180) - Math.PI / 2;
            const angleB = (link.b - 1) * (360 / 43) * (Math.PI / 180) - Math.PI / 2;
            const x1 = cx + radius * Math.cos(angleA), y1 = cy + radius * Math.sin(angleA);
            const x2 = cx + radius * Math.cos(angleB), y2 = cy + radius * Math.sin(angleB);
            const isActive = selectedNumber === link.a || selectedNumber === link.b;
            
            return isActive && (
              <line 
                key={`${link.a}-${link.b}-active`} 
                x1={x1} y1={y1} x2={x2} y2={y2} 
                stroke="#fbbf24" 
                strokeWidth={2.5}
                style={{ transition: 'all 0.4s ease', filter: 'url(#glow)', opacity: 0.7 }} 
              />
            );
          })}
          
          {/* Nodos (Círculos) */}
          {Array.from({ length: 43 }, (_, i) => i + 1).map(n => {
             const angle = (n - 1) * (360 / 43) * (Math.PI / 180) - Math.PI / 2;
             const x = cx + radius * Math.cos(angle), y = cy + radius * Math.sin(angle);
             const isSelected = selectedNumber === n;
             const isFriend = clusterFriends.includes(n);

             return (
               <g key={n} style={{ cursor: 'pointer' }} onClick={() => onSelect(n)}>
                  {isSelected && <circle cx={x} cy={y} r={22} fill="rgba(251, 191, 36, 0.15)" className="animate-pulse" />}
                  <circle 
                    cx={x} cy={y} 
                    r={isSelected ? 15 : (isFriend ? 12 : 9)} 
                    fill={isSelected ? '#fbbf24' : (isFriend ? '#3b82f6' : '#0f172a')} 
                    stroke={isSelected ? '#fff' : (isFriend ? 'rgba(59, 130, 246, 0.6)' : 'rgba(255,255,255,0.2)')} 
                    strokeWidth={isSelected ? 3 : 1.5} 
                    style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} 
                  />
                  <text 
                    x={x} y={y + 4} 
                    textAnchor="middle" 
                    fontSize={isSelected ? '10' : '8'} 
                    fontWeight="bold" 
                    fill={isSelected ? '#000' : '#fff'} 
                    style={{ pointerEvents: 'none' }}
                  >
                    {n}
                  </text>
               </g>
             );
          })}
        </svg>
        
        <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <div style={{ fontSize: '0.6rem', opacity: 0.3, textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '-5px' }}>Fuerzas de</div>
          <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'rgba(255,255,255,0.03)', letterSpacing: '4px' }}>CONFLUENCIA</div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.65rem', opacity: 0.6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24' }} /> Seleccionado
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} /> Mejores Amigos
        </div>
      </div>
    </article>
  );
};

export default ClusterConfluenceCircle;
