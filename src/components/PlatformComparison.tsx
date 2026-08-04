import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Award, 
  Clock, 
  DollarSign, 
  Cpu, 
  ChevronRight,
  Zap,
  Building,
  Rocket
} from 'lucide-react';
import { PLATFORM_RECOMMENDATIONS } from '../data/architectureDocs';

export const PlatformComparison: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORM_RECOMMENDATIONS[0].plataforma);

  const activeSpec = PLATFORM_RECOMMENDATIONS.find(p => p.plataforma === selectedPlatform) || PLATFORM_RECOMMENDATIONS[0];

  return (
    <div className="space-y-6">
      
      {/* Intro Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
            <Sparkles className="w-5 h-5" />
          </span>
          <h2 className="text-xl font-bold">Recomendação Técnica de Plataformas & Tecnologias</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
          Análise comparativa elaborada por Analista de Sistemas e Desenvolvedor para selecionar a ferramenta com melhor equilíbrio entre velocidade de implementação, custo, gatilhos de e-mail e experiência do usuário.
        </p>
      </div>

      {/* Decision Tree / Fast Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Scenario 1 */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 p-4 rounded-2xl">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-2">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>Mais Rápida e Custo Zero</span>
          </div>
          <p className="text-sm font-bold text-slate-900">Google Sheets + Apps Script</p>
          <p className="text-xs text-slate-600 mt-1">
            Coloque no ar em menos de 24 horas sem aprovação de orçamento ou licenças adicionais.
          </p>
        </div>

        {/* Scenario 2 */}
        <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/30 p-4 rounded-2xl">
          <div className="flex items-center space-x-2 text-blue-800 font-bold text-xs uppercase tracking-wider mb-2">
            <Rocket className="w-4 h-4 text-blue-600" />
            <span>Melhor UX No-Code Corporativa</span>
          </div>
          <p className="text-sm font-bold text-slate-900">AppSheet (Google) / Power Apps</p>
          <p className="text-xs text-slate-600 mt-1">
            Aplicativo web/mobile profissional com validações de dados e disparos de e-mail nativos.
          </p>
        </div>

        {/* Scenario 3 */}
        <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-500/30 p-4 rounded-2xl">
          <div className="flex items-center space-x-2 text-indigo-800 font-bold text-xs uppercase tracking-wider mb-2">
            <Building className="w-4 h-4 text-indigo-600" />
            <span>Máxima Escalabilidade & ERP</span>
          </div>
          <p className="text-sm font-bold text-slate-900">Web App Customizado (React + Node)</p>
          <p className="text-xs text-slate-600 mt-1">
            Ideal para e-commerces e grandes operações com integração direta a ERPs e banco SQL.
          </p>
        </div>

      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-xs text-slate-700 uppercase tracking-wider">
          Matriz Comparativa de Ferramentas
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ferramenta</th>
                <th className="py-3 px-4">Tempo de Implantação</th>
                <th className="py-3 px-4">Custo / Licenciamento</th>
                <th className="py-3 px-4">Gatilhos de E-mail</th>
                <th className="py-3 px-4 text-center">Nota Geral</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {PLATFORM_RECOMMENDATIONS.map(p => (
                <tr 
                  key={p.plataforma}
                  onClick={() => setSelectedPlatform(p.plataforma)}
                  className={`cursor-pointer transition-colors ${
                    selectedPlatform === p.plataforma ? 'bg-blue-50/80 font-medium' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {p.plataforma}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {p.tempoImplementacao}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {p.custoLicenciamento}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {p.facilidadeGatilhosEmail}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-blue-700">
                    ⭐ {p.pontuacaoGeral} / 5.0
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center justify-end gap-1">
                      <span>Ver Análise</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Platform Detailed Analysis */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-2">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Análise Detalhada do Analista</span>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{activeSpec.plataforma}</h3>
          </div>
          <div className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-200 w-max">
            Recomendado para: {activeSpec.recomendadoPara}
          </div>
        </div>

        {/* Technical Verdict Highlight */}
        <div className="p-4 bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-medium leading-relaxed">
          {activeSpec.veredictoTecnico}
        </div>

        {/* Pros & Cons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          
          {/* Pros */}
          <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Pontos Fortes
            </h4>
            <ul className="space-y-1 text-xs text-slate-700">
              {activeSpec.pontosFortes.map((pf, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{pf}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cons / Attention */}
          <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-amber-600" />
              Pontos de Atenção
            </h4>
            <ul className="space-y-1 text-xs text-slate-700">
              {activeSpec.pontosAtenção.map((pa, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{pa}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};
