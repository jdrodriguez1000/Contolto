import React from 'react';
import { Sparkles, Download } from 'lucide-react';

interface HeaderProps {
  data?: any;
}

export default function Header({ data }: HeaderProps) {
  const handleExport = () => {
    if (!data) return;
    
    // Filtramos funciones del objeto (como setSelectedCompanionNum) antes de exportar
    const exportableData = Object.keys(data).reduce((acc: any, key) => {
      if (typeof data[key] !== 'function') {
        acc[key] = data[key];
      }
      return acc;
    }, {});

    const blob = new Blob([JSON.stringify(exportableData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contolto_analisis_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <header className="header animate-in" style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      width: '100%',
      marginBottom: '1.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Sparkles style={{ color: '#fbbf24' }} size={32} />
        <h1 style={{ letterSpacing: '-0.04em', fontWeight: '900', fontSize: '2.2rem', margin: 0 }}>
          CONTOLTO <span style={{ color: '#fbbf24', textShadow: '0 0 15px rgba(251, 191, 36, 0.3)' }}>PROFESIONAL</span>
        </h1>
      </div>

      {data && (
        <button 
          onClick={handleExport}
          title="Exportar análisis completo a JSON"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.6rem', 
            padding: '0.6rem 1rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '0.75rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
          }}
        >
          <Download size={14} /> 
          <span style={{ opacity: 0.9 }}>Exportar Datos</span>
        </button>
      )}
    </header>
  );
}
