import React from 'react';
import { Zap, TrendingUp, ShieldCheck } from 'lucide-react';

interface PerformanceMetrics {
  superiority: number;
  efficiency: number;
  consistency: number;
}

interface PerformanceInsightProps {
  metrics: PerformanceMetrics;
}

export default function PerformanceInsight({ metrics }: PerformanceInsightProps) {
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
      {/* 1. ALPHA EDGE (SUPERIORIDAD IA) */}
      <article className="card" style={{ 
        padding: '0.8rem 1rem', 
        borderLeft: '4px solid #8b5cf6',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(15, 23, 42, 0) 100%)',
        position: 'relative'
      }}>
        <div className="card-title" style={{ color: '#a78bfa', fontSize: '0.65rem', letterSpacing: '0.02em', marginBottom: '0.4rem' }}>
          <Zap size={12} /> ALPHA EDGE
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
          <span style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fff' }}>
            {metrics.superiority.toFixed(1)}%
          </span>
          <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 'bold' }}>↑ Ventaja</span>
        </div>
        <p style={{ fontSize: '0.6rem', opacity: 0.5, marginTop: '0.3rem', lineHeight: '1.2' }}>
          Probabilidad de superar al azar (últ. 20 draws).
        </p>
      </article>

      {/* 2. EFFICIENCY LIFT (FACTOR DE IMPACTO) */}
      <article className="card" style={{ 
        padding: '0.8rem 1rem', 
        borderLeft: '4px solid #fbbf24',
        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, rgba(15, 23, 42, 0) 100%)',
        position: 'relative'
      }}>
        <div className="card-title" style={{ color: '#fcd34d', fontSize: '0.65rem', letterSpacing: '0.02em', marginBottom: '0.4rem' }}>
          <TrendingUp size={12} /> EFFICIENCY LIFT
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
          <span style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fff' }}>
            {metrics.efficiency.toFixed(2)}x
          </span>
          <span style={{ color: '#f59e0b', fontSize: '0.7rem', fontWeight: 'bold' }}>Impacto</span>
        </div>
        <p style={{ fontSize: '0.6rem', opacity: 0.5, marginTop: '0.3rem', lineHeight: '1.2' }}>
          Potencia IA frente al azar (últ. 20 draws).
        </p>
      </article>

      {/* 3. CONSISTENCY INDEX (ESTABILIDAD) */}
      <article className="card" style={{ 
        padding: '0.8rem 1rem', 
        borderLeft: '4px solid #10b981',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(15, 23, 42, 0) 100%)',
        position: 'relative'
      }}>
        <div className="card-title" style={{ color: '#34d399', fontSize: '0.65rem', letterSpacing: '0.02em', marginBottom: '0.4rem' }}>
          <ShieldCheck size={12} /> CONSISTENCY INDEX
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
          <span style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fff' }}>
            {metrics.consistency.toFixed(0)}%
          </span>
          <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 'bold' }}>Sólido</span>
        </div>
        <p style={{ fontSize: '0.6rem', opacity: 0.5, marginTop: '0.3rem', lineHeight: '1.2' }}>
          Consistencia de superioridad competitiva.
        </p>
      </article>
    </div>
  );
}
