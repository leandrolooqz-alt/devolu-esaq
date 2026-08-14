import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Mail, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  User, 
  FileText, 
  Truck, 
  Calendar,
  AlertOctagon,
  ShieldCheck
} from 'lucide-react';
import { ReturnCase, ActionLog, StatusDevolucao } from '../types';
import { calculateSlaStatus } from '../utils/slaCalculations';

interface ReturnDetailModalProps {
  item: ReturnCase | null;
  onClose: () => void;
  onAddLog: (returnId: string, descricao: string, novoStatus?: StatusDevolucao) => void;
}

export const ReturnDetailModal: React.FC<ReturnDetailModalProps> = ({
  item,
  onClose,
  onAddLog
}) => {
  const [newNote, setNewNote] = useState('');
  const [newStatus, setNewStatus] = useState<StatusDevolucao | ''>('');
  const [selectedEmailPreview, setSelectedEmailPreview] = useState<string | null>(null);

  if (!item) return null;

  const sla = calculateSlaStatus(item);

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    onAddLog(item.id, newNote.trim(), newStatus || undefined);
    setNewNote('');
    setNewStatus('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-blue-400 font-bold">{item.cotacao}</span>
              <span className="text-slate-500">•</span>
              <h2 className="text-lg font-bold">{item.clienteNome}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Rastreio: <code className="text-slate-200 font-mono">{item.codigoRastreio}</code> | Cadastrado em: {new Date(item.dataEntrada).toLocaleString('pt-BR')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Grid */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[80vh] overflow-y-auto">
          
          {/* Column 1 & 2: SLA Status, Action Log & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* SLA Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* SLA Resposta */}
              <div className={`p-4 rounded-xl border ${
                item.dataPrimeiraAcao 
                  ? 'bg-emerald-50/50 border-emerald-200' 
                  : sla.respostaVencida 
                  ? 'bg-red-50/50 border-red-200' 
                  : sla.respostaAlerta 
                  ? 'bg-amber-50/50 border-amber-200' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">SLA 1ª Resposta ({item.slaRespostaHoras}h)</span>
                  {item.dataPrimeiraAcao ? (
                    <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Cumprido
                    </span>
                  ) : sla.respostaVencida ? (
                    <span className="text-xs text-red-700 font-bold flex items-center gap-1">
                      <AlertOctagon className="w-3.5 h-3.5" /> Vencido
                    </span>
                  ) : (
                    <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Em Andamento
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600 mt-2">
                  {item.dataPrimeiraAcao ? (
                    <p>1ª Ação registrada em: <strong>{new Date(item.dataPrimeiraAcao).toLocaleString('pt-BR')}</strong></p>
                  ) : (
                    <>
                      <p>Prazo limite: <strong>{new Date(sla.dataLimiteResposta).toLocaleString('pt-BR')}</strong></p>
                      <p className="mt-1">Consumido: <strong>{Math.min(100, sla.respostaPercentualConsumido)}%</strong> do tempo</p>
                    </>
                  )}
                </div>
              </div>

              {/* SLA Resolução */}
              <div className={`p-4 rounded-xl border ${
                item.status === 'Concluído' 
                  ? 'bg-emerald-50/50 border-emerald-200' 
                  : sla.resolucaoVencida 
                  ? 'bg-red-50/50 border-red-200' 
                  : sla.resolucaoAlerta 
                  ? 'bg-amber-50/50 border-amber-200' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">SLA Resolução ({item.slaResolucaoDias} dias)</span>
                  {item.status === 'Concluído' ? (
                    <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Concluído
                    </span>
                  ) : sla.resolucaoVencida ? (
                    <span className="text-xs text-red-700 font-bold flex items-center gap-1">
                      <AlertOctagon className="w-3.5 h-3.5" /> Vencido
                    </span>
                  ) : (
                    <span className="text-xs text-indigo-700 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Em Andamento
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600 mt-2">
                  {item.status === 'Concluído' ? (
                    <p>Resolvido em: <strong>{item.dataResolucao ? new Date(item.dataResolucao).toLocaleString('pt-BR') : 'Concluído'}</strong></p>
                  ) : (
                    <>
                      <p>Prazo limite: <strong>{new Date(sla.dataLimiteResolucao).toLocaleDateString('pt-BR')}</strong></p>
                      <p className="mt-1">Consumido: <strong>{Math.min(100, sla.resolucaoPercentualConsumido)}%</strong> do tempo</p>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Form to add action log */}
            <form onSubmit={handleAddAction} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-blue-600" />
                Registrar Atualização / Ação no Chamado
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Descreva a atualização feita (ex: etiqueta emitida, vistoria concluída)..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white"
                  />
                </div>
                <div>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as StatusDevolucao)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white font-medium"
                  >
                    <option value="">Status Atual: {item.status}</option>
                    <option value="Em Tratativa">Em Tratativa</option>
                    <option value="Aguardando Cliente">Aguardando Cliente</option>
                    <option value="Aguardando Resposta do Fornecedor">Aguardando Resposta do Fornecedor</option>
                    <option value="Em Análise Técnica">Em Análise Técnica</option>
                    <option value="Recusado">Recusado</option>
                    <option value="Reenviado ao Cliente">Reenviado ao Cliente</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors"
                >
                  Gravar Histórico
                </button>
              </div>
            </form>

            {/* Timeline Log */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" />
                Histórico de Auditoria ({item.logs.length} eventos)
              </h3>

              <div className="relative border-l-2 border-slate-200 ml-3 pl-4 space-y-4 text-xs">
                {item.logs.map((log, idx) => (
                  <div key={log.id || idx} className="relative group">
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white ring-2 ring-slate-200" />
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span className="font-semibold text-slate-800">{log.usuario}</span>
                        <span>{new Date(log.data).toLocaleString('pt-BR')}</span>
                      </div>
                      <p className="text-slate-700">{log.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Column 3: Responsáveis & Email Log History */}
          <div className="space-y-6 border-t lg:border-t-0 lg:border-l border-slate-200 pt-6 lg:pt-0 lg:pl-6">
            
            {/* Responsáveis Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                E-mails para Alertas ({item.emailsResponsaveis.length})
              </h3>
              <ul className="space-y-1 text-xs text-slate-600 font-mono">
                {item.emailsResponsaveis.map(e => (
                  <li key={e} className="bg-white px-2.5 py-1 rounded border border-slate-200 break-all">
                    {e}
                  </li>
                ))}
              </ul>
            </div>

            {/* Email History Logs */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-600" />
                Alertas de E-mail Enviados ({item.alertasEnviados.length})
              </h3>

              {item.alertasEnviados.length === 0 ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                  Nenhum alerta de e-mail disparado até o momento.
                </div>
              ) : (
                <div className="space-y-2">
                  {item.alertasEnviados.map(alert => (
                    <div 
                      key={alert.id}
                      onClick={() => setSelectedEmailPreview(alert.corpoHtml)}
                      className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs hover:border-blue-400 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800 mb-1">
                        <span className={alert.tipoAlerta === 'VENCIDO' ? 'text-red-600' : 'text-amber-600'}>
                          {alert.tipoAlerta === 'VENCIDO' ? '🚨 VENCIDO' : '⚠️ PRESTES A VENCER'}
                        </span>
                        <span className="text-slate-400 font-normal">
                          {new Date(alert.dataEnvio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-700 truncate">{alert.assunto}</p>
                      <p className="text-[11px] text-blue-600 underline mt-1">Ver preview do e-mail &rarr;</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Email HTML Preview Modal if selected */}
            {selectedEmailPreview && (
              <div className="fixed inset-0 z-60 bg-slate-900/50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-lg rounded-xl p-4 border border-slate-300 max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold uppercase text-slate-700">Preview do E-mail Disparado</h4>
                    <button onClick={() => setSelectedEmailPreview(null)} className="text-slate-400 hover:text-slate-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div 
                    className="border p-3 rounded bg-slate-50 text-xs"
                    dangerouslySetInnerHTML={{ __html: selectedEmailPreview }}
                  />
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
