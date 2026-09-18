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
  ShieldCheck,
  Plus
} from 'lucide-react';
import { ReturnCase, ActionLog, StatusDevolucao } from '../types';
import { calculateSlaStatus } from '../utils/slaCalculations';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ReturnDetailModalProps {
  item: ReturnCase | null;
  onClose: () => void;
  onAddLog: (returnId: string, descricao: string, novoStatus?: StatusDevolucao) => void;
  onAddEmail: (returnId: string, email: string) => void;
  onRemoveEmail: (returnId: string, email: string) => void;
}

export const ReturnDetailModal: React.FC<ReturnDetailModalProps> = ({
  item,
  onClose,
  onAddLog,
  onAddEmail,
  onRemoveEmail
}) => {
  const [newNote, setNewNote] = useState('');
  const [newStatus, setNewStatus] = useState<StatusDevolucao | ''>('');
  const [selectedEmailPreview, setSelectedEmailPreview] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  if (!item) return null;

  const sla = calculateSlaStatus(item);

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    onAddLog(item.id, newNote.trim(), newStatus || undefined);
    setNewNote('');
    setNewStatus('');
  };

  const handleAddEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) return;
    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailError('Insira um e-mail válido.');
      return;
    }
    if (item.emailsResponsaveis.includes(trimmed)) {
      setEmailError('Este e-mail já está na lista.');
      return;
    }
    onAddEmail(item.id, trimmed);
    setNewEmail('');
    setEmailError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 w-full max-w-4xl rounded-2xl shadow-xl border border-slate-700 overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold font-mono text-blue-400">{item.cotacao}</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rastreio: <code className="text-slate-200 font-mono">{item.codigoRastreio}</code> | Cadastrado em: {new Date(item.dataEntrada).toLocaleString('pt-BR')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Grid */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[80vh] overflow-y-auto">
          
          {/* Column 1 & 2: Descrição / Ação & Timeline (mais espaço, sem os cards de SLA) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Form to add action log */}
            <form onSubmit={handleAddAction} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-blue-600" />
                Registrar Atualização / Ação no Chamado
              </h3>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Descreva a atualização feita (ex: etiqueta emitida, vistoria concluída, produto recebido no CD)..."
                    rows={4}
                    className="w-full px-3 py-2.5 text-sm border border-slate-600 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-slate-900 resize-y"
                  />
                </div>
                <div className="sm:max-w-xs">
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as StatusDevolucao)}
                    className="w-full px-3 py-2 text-xs border border-slate-600 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-slate-900 font-medium"
                  >
                    <option value="">Status Atual: {item.status}</option>
                    <option value="Em Trânsito">Em Trânsito</option>
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                Histórico de Auditoria ({item.logs.length} eventos)
              </h3>

              <div className="relative border-l-2 border-slate-700 ml-3 pl-4 space-y-4 text-sm">
                {item.logs.map((log, idx) => (
                  <div key={log.id || idx} className="relative group">
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white ring-2 ring-slate-700" />
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 shadow-2xs">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                        <span className="font-semibold text-slate-100">{log.usuario}</span>
                        <span>{new Date(log.data).toLocaleString('pt-BR')}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">{log.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Column 3: Responsáveis & Email Log History */}
          <div className="space-y-6 border-t lg:border-t-0 lg:border-l border-slate-700 pt-6 lg:pt-0 lg:pl-6">
            
            {/* Responsáveis Box */}
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-2 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                E-mails para Alertas ({item.emailsResponsaveis.length})
              </h3>
              <ul className="space-y-1 text-xs text-slate-300 font-mono mb-3">
                {item.emailsResponsaveis.map(e => (
                  <li key={e} className="bg-slate-900 px-2.5 py-1 rounded border border-slate-700 break-all flex items-center justify-between gap-2">
                    <span className="truncate">{e}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveEmail(item.id, e)}
                      title="Remover e-mail"
                      className="text-slate-500 hover:text-red-400 shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>

              <form onSubmit={handleAddEmailSubmit} className="flex gap-1.5">
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => { setNewEmail(e.target.value); setEmailError(''); }}
                  placeholder="Adicionar e-mail..."
                  className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-slate-600 rounded-lg bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="submit"
                  className="bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg px-2.5 shrink-0"
                  title="Adicionar e-mail"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>
              {emailError && <p className="text-[11px] text-red-400 mt-1">{emailError}</p>}
            </div>

            {/* Email History Logs */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-600" />
                Alertas de E-mail Enviados ({item.alertasEnviados.length})
              </h3>

              {item.alertasEnviados.length === 0 ? (
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 text-center text-slate-500 text-xs">
                  Nenhum alerta de e-mail disparado até o momento.
                </div>
              ) : (
                <div className="space-y-2">
                  {item.alertasEnviados.map(alert => (
                    <div 
                      key={alert.id}
                      onClick={() => setSelectedEmailPreview(alert.corpoHtml)}
                      className="bg-slate-900 p-3 rounded-lg border border-slate-700 shadow-2xs hover:border-blue-400 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-100 mb-1">
                        <span className={alert.tipoAlerta === 'VENCIDO' ? 'text-red-400' : 'text-amber-400'}>
                          {alert.tipoAlerta === 'VENCIDO' ? '🚨 VENCIDO' : '⚠️ PRESTES A VENCER'}
                        </span>
                        <span className="text-slate-500 font-normal">
                          {new Date(alert.dataEnvio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-200 truncate">{alert.assunto}</p>
                      <p className="text-[11px] text-blue-400 underline mt-1">Ver preview do e-mail &rarr;</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Email HTML Preview Modal if selected */}
            {selectedEmailPreview && (
              <div className="fixed inset-0 z-60 bg-slate-900/50 flex items-center justify-center p-4">
                <div className="bg-slate-900 w-full max-w-lg rounded-xl p-4 border border-slate-600 max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold uppercase text-slate-200">Preview do E-mail Disparado</h4>
                    <button onClick={() => setSelectedEmailPreview(null)} className="text-slate-500 hover:text-slate-200">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div 
                    className="border p-3 rounded bg-slate-800/60 text-xs"
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
