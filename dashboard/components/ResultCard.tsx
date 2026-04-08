import { Calendar, Activity } from 'lucide-react';
import { Sorteo } from '@/types';
import { formatDate } from '@/lib/utils';

interface ResultCardProps {
  sorteo: Sorteo | null;
}

export default function ResultCard({ sorteo }: ResultCardProps) {
  if (!sorteo) return null;

  return (
    <article className="card animate-in" style={{ padding: '1.5rem', borderTop: '4px solid #f59e0b' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', color: 'var(--foreground-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} style={{ color: '#f59e0b' }} /> ÚLTIMO SORTEO OFICIAL
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', opacity: 0.6 }}>
          <Calendar size={14} /> {formatDate(sorteo.fecha)}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', margin: '1rem 0' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="number-badge hot" style={{ width: '45px', height: '45px', fontSize: '1.2rem' }}>
            {sorteo[`num${i}` as keyof Sorteo]}
          </div>
        ))}
        <div className="number-badge superball" style={{ width: '45px', height: '45px', fontSize: '1.2rem' }}>
          {sorteo.num6}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.2rem' }}>TIPO</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#f59e0b' }}>{sorteo.tipo}</div>
        </div>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.2rem' }}>ID SORTEO</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>#{sorteo.id.toString().slice(-4)}</div>
        </div>
      </div>
    </article>
  );
}
