import React from 'react';
import { Settings } from 'lucide-react';

interface NumberSelectorProps {
  selectedNumber: number | null;
  onSelect: (num: number) => void;
}

const NumberSelector: React.FC<NumberSelectorProps> = ({ selectedNumber, onSelect }) => {
  return (
    <article className="card" style={{ padding: '1rem 1.5rem', marginBottom: '1.25rem', borderBottom: '2px solid rgba(251, 191, 36, 0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
          <Settings size={18} style={{ color: '#fbbf24' }} /> SELECTOR DE NÚCLEO PARA ANÁLISIS
        </div>
        <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Selecciona un número para ver sus conexiones y clusters</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: '6px' }}>
        {Array.from({ length: 43 }, (_, i) => i + 1).map(n => (
          <div 
            key={n}
            onClick={() => onSelect(n)}
            style={{
              padding: '8px 0', fontSize: '0.8rem', textAlign: 'center', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
              background: selectedNumber === n ? '#fbbf24' : 'rgba(255,255,255,0.03)',
              color: selectedNumber === n ? '#000' : '#fff',
              border: '1px solid rgba(255,255,255,0.05)', 
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: selectedNumber === n ? '0 0 15px rgba(251, 191, 36, 0.3)' : 'none',
              transform: selectedNumber === n ? 'scale(1.05)' : 'none'
            }}
          >
            {n}
          </div>
        ))}
      </div>
    </article>
  );
};

export default NumberSelector;
