import React from 'react';
import { 
  Truck, 
  PlusCircle, 
  PlayCircle, 
  Database, 
  Clock, 
  BarChart3, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'painel' | 'simulador' | 'banco-dados' | 'slas-gatilhos' | 'comparativo';
  setActiveTab: (tab: 'painel' | 'simulador' | 'banco-dados' | 'slas-gatilhos' | 'comparativo') => void;
  onOpenNewModal: () => void;
  onResetData: () => void;
  alertCount: number;
  expiredCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewModal,
  onResetData,
  alertCount,
  expiredCount
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & System Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-2.5 rounded-xl shadow-inner flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-100">
                  Logística Reversa & Devoluções
                </h1>
                <span className="bg-blue-500/20 text-blue-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-500/30">
                  Sistema Analista v2.6
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gestão de Prazos, SLAs de Resposta & Resolução e Automação de Alertas
              </p>
            </div>
          </div>

          {/* Quick Actions & Status Badges */}
          <div className="flex items-center flex-wrap gap-2.5">
            {(alertCount > 0 || expiredCount > 0) && (
              <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
                {expiredCount > 0 && (
                  <span className="flex items-center text-red-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping mr-1.5"></span>
                    {expiredCount} Vencido{expiredCount > 1 ? 's' : ''}
                  </span>
                )}
                {alertCount > 0 && (
                  <span className="flex items-center text-amber-400 font-medium ml-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 mr-1.5"></span>
                    {alertCount} em Alerta
                  </span>
                )}
              </div>
            )}

            <button
              onClick={onResetData}
              title="Restaurar dados de demonstração"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1 border border-slate-700/50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Resetar Dados</span>
            </button>

            <button
              onClick={onOpenNewModal}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-blue-500/20 flex items-center space-x-1.5 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nova Devolução</span>
            </button>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="mt-4 flex items-center space-x-1 overflow-x-auto no-scrollbar border-t border-slate-800 pt-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('painel')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'painel'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Painel Operacional</span>
          </button>

          <button
            onClick={() => setActiveTab('simulador')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'simulador'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            <span className="flex items-center gap-1.5">
              Simulador de Gatilhos & E-mails
              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.2 rounded font-mono">
                Auto
              </span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('banco-dados')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'banco-dados'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Estrutura de Banco de Dados</span>
          </button>

          <button
            onClick={() => setActiveTab('slas-gatilhos')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'slas-gatilhos'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Regras de SLA & Gatilhos</span>
          </button>

          <button
            onClick={() => setActiveTab('comparativo')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'comparativo'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Recomendação de Plataforma</span>
          </button>
        </div>

      </div>
    </header>
  );
};
