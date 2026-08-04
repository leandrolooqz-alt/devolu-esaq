import React, { useState } from 'react';
import { X, Mail, AlertCircle, Plus, Calendar } from 'lucide-react';
import { ReturnCase, MotivoDevolucao } from '../types';

interface ReturnFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newReturn: Omit<ReturnCase, 'id' | 'logs' | 'alertasEnviados'>) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MOTIVOS_LIST: MotivoDevolucao[] = [
  'Defeito de Fabricação',
  'Avaria no Transporte',
  'Produto Incorreto',
  'Arrependimento / Desistência',
  'Tamanho ou Modelo Incompatível',
  'Atraso na Entrega',
  'Outros'
];

export const ReturnFormModal: React.FC<ReturnFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [clienteNome, setClienteNome] = useState('');
  const [cotacao, setCotacao] = useState('');
  const [codigoRastreio, setCodigoRastreio] = useState('');
  const [motivoDevolucao, setMotivoDevolucao] = useState<MotivoDevolucao>('Defeito de Fabricação');
  const [motivoDetalhado, setMotivoDetalhado] = useState('');
  
  // Data de Entrada default to current local date/time in ISO input format
  const nowIso = new Date().toISOString().slice(0, 16);
  const [dataEntrada, setDataEntrada] = useState(nowIso);

  // Email responsaveis input handling
  const [emailInput, setEmailInput] = useState('');
  const [emailsResponsaveis, setEmailsResponsaveis] = useState<string[]>(['logistica@empresa.com.br']);

  // SLAs
  const [slaRespostaHoras, setSlaRespostaHoras] = useState(24);
  const [slaResolucaoDias, setSlaResolucaoDias] = useState(5);

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleAddEmail = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!EMAIL_REGEX.test(trimmed)) {
      setErrors(prev => ({ ...prev, emails: 'Por favor, insira um e-mail válido.' }));
      return;
    }
    if (emailsResponsaveis.includes(trimmed)) {
      setErrors(prev => ({ ...prev, emails: 'Este e-mail já foi adicionado.' }));
      return;
    }
    setEmailsResponsaveis(prev => [...prev, trimmed]);
    setEmailInput('');
    setErrors(prev => ({ ...prev, emails: '' }));
  };

  const handleRemoveEmail = (email: string) => {
    setEmailsResponsaveis(prev => prev.filter(e => e !== email));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!clienteNome.trim()) newErrors.clienteNome = 'Nome do cliente é obrigatório.';
    if (!cotacao.trim()) newErrors.cotacao = 'Número de cotação é obrigatório.';
    if (!codigoRastreio.trim()) newErrors.codigoRastreio = 'Código de rastreio é obrigatório.';
    if (!dataEntrada) newErrors.dataEntrada = 'Data de entrada é obrigatória.';
    if (emailsResponsaveis.length === 0) newErrors.emails = 'Ao menos um e-mail de responsável é obrigatório.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      clienteNome: clienteNome.trim(),
      cotacao: cotacao.trim().toUpperCase(),
      codigoRastreio: codigoRastreio.trim().toUpperCase(),
      motivoDevolucao,
      motivoDetalhado: motivoDetalhado.trim(),
      dataEntrada: new Date(dataEntrada).toISOString(),
      emailsResponsaveis,
      slaRespostaHoras: Number(slaRespostaHoras) || 24,
      slaResolucaoDias: Number(slaResolucaoDias) || 5,
      status: 'Pendente Ação'
    });

    // Reset Form
    setClienteNome('');
    setCotacao('');
    setCodigoRastreio('');
    setMotivoDetalhado('');
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Registrar Nova Devolução (Logística Reversa)</h2>
            <p className="text-xs text-slate-400">Preencha os campos obrigatórios para acompanhamento de prazos e alertas de SLA.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Row 1: Cliente e Cotação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nome do Cliente <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={clienteNome}
                onChange={e => setClienteNome(e.target.value)}
                placeholder="Ex: Mercado e Distribuidora Silva"
                className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                  errors.clienteNome ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.clienteNome && <p className="text-xs text-red-500 mt-1">{errors.clienteNome}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Cotação / Pedido <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={cotacao}
                onChange={e => setCotacao(e.target.value)}
                placeholder="Ex: COT-2026-9920"
                className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                  errors.cotacao ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.cotacao && <p className="text-xs text-red-500 mt-1">{errors.cotacao}</p>}
            </div>
          </div>

          {/* Row 2: Código de Rastreio e Motivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Código de Rastreio <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={codigoRastreio}
                onChange={e => setCodigoRastreio(e.target.value)}
                placeholder="Ex: BR984723122SP"
                className={`w-full px-3.5 py-2 text-sm border font-mono rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                  errors.codigoRastreio ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.codigoRastreio && <p className="text-xs text-red-500 mt-1">{errors.codigoRastreio}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Motivo da Devolução <span className="text-red-500">*</span>
              </label>
              <select
                value={motivoDevolucao}
                onChange={e => setMotivoDevolucao(e.target.value as MotivoDevolucao)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                {MOTIVOS_LIST.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Data de Entrada */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Data e Hora de Entrada <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={dataEntrada}
                  onChange={e => setDataEntrada(e.target.value)}
                  className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                    errors.dataEntrada ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Data base para contagem e gatilhos de SLA.</p>
              {errors.dataEntrada && <p className="text-xs text-red-500 mt-1">{errors.dataEntrada}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Observações / Detalhes
              </label>
              <input
                type="text"
                value={motivoDetalhado}
                onChange={e => setMotivoDetalhado(e.target.value)}
                placeholder="Ex: Produto avariado durante o carregamento"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Row 4: E-mails dos Responsáveis (Notificações) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              E-mail dos Responsáveis (Recebimento de Alertas) <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Serão notificados automaticamente quando os SLAs de resposta ou resolução estiverem em alerta ou vencidos.
            </p>

            <div className="flex gap-2 mb-2">
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEmail();
                  }
                }}
                placeholder="Adicionar e-mail (Ex: gestor@empresa.com)"
                className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white"
              />
              <button
                type="button"
                onClick={handleAddEmail}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </button>
            </div>

            {errors.emails && <p className="text-xs text-red-500 mb-2">{errors.emails}</p>}

            {/* Email Chips */}
            <div className="flex flex-wrap gap-2 mt-2">
              {emailsResponsaveis.map(email => (
                <span
                  key={email}
                  className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium border border-blue-200"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(email)}
                    className="hover:text-red-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Row 5: Configuração de SLAs */}
          <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                SLA 1ª Resposta (Horas)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={slaRespostaHoras}
                onChange={e => setSlaRespostaHoras(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="text-[11px] text-slate-400">Tempo limite para a 1ª ação</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                SLA Resolução Final (Dias)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={slaResolucaoDias}
                onChange={e => setSlaResolucaoDias(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="text-[11px] text-slate-400">Tempo limite para a conclusão</span>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end space-x-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-5 py-2 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
            >
              Salvar Registro de Devolução
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
