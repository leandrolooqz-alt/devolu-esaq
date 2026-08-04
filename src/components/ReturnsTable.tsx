import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  User, 
  FileText, 
  Truck, 
  Mail, 
  CheckCheck, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ReturnCase, StatusDevolucao } from '../types';
import { calculateSlaStatus, formatTimeRemaining, formatHoursRemaining } from '../utils/slaCalculations';

interface ReturnsTableProps {
  items: ReturnCase[];
  onSelectReturn: (item: ReturnCase) => void;
  onRecordFirstAction: (item: ReturnCase) => void;
  onConcludeReturn: (item: ReturnCase) => void;
}

export const ReturnsTable: React.FC<ReturnsTableProps> = ({
  items,
  onSelectReturn,
  onRecordFirstAction,
  onConcludeReturn
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('TODOS');

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cotacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.codigoRastreio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.motivoDevolucao.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter !== 'TODOS' && item.status !== statusFilter) {
      return false;
    }

    if (urgencyFilter !== 'TODOS') {
      const sla = calculateSlaStatus(item);
      if (urgencyFilter === 'VENCIDO' && sla.nivelUrgencia !== 'VENCIDO') return false;
      if (urgencyFilter === 'ALERTA' && sla.nivelUrgencia !== 'ALERTA') return false;
      if (urgencyFilter === 'OK' && sla.nivelUrgencia !== 'OK') return false;
    }

    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Table Controls / Filters Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, cotação, rastreio ou motivo..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="Pendente Ação">Pendente Ação</option>
              <option value="Em Tratativa">Em Tratativa</option>
              <option value="Aguardando Cliente">Aguardando Cliente</option>
              <option value="Concluído">Concluído</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-xl px-3 py-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">SLA:</span>
            <select
              value={urgencyFilter}
              onChange={e => setUrgencyFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="TODOS">Todos os SLAs</option>
              <option value="VENCIDO">🚨 Somente Vencidos</option>
              <option value="ALERTA">⚠️ Em Alerta</option>
              <option value="OK">✅ Dentro do Prazo</option>
            </select>
          </div>
        </div>

      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Cliente & Cotação</th>
              <th className="py-3 px-4">Rastreio & Motivo</th>
              <th className="py-3 px-4">Entrada & Responsáveis</th>
              <th className="py-3 px-4">SLA 1ª Resposta</th>
              <th className="py-3 px-4">SLA Resolução Final</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Truck className="w-8 h-8 text-slate-300" />
                    <p className="font-medium text-slate-600">Nenhuma devolução encontrada.</p>
                    <p className="text-xs">Tente ajustar os filtros de busca ou cadastre uma nova devolução.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map(item => {
                const sla = calculateSlaStatus(item);

                // Urgency row highlight style
                let rowBg = 'hover:bg-slate-50/80';
                if (sla.nivelUrgencia === 'VENCIDO') {
                  rowBg = 'bg-red-50/30 hover:bg-red-50/60';
                } else if (sla.nivelUrgencia === 'ALERTA') {
                  rowBg = 'bg-amber-50/30 hover:bg-amber-50/60';
                }

                return (
                  <tr key={item.id} className={`transition-colors ${rowBg}`}>
                    
                    {/* Cliente & Cotação */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.clienteNome}</div>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <span className="text-slate-500 text-xs">Cotação:</span>
                        <span className="font-mono font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded text-[11px]">
                          {item.cotacao}
                        </span>
                      </div>
                    </td>

                    {/* Rastreio & Motivo */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-slate-800 text-xs flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        {item.codigoRastreio}
                      </div>
                      <div className="text-xs font-medium text-slate-600 mt-0.5">
                        {item.motivoDevolucao}
                      </div>
                    </td>

                    {/* Data de Entrada & Responsáveis */}
                    <td className="py-3.5 px-4">
                      <div className="text-xs text-slate-600">
                        {new Date(item.dataEntrada).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5" title={item.emailsResponsaveis.join(', ')}>
                        <Mail className="w-3 h-3" />
                        <span>{item.emailsResponsaveis.length} responsável(is)</span>
                      </div>
                    </td>

                    {/* SLA 1ª Resposta */}
                    <td className="py-3.5 px-4">
                      {item.dataPrimeiraAcao ? (
                        <div className="flex items-center text-emerald-700 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/60 w-max">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          <span>Atendido ({new Date(item.dataPrimeiraAcao).toLocaleDateString('pt-BR')})</span>
                        </div>
                      ) : sla.respostaVencida ? (
                        <div>
                          <div className="flex items-center text-red-700 font-bold text-xs bg-red-100 px-2 py-0.5 rounded border border-red-200 w-max">
                            <AlertOctagon className="w-3.5 h-3.5 mr-1 text-red-600" />
                            <span>Vencido!</span>
                          </div>
                          <span className="text-[10px] text-red-600 mt-0.5 block">Expirou em: {new Date(sla.dataLimiteResposta).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      ) : (
                        <div>
                          <div className={`flex items-center font-semibold text-xs ${sla.respostaAlerta ? 'text-amber-700' : 'text-slate-700'}`}>
                            {sla.respostaAlerta && <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500 animate-pulse" />}
                            <span>{formatTimeRemaining(sla.respostaMinutosRestantes)}</span>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-24 bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div 
                              className={`h-full transition-all ${sla.respostaAlerta ? 'bg-amber-500' : 'bg-blue-600'}`}
                              style={{ width: `${Math.min(100, sla.respostaPercentualConsumido)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>

                    {/* SLA Resolução Final */}
                    <td className="py-3.5 px-4">
                      {item.status === 'Concluído' || item.dataResolucao ? (
                        <div className="flex items-center text-emerald-700 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/60 w-max">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          <span>Concluído</span>
                        </div>
                      ) : sla.resolucaoVencida ? (
                        <div>
                          <div className="flex items-center text-red-700 font-bold text-xs bg-red-100 px-2 py-0.5 rounded border border-red-200 w-max">
                            <AlertOctagon className="w-3.5 h-3.5 mr-1 text-red-600" />
                            <span>Vencido!</span>
                          </div>
                          <span className="text-[10px] text-red-600 mt-0.5 block">Limite: {new Date(sla.dataLimiteResolucao).toLocaleDateString('pt-BR')}</span>
                        </div>
                      ) : (
                        <div>
                          <div className={`flex items-center font-semibold text-xs ${sla.resolucaoAlerta ? 'text-amber-700' : 'text-slate-700'}`}>
                            {sla.resolucaoAlerta && <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500" />}
                            <span>{formatHoursRemaining(sla.resolucaoHorasRestantes)}</span>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-24 bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div 
                              className={`h-full transition-all ${sla.resolucaoAlerta ? 'bg-amber-500' : 'bg-indigo-600'}`}
                              style={{ width: `${Math.min(100, sla.resolucaoPercentualConsumido)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-block border ${
                        item.status === 'Concluído' 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : item.status === 'Em Tratativa'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : item.status === 'Aguardando Cliente'
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        
                        {/* 1ª Ação Button */}
                        {!item.dataPrimeiraAcao && item.status !== 'Concluído' && (
                          <button
                            onClick={() => onRecordFirstAction(item)}
                            title="Registrar 1ª Ação (atende SLA de Resposta)"
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            1ª Ação
                          </button>
                        )}

                        {/* Concluir Button */}
                        {item.status !== 'Concluído' && (
                          <button
                            onClick={() => onConcludeReturn(item)}
                            title="Concluir Devolução (atende SLA de Resolução)"
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Concluir
                          </button>
                        )}

                        {/* Detalhes Drawer Button */}
                        <button
                          onClick={() => onSelectReturn(item)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <span>Detalhes</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
