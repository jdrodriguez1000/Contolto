import React from 'react';
import { Sparkles, Trophy } from 'lucide-react';

interface AffinityCardsProps {
  topPairs: any[];
  topTrios: any[];
}

const AffinityCards: React.FC<AffinityCardsProps> = ({ topPairs, topTrios }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
      <article className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
        <div className="card-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} style={{ color: '#10b981' }} /> PAREJAS DE ORO
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {topPairs.slice(0, 10).map((p, idx) => (
            <div key={idx} style={{ 
              padding: '0.6rem', background: 'rgba(16, 185, 129, 0.05)', 
              borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.1)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
               <div style={{ display: 'flex', gap: '0.4rem' }}>
                 {p.nums.map((n: number) => (
                   <span key={n} className="number-badge" style={{ width: '22px', height: '22px', fontSize: '0.7rem', background: '#10b981', color: '#fff', border: 'none' }}>{n}</span>
                 ))}
               </div>
               <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{p.count}v</div>
            </div>
          ))}
        </div>
      </article>

      <article className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #8b5cf6' }}>
        <div className="card-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Trophy size={18} style={{ color: '#8b5cf6' }} /> TRÍOS DE PODER
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {topTrios.slice(0, 5).map((t, idx) => (
            <div key={idx} style={{ 
              padding: '0.6rem', background: 'rgba(139, 92, 246, 0.05)', 
              borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.1)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
               <div style={{ display: 'flex', gap: '0.4rem' }}>
                 {t.nums.map((n: number) => (
                   <span key={n} className="number-badge" style={{ width: '22px', height: '22px', fontSize: '0.7rem', background: '#8b5cf6', color: '#fff', border: 'none' }}>{n}</span>
                 ))}
               </div>
               <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{t.count}v</div>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
};

export default AffinityCards;
