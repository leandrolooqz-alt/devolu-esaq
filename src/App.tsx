import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MetricsCards } from './components/MetricsCards';
import { ReturnsTable } from './components/ReturnsTable';
import { ReturnFormModal } from './components/ReturnFormModal';
import { ReturnDetailModal } from './components/ReturnDetailModal';
import { TriggerSimulator } from './components/TriggerSimulator';
import { DatabaseDocs } from './components/DatabaseDocs';
import { SlaTriggerDocs } from './components/SlaTriggerDocs';
import { PlatformComparison } from './components/PlatformComparison';

import { ReturnCase, ActionLog, EmailAlertLog, StatusDevolucao } from './types';
import { INITIAL_RETURNS } from './data/initialData';
import { calculateSlaStatus, generateSlaEmailAlert } from './utils/slaCalculations';

const STORAGE_KEY = 'logistica_reversa_devolucoes_v1';

export default function App() {
  const [returns, setReturns] = useState<ReturnCase[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao carregar dados do LocalStorage:', e);
    }
    return INITIAL_RETURNS;
  });

  const [activeTab, setActiveTab] = useState<'painel' | 'simulador' | 'banco-dados' | 'slas-gatilhos' | 'comparativo'>('painel');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnCase | null>(null);

  // Sync state to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(returns));
    } catch (e) {
      console.error('Erro ao salvar no LocalStorage:', e);
    }
  }, [returns]);

  // Calculated Counters for Header
  let alertCount = 0;
  let expiredCount = 0;

  returns.forEach(item => {
    const sla = calculateSlaStatus(item);
    if (sla.nivelUrgencia === 'VENCIDO') expiredCount++;
    if (sla.nivelUrgencia === 'ALERTA') alertCount++;
  });

  // Handlers
  const handleCreateReturn = (newReturnData: Omit<ReturnCase, 'id' | 'logs' | 'alertasEnviados'>) => {
    const newId = `ret-${crypto.randomUUID()}`;
    const newCase: ReturnCase = {
      ...newReturnData,
      id: newId,
      logs: [
        {
          id: `log-${crypto.randomUUID()}`,
          data: new Date().toISOString(),
          tipo: 'CRIACAO',
          usuario: 'Operador Logístico (Sistema)',
          descricao: `Registro de devolução para ${newReturnData.clienteNome} com cotação ${newReturnData.cotacao}.`
        }
      ],
      alertasEnviados: []
    };

    setReturns(prev => [newCase, ...prev]);
  };

  const handleRecordFirstAction = (item: ReturnCase) => {
    const nowIso = new Date().toISOString();
    const actionLog: ActionLog = {
      id: `log-${crypto.randomUUID()}`,
      data: nowIso,
      tipo: 'PRIMEIRA_ACAO',
      usuario: 'Analista de Atendimento',
      descricao: 'Primeira resposta ou ação tomada (Etiqueta emitida ou contato iniciado).'
    };

    setReturns(prev => prev.map(r => {
      if (r.id !== item.id) return r;
      return {
        ...r,
        dataPrimeiraAcao: nowIso,
        status: r.status === 'Pendente Ação' ? 'Em Tratativa' : r.status,
        logs: [actionLog, ...r.logs]
      };
    }));
  };

  const handleConcludeReturn = (item: ReturnCase) => {
    const nowIso = new Date().toISOString();
    const actionLog: ActionLog = {
      id: `log-${crypto.randomUUID()}`,
      data: nowIso,
      tipo: 'CONCLUSAO',
      usuario: 'Gestor de Estoque / SAC',
      descricao: 'Processo de devolução e restituição totalmente concluído.'
    };

    setReturns(prev => prev.map(r => {
      if (r.id !== item.id) return r;
      return {
        ...r,
        dataPrimeiraAcao: r.dataPrimeiraAcao || nowIso,
        dataResolucao: nowIso,
        status: 'Concluído',
        logs: [actionLog, ...r.logs]
      };
    }));
  };

  const handleAddLog = (returnId: string, descricao: string, novoStatus?: StatusDevolucao) => {
    const nowIso = new Date().toISOString();
    const actionLog: ActionLog = {
      id: `log-${crypto.randomUUID()}`,
      data: nowIso,
      tipo: novoStatus === 'Concluído' ? 'CONCLUSAO' : 'ATUALIZACAO',
      usuario: 'Analista Responsável',
      descricao
    };

    setReturns(prev => prev.map(r => {
      if (r.id !== returnId) return r;

      const updatedStatus = novoStatus || r.status;
      const updatedFirstAction = (!r.dataPrimeiraAcao) ? nowIso : r.dataPrimeiraAcao;
      const updatedResolucao = (updatedStatus === 'Concluído' && !r.dataResolucao) ? nowIso : r.dataResolucao;

      const updatedCase: ReturnCase = {
        ...r,
        status: updatedStatus,
        dataPrimeiraAcao: updatedFirstAction,
        dataResolucao: updatedResolucao,
        logs: [actionLog, ...r.logs]
      };

      if (selectedReturn && selectedReturn.id === returnId) {
        setSelectedReturn(updatedCase);
      }

      return updatedCase;
    }));
  };

  // Automated Trigger Scan logic for simulator
  const handleTriggerScan = (): { newAlertsCount: number; scannedCount: number } => {
    let newAlertsCount = 0;
    const now = Date.now();

    const updatedReturns = returns.map(item => {
      if (item.status === 'Concluído' || item.status === 'Cancelado') return item;

      const sla = calculateSlaStatus(item, now);
      const newEmailLogs: EmailAlertLog[] = [...item.alertasEnviados];

      // Check SLA Resposta Warnings
      if (!item.dataPrimeiraAcao) {
        if (sla.respostaVencida) {
          const alreadySent = newEmailLogs.some(e => e.tipoSla === 'SLA_RESPOSTA' && e.tipoAlerta === 'VENCIDO');
          if (!alreadySent) {
            const { assunto, corpoHtml } = generateSlaEmailAlert(item, 'SLA_RESPOSTA', 'VENCIDO');
            newEmailLogs.unshift({
              id: `alt-${crypto.randomUUID()}`,
              devolucaoId: item.id,
              cotacao: item.cotacao,
              clienteNome: item.clienteNome,
              dataEnvio: new Date().toISOString(),
              tipoSla: 'SLA_RESPOSTA',
              tipoAlerta: 'VENCIDO',
              destinatarios: item.emailsResponsaveis,
              assunto,
              corpoHtml
            });
            newAlertsCount++;
          }
        } else if (sla.respostaAlerta) {
          const alreadySent = newEmailLogs.some(e => e.tipoSla === 'SLA_RESPOSTA' && e.tipoAlerta === 'AVISO_PREVIO');
          if (!alreadySent) {
            const { assunto, corpoHtml } = generateSlaEmailAlert(item, 'SLA_RESPOSTA', 'AVISO_PREVIO');
            newEmailLogs.unshift({
              id: `alt-${crypto.randomUUID()}`,
              devolucaoId: item.id,
              cotacao: item.cotacao,
              clienteNome: item.clienteNome,
              dataEnvio: new Date().toISOString(),
              tipoSla: 'SLA_RESPOSTA',
              tipoAlerta: 'AVISO_PREVIO',
              destinatarios: item.emailsResponsaveis,
              assunto,
              corpoHtml
            });
            newAlertsCount++;
          }
        }
      }

      // Check SLA Resolução Warnings
      if (!item.dataResolucao) {
        if (sla.resolucaoVencida) {
          const alreadySent = newEmailLogs.some(e => e.tipoSla === 'SLA_RESOLUCAO' && e.tipoAlerta === 'VENCIDO');
          if (!alreadySent) {
            const { assunto, corpoHtml } = generateSlaEmailAlert(item, 'SLA_RESOLUCAO', 'VENCIDO');
            newEmailLogs.unshift({
              id: `alt-${crypto.randomUUID()}`,
              devolucaoId: item.id,
              cotacao: item.cotacao,
              clienteNome: item.clienteNome,
              dataEnvio: new Date().toISOString(),
              tipoSla: 'SLA_RESOLUCAO',
              tipoAlerta: 'VENCIDO',
              destinatarios: item.emailsResponsaveis,
              assunto,
              corpoHtml
            });
            newAlertsCount++;
          }
        } else if (sla.resolucaoAlerta) {
          const alreadySent = newEmailLogs.some(e => e.tipoSla === 'SLA_RESOLUCAO' && e.tipoAlerta === 'AVISO_PREVIO');
          if (!alreadySent) {
            const { assunto, corpoHtml } = generateSlaEmailAlert(item, 'SLA_RESOLUCAO', 'AVISO_PREVIO');
            newEmailLogs.unshift({
              id: `alt-${crypto.randomUUID()}`,
              devolucaoId: item.id,
              cotacao: item.cotacao,
              clienteNome: item.clienteNome,
              dataEnvio: new Date().toISOString(),
              tipoSla: 'SLA_RESOLUCAO',
              tipoAlerta: 'AVISO_PREVIO',
              destinatarios: item.emailsResponsaveis,
              assunto,
              corpoHtml
            });
            newAlertsCount++;
          }
        }
      }

      return {
        ...item,
        alertasEnviados: newEmailLogs
      };
    });

    setReturns(updatedReturns);
    return { newAlertsCount, scannedCount: returns.length };
  };

  const handleResetData = () => {
    if (window.confirm('Deseja restaurar os dados de demonstração iniciais?')) {
      setReturns(INITIAL_RETURNS);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleClearEmailLogs = () => {
    setReturns(prev => prev.map(i => ({ ...i, alertasEnviados: [] })));
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewModal={() => setIsNewModalOpen(true)}
        onResetData={handleResetData}
        alertCount={alertCount}
        expiredCount={expiredCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* TAB 1: PAINEL OPERACIONAL */}
        {activeTab === 'painel' && (
          <div className="space-y-6">
            <MetricsCards items={returns} />
            <ReturnsTable
              items={returns}
              onSelectReturn={item => setSelectedReturn(item)}
              onRecordFirstAction={handleRecordFirstAction}
              onConcludeReturn={handleConcludeReturn}
            />
          </div>
        )}

        {/* TAB 2: SIMULADOR DE GATILHOS */}
        {activeTab === 'simulador' && (
          <TriggerSimulator
            items={returns}
            onTriggerScan={handleTriggerScan}
            onClearEmailLogs={handleClearEmailLogs}
          />
        )}

        {/* TAB 3: ESTRUTURA DE BANCO DE DADOS */}
        {activeTab === 'banco-dados' && (
          <DatabaseDocs />
        )}

        {/* TAB 4: REGRAS DE SLA & GATILHOS */}
        {activeTab === 'slas-gatilhos' && (
          <SlaTriggerDocs />
        )}

        {/* TAB 5: RECOMENDAÇÃO DE PLATAFORMA */}
        {activeTab === 'comparativo' && (
          <PlatformComparison />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Sistema de Logística Reversa &amp; Devoluções de Clientes &copy; 2026</span>
          <span className="text-slate-400">Projeto de Engenharia de Sistemas &amp; Arquitetura de Software</span>
        </div>
      </footer>

      {/* Modal Nova Devolução */}
      <ReturnFormModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={handleCreateReturn}
      />

      {/* Modal Detalhes & Histórico */}
      <ReturnDetailModal
        item={selectedReturn}
        onClose={() => setSelectedReturn(null)}
        onAddLog={handleAddLog}
      />

    </div>
  );
}
