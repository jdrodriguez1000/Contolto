'use client';

import { useState } from 'react';
import { TabType } from '../types';
import { useDashboardData } from '../hooks/useDashboardData';

// Componentes
import Header from '../components/Header';
import Tabs from '../components/Tabs';
import StatsCards from '../components/StatsCards';
import StrategySummary from '../components/StrategySummary';
import StrategyLeaderboard from '../components/StrategyLeaderboard';
import SuccessChart from '../components/SuccessChart';
import TrendAreaChart from '../components/TrendAreaChart';
import SuperiorityChart from '../components/SuperiorityChart';
import EfficiencyChart from '../components/EfficiencyChart';
import StabilityChart from '../components/StabilityChart';
import EngineDistributionChart from '../components/EngineDistributionChart';
import NumberSelector from '../components/NumberSelector';
import ClusterConfluenceCircle from '../components/ClusterConfluenceCircle';
import ClusterAnalysisPanel from '../components/ClusterAnalysisPanel';
import FrequencyTable from '../components/FrequencyTable';
import SuperballHeatmap from '../components/SuperballHeatmap';
import AffinityCards from '../components/AffinityCards';
import PerformanceInsight from '../components/PerformanceInsight';
import AfinidadTab from '../components/AfinidadTab';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('resultados');
  
  const dashboardData = useDashboardData();
  const {
    lastSorteo,
    realStrategyEntry,
    loading,
    strategyRanking,
    nextGames,
    balotoJackpot,
    realStats,
    aleatoriaStats,
    unicaStats,
    compareData,
    trendData,
    cumulativeData,
    numberStats,
    sbStats,
    engineDistribution,
    topPairs,
    topTrios,
    selectedCompanionNum,
    setSelectedCompanionNum,
    affinityLinks,
    clusterAnalysis,
    performanceMetrics
  } = dashboardData;

  if (loading) {
    return (
      <main className="dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="animate-pulse" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🚀</div>
          <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>CARGANDO INTELIGENCIA...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-container">
      <Header data={dashboardData} />
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'resultados' && (
        <>
          <StatsCards 
            realStrategyEntry={realStrategyEntry}
            lastSorteo={lastSorteo}
            balotoJackpot={balotoJackpot}
            nextGames={nextGames}
          />

          <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(280px, 1fr)', gap: '1rem', marginTop: '1rem', alignItems: 'stretch' }}>
            <div style={{ height: '100%' }}>
              <SuccessChart data={compareData} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', height: '100%' }}>
              <StrategySummary 
                realStats={realStats}
                unicaStats={unicaStats}
                aleatoriaStats={aleatoriaStats}
              />
            </div>
          </section>
        </>
      )}

      {activeTab === 'rendimiento' && (
        <section className="animate-in" style={{ marginTop: '1.5rem', marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <PerformanceInsight metrics={performanceMetrics} />
          <TrendAreaChart data={trendData} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
            <SuperiorityChart data={trendData} />
            <EfficiencyChart data={trendData} />
          </div>
        </section>
      )}

      {activeTab === 'estrategias' && (
        <>
          <StrategyLeaderboard ranking={strategyRanking} />
          <section className="animate-in" style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
            <StabilityChart data={cumulativeData} />
          </section>
          <section className="animate-in" style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
            <EngineDistributionChart data={engineDistribution} />
          </section>
        </>
      )}

      {activeTab === 'analisis' && (
        <section className="animate-in" style={{ marginTop: '0.5rem', marginBottom: '2.5rem' }}>
          <NumberSelector 
            selectedNumber={selectedCompanionNum} 
            onSelect={setSelectedCompanionNum} 
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem', alignItems: 'stretch' }}>
            <ClusterConfluenceCircle 
              selectedNumber={selectedCompanionNum}
              onSelect={setSelectedCompanionNum}
              affinityLinks={affinityLinks}
              clusterFriends={clusterAnalysis?.friends || []}
            />
            <ClusterAnalysisPanel 
              selectedNumber={selectedCompanionNum}
              analysis={clusterAnalysis}
            />
          </div>
        </section>
      )}

      {activeTab === 'historico' && (
        <section className="animate-in" style={{ marginTop: '0.5rem', marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <FrequencyTable 
            data={numberStats} 
            selectedNumber={selectedCompanionNum} 
            onSelect={setSelectedCompanionNum} 
          />
          <SuperballHeatmap data={sbStats} />
          <AffinityCards topPairs={topPairs} topTrios={topTrios} />
        </section>
      )}

      {activeTab === 'afinidad' && (
        <AfinidadTab nextGames={nextGames} />
      )}
    </main>
  );
}
