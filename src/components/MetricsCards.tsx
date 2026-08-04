import React from 'react';
import { Package, AlertTriangle, AlertOctagon, CheckCircle2, Clock } from 'lucide-react';
import { ReturnCase } from '../types';
import { calculateSlaStatus } from '../utils/slaCalculations';

interface MetricsCardsProps {
  items: ReturnCase[];
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ items }) => {
  let total = items.length;
  let concluidos = 0;
  let emAlerta = 0;
  let vencidos = 0;
  let noPrazo = 0;

  items.forEach(item => {
    const sla = calculateSlaStatus(item);
    if (item.status === 'Concluído') {
      concluidos++;
    } else if (sla.nivelUrgencia === 'VENCIDO') {
      vencidos++;
    } else if (sla.nivelUrgencia === 'ALERTA') {
      emAlerta++;
    } else {
      noPrazo++;
    }
  });

  const taxaSucesso = total > 0 ? Math.round(((noPrazo + concluidos) / total) * 100) : 100;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
      
      {/* Total Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total em Controle</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{total}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{concluidos} concluído(s)</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <Package className="w-5 h-5" />
        </div>
      </div>

      {/* Dentro do Prazo */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Dentro do SLA</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{noPrazo}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Fluxo regular</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      {/* Em Alerta */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Aviso Prévio SLA</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{emAlerta}</p>
          <p className="text-[11px] text-amber-600 mt-0.5">Atingiu &gt;= 75% do tempo</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      {/* Vencidos */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-red-600 uppercase tracking-wider">SLAs Vencidos</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{vencidos}</p>
          <p className="text-[11px] text-red-600 font-medium mt-0.5">Ação urgente requerida</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
          <AlertOctagon className="w-5 h-5" />
        </div>
      </div>

      {/* Taxa de Compliance */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between col-span-2 sm:col-span-1">
        <div>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider">Compliance SLA</p>
          <p className="text-2xl font-bold text-indigo-800 mt-1">{taxaSucesso}%</p>
          <p className="text-[11px] text-indigo-600 mt-0.5">Taxa de atendimento no prazo</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

    </div>
  );
};
