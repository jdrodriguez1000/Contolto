import { 
  Activity, 
  History, 
  Trophy, 
  BarChart3, 
  Share2,
  Sparkles
} from 'lucide-react';
import { TabType } from '@/types';

interface TabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function Tabs({ activeTab, setActiveTab }: TabsProps) {
  return (
    <nav className="tabs-container animate-in" style={{ animationDelay: '0.1s' }}>
      <button 
        onClick={() => setActiveTab('resultados')}
        className={`tab-button ${activeTab === 'resultados' ? 'active' : ''}`}
      >
        <Activity size={16} /> RESULTADOS
      </button>

      <button 
        onClick={() => setActiveTab('historico')}
        className={`tab-button ${activeTab === 'historico' ? 'active' : ''}`}
      >
        <History size={16} /> HISTÓRICO
      </button>

      <button 
        onClick={() => setActiveTab('estrategias')}
        className={`tab-button ${activeTab === 'estrategias' ? 'active' : ''}`}
      >
        <Trophy size={16} /> ESTRATEGIAS
      </button>

      <button 
        onClick={() => setActiveTab('rendimiento')}
        className={`tab-button ${activeTab === 'rendimiento' ? 'active' : ''}`}
      >
        <BarChart3 size={16} /> RENDIMIENTO
      </button>

      <button 
        onClick={() => setActiveTab('afinidad')}
        className={`tab-button ${activeTab === 'afinidad' ? 'active' : ''}`}
      >
        <Sparkles size={16} /> AFINIDAD
      </button>

      <button 
        onClick={() => setActiveTab('analisis')}
        className={`tab-button ${activeTab === 'analisis' ? 'active' : ''}`}
      >
        <Share2 size={16} /> PERSONALIZADO
      </button>
    </nav>
  );
}
