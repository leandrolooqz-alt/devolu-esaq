import React, { useState } from 'react';
import { 
  Clock, 
  Zap, 
  Mail, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Copy, 
  Check, 
  FileCode, 
  Workflow, 
  Calendar,
  Layers
} from 'lucide-react';
import { TRIGGER_APPS_SCRIPT_CODE } from '../data/architectureDocs';

export const SlaTriggerDocs: React.FC = () => {
  const [copiedScript, setCopiedScript] = useState(false);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(TRIGGER_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
            <Clock className="w-5 h-5" />
          </span>
          <h2 className="text-xl font-bold">Lógica de SLAs, Gatilhos e Disparo de Alertas</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
          Especificação técnica de cálculo de prazos, janelas de tolerância e arquitetura de envio automático de e-mails para garantir a gestão proativa da logística reversa.
        </p>
      </div>

      {/* SLA Flow Diagram / Rule Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SLA 1: Resposta Inicial */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-200">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">1. SLA de Primeira Resposta</h3>
              <p className="text-xs text-slate-500">Garante o tempo limite para a 1ª interação humana/atendimento.</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <strong className="text-slate-900 block mb-1">Fórmula de Vencimento:</strong>
              <code className="bg-white px-2 py-1 rounded border text-blue-700 font-mono block">
                Data_Limite_Resposta = Data_Entrada + (SLA_Resposta_Horas * 3600s)
              </code>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2 bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Aviso Prévio (75% consumido):</strong>
                  <p className="text-[11px] mt-0.5">Dispara quando restar 25% do tempo do SLA sem registro de 1ª ação.</p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-red-50 p-2.5 rounded-lg border border-red-200 text-red-900">
                <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong>SLA Vencido (100% estourado):</strong>
                  <p className="text-[11px] mt-0.5">Dispara e-mail de escalonamento crítico avisando do estouro do prazo.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100">
              💡 <strong>Regra de Encerramento:</strong> Ao preencher a <code className="font-mono">data_primeira_acao</code>, o SLA de resposta é congelado com sucesso e os alertas deste SLA são desativados.
            </div>
          </div>
        </div>

        {/* SLA 2: Resolução Final */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-200">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">2. SLA de Resolução Final</h3>
              <p className="text-xs text-slate-500">Garante o encerramento completo do ciclo de logística reversa.</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <strong className="text-slate-900 block mb-1">Fórmula de Vencimento:</strong>
              <code className="bg-white px-2 py-1 rounded border text-indigo-700 font-mono block">
                Data_Limite_Resolucao = Data_Entrada + (SLA_Resolucao_Dias * 86400s)
              </code>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2 bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Aviso Prévio (80% consumido):</strong>
                  <p className="text-[11px] mt-0.5">Dispara aviso quando resta apenas 1 dia útil para concluir a devolução.</p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-red-50 p-2.5 rounded-lg border border-red-200 text-red-900">
                <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong>SLA Vencido (100% estourado):</strong>
                  <p className="text-[11px] mt-0.5">Dispara alerta para supervisores de logística e gestores de conta.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100">
              💡 <strong>Regra de Encerramento:</strong> Mudar o status para <code className="font-mono">Concluído</code> preenche a <code className="font-mono">data_resolucao</code> e encerra qualquer pendência de SLA.
            </div>
          </div>
        </div>

      </div>

      {/* Architecture Trigger Flow */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Workflow className="w-4 h-4 text-blue-600" />
          Como Funciona o Agendador de Gatilhos (Cron / Worker Flow)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
            <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold mx-auto">1</div>
            <p className="font-bold text-slate-800">Cron / Schedule</p>
            <p className="text-[11px] text-slate-500">Executa a cada 15 ou 30 minutos em segundo plano.</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
            <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold mx-auto">2</div>
            <p className="font-bold text-slate-800">Varredura de Prazos</p>
            <p className="text-[11px] text-slate-500">Filtra casos ativos onde status != Concluído.</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
            <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold mx-auto">3</div>
            <p className="font-bold text-slate-800">Avaliação de Flags</p>
            <p className="text-[11px] text-slate-500">Verifica se a flag do alerta específico já foi gravada como TRUE.</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
            <div className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold mx-auto">4</div>
            <p className="font-bold text-slate-800">Envio & Log</p>
            <p className="text-[11px] text-slate-500">Envia e-mail via SMTP/Gmail/SendGrid e grava o log do disparo.</p>
          </div>
        </div>
      </div>

      {/* Code Snippet for Google Apps Script / Node.js Worker */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="bg-slate-900 px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center space-x-2 font-mono">
            <FileCode className="w-4 h-4 text-amber-400" />
            <span>script_automação_alertas.gs (Google Apps Script / Node.js)</span>
          </div>
          <button
            onClick={handleCopyScript}
            className="hover:text-white transition-colors flex items-center space-x-1"
          >
            {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedScript ? 'Copiado!' : 'Copiar Script'}</span>
          </button>
        </div>

        <pre className="p-5 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed max-h-[350px]">
          {TRIGGER_APPS_SCRIPT_CODE}
        </pre>
      </div>

    </div>
  );
};
