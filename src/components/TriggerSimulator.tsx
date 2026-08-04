import React, { useState } from 'react';
import { 
  Play, 
  RefreshCw, 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  AlertOctagon, 
  Zap, 
  Eye, 
  Trash2,
  Bell
} from 'lucide-react';
import { ReturnCase, EmailAlertLog } from '../types';
import { calculateSlaStatus, generateSlaEmailAlert } from '../utils/slaCalculations';

interface TriggerSimulatorProps {
  items: ReturnCase[];
  onTriggerScan: () => { newAlertsCount: number; scannedCount: number };
  onClearEmailLogs: () => void;
}

export const TriggerSimulator: React.FC<TriggerSimulatorProps> = ({
  items,
  onTriggerScan,
  onClearEmailLogs
}) => {
  const [lastScanResult, setLastScanResult] = useState<{ newAlertsCount: number; scannedCount: number } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [previewEmail, setPreviewEmail] = useState<EmailAlertLog | null>(null);

  // Collect all email logs across items
  const allEmailLogs: EmailAlertLog[] = items.flatMap(i => i.alertasEnviados).sort((a, b) => 
    new Date(b.dataEnvio).getTime() - new Date(a.dataEnvio).getTime()
  );

  const handleRunScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const result = onTriggerScan();
      setLastScanResult(result);
      setIsScanning(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner / Intro */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
                <Zap className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold">Simulador de Gatilhos & Automação de E-mails</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Esta ferramenta simula a execução do <strong>Worker / CronJob em segundo plano</strong> que realiza a varredura contínua do banco de dados, calcula o consumo de SLA e dispara automaticamente e-mails de alerta para os e-mails dos responsáveis.
            </p>
          </div>

          <button
            onClick={handleRunScan}
            disabled={isScanning}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Executando Varredura...' : 'Executar Varredura de SLAs Agora'}</span>
          </button>
        </div>

        {/* Scan Result Notification */}
        {lastScanResult && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>
                Varredura concluída com sucesso! <strong>{lastScanResult.scannedCount} registros</strong> analisados. 
                {lastScanResult.newAlertsCount > 0 
                  ? ` 🚨 ${lastScanResult.newAlertsCount} novo(s) e-mail(s) de alerta gerado(s) e registrado(s)!` 
                  : ' Todos os alertas referentes aos prazos atuais já haviam sido notificados.'}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Grid: Cases currently evaluated for triggers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: SLA Triggers Status Monitor */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                Matriz de Avaliação dos Gatilhos Ativos
              </h3>
              <p className="text-xs text-slate-500">
                Condições monitoradas: <strong>Aviso Prévio</strong> (&gt;= 75% SLA Resposta ou &gt;= 80% SLA Resolução) e <strong>Vencimento</strong> (100% estourado).
              </p>
            </div>
            <span className="text-xs bg-slate-100 font-mono text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
              {items.length} casos monitorados
            </span>
          </div>

          <div className="space-y-3">
            {items.map(item => {
              const sla = calculateSlaStatus(item);

              return (
                <div 
                  key={item.id} 
                  className={`p-3.5 rounded-xl border transition-all ${
                    sla.nivelUrgencia === 'VENCIDO' 
                      ? 'bg-red-50/40 border-red-200' 
                      : sla.nivelUrgencia === 'ALERTA' 
                      ? 'bg-amber-50/40 border-amber-200' 
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">{item.clienteNome}</span>
                        <span className="text-xs font-mono bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-medium">
                          {item.cotacao}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Rastreio: <code className="font-mono">{item.codigoRastreio}</code> | Motivo: {item.motivoDevolucao}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      {sla.nivelUrgencia === 'VENCIDO' && (
                        <span className="bg-red-100 text-red-800 font-bold px-2.5 py-1 rounded-full border border-red-300 flex items-center gap-1">
                          <AlertOctagon className="w-3.5 h-3.5" /> Disparar Alerta Vencido
                        </span>
                      )}
                      {sla.nivelUrgencia === 'ALERTA' && (
                        <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full border border-amber-300 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Disparar Aviso Prévio
                        </span>
                      )}
                      {sla.nivelUrgencia === 'OK' && (
                        <span className="bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Dentro do SLA
                        </span>
                      )}
                      {sla.nivelUrgencia === 'CONCLUIDO' && (
                        <span className="bg-slate-200 text-slate-700 font-medium px-2.5 py-1 rounded-full">
                          Concluído (Isento)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Trigger Detail Metrics */}
                  <div className="mt-3 pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500">SLA 1ª Resposta: </span>
                      {item.dataPrimeiraAcao ? (
                        <span className="text-emerald-700 font-medium">Cumprido</span>
                      ) : (
                        <span className={sla.respostaVencida ? 'text-red-700 font-bold' : sla.respostaAlerta ? 'text-amber-700 font-bold' : 'text-slate-700 font-medium'}>
                          {sla.respostaPercentualConsumido}% consumido ({sla.respostaVencida ? 'Estourado!' : `${sla.respostaMinutosRestantes} min rest.`})
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-500">SLA Resolução: </span>
                      {item.status === 'Concluído' ? (
                        <span className="text-emerald-700 font-medium">Concluído</span>
                      ) : (
                        <span className={sla.resolucaoVencida ? 'text-red-700 font-bold' : sla.resolucaoAlerta ? 'text-amber-700 font-bold' : 'text-slate-700 font-medium'}>
                          {sla.resolucaoPercentualConsumido}% consumido ({sla.resolucaoVencida ? 'Estourado!' : `${sla.resolucaoHorasRestantes}h rest.`})
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Log of Dispatched Emails */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                Histórico de E-mails ({allEmailLogs.length})
              </h3>
              {allEmailLogs.length > 0 && (
                <button
                  onClick={onClearEmailLogs}
                  title="Limpar histórico de e-mails"
                  className="text-slate-400 hover:text-red-600 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {allEmailLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                Nenhum disparo registrado ainda.<br/>
                Clique em <strong>"Executar Varredura"</strong> para simular a automação.
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {allEmailLogs.map(log => (
                  <div
                    key={log.id}
                    onClick={() => setPreviewEmail(log)}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-400 cursor-pointer transition-all hover:shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className={`font-bold ${log.tipoAlerta === 'VENCIDO' ? 'text-red-600' : 'text-amber-600'}`}>
                        {log.tipoAlerta === 'VENCIDO' ? '🚨 VENCIDO' : '⚠️ AVISO PRÉVIO'}
                      </span>
                      <span className="text-slate-400">
                        {new Date(log.dataEnvio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800">{log.clienteNome}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{log.cotacao}</p>
                    <p className="text-[11px] text-blue-600 underline mt-2 flex items-center gap-1 font-medium">
                      <Eye className="w-3 h-3" />
                      Visualizar Template HTML
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Email Preview Modal */}
      {previewEmail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-300 overflow-hidden my-6">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold">Template do E-mail Disparado</h4>
                <p className="text-xs text-slate-400">Para: {previewEmail.destinatarios.join(', ')}</p>
              </div>
              <button onClick={() => setPreviewEmail(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="p-4 bg-slate-100 max-h-[70vh] overflow-y-auto text-xs">
              <div className="mb-2 p-2 bg-white rounded border border-slate-200 font-mono text-[11px] text-slate-700">
                <strong>Assunto:</strong> {previewEmail.assunto}
              </div>
              <div 
                className="bg-white rounded-lg p-3 border border-slate-200"
                dangerouslySetInnerHTML={{ __html: previewEmail.corpoHtml }}
              />
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setPreviewEmail(null)}
                className="bg-slate-800 text-white text-xs px-4 py-2 rounded-lg font-medium"
              >
                Fechar Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
