import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { MetricsCards } from './components/MetricsCards';
import { ReturnsTable } from './components/ReturnsTable';
import { ReturnFormModal } from './components/ReturnFormModal';
import { ReturnDetailModal } from './components/ReturnDetailModal';

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
          descricao: `Registro de devolução criado para a cotação ${newReturnData.cotacao}.`
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
        status: (r.status === 'Pendente Ação' || r.status === 'Em Trânsito') ? 'Em Tratativa' : r.status,
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

  const handleAddEmail = (returnId: string, email: string) => {
    setReturns(prev => prev.map(r => {
      if (r.id !== returnId) return r;
      const updated = { ...r, emailsResponsaveis: [...r.emailsResponsaveis, email] };
      if (selectedReturn && selectedReturn.id === returnId) setSelectedReturn(updated);
      return updated;
    }));
  };

  const handleRemoveEmail = (returnId: string, email: string) => {
    setReturns(prev => prev.map(r => {
      if (r.id !== returnId) return r;
      const updated = { ...r, emailsResponsaveis: r.emailsResponsaveis.filter(e => e !== email) };
      if (selectedReturn && selectedReturn.id === returnId) setSelectedReturn(updated);
      return updated;
    }));
  };

  // Dispara o envio real do e-mail via nossa função serverless (/api/send-alert-email),
  // que por sua vez chama o Resend. Fire-and-forget: não bloqueia a varredura, e erros
  // (ex: chave da API não configurada ainda) só vão pro console, sem quebrar a tela.
  const sendEmailAlert = (to: string[], subject: string, html: string) => {
    fetch('/api/send-alert-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html })
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error('Falha ao enviar e-mail de alerta:', err);
        }
      })
      .catch(err => console.error('Erro de rede ao enviar e-mail de alerta:', err));
  };

  // Varredura automática de gatilhos de SLA: roda em segundo plano (ver useEffect
  // abaixo) e dispara os alertas de e-mail quando um prazo entra em aviso prévio
  // ou vence, sem precisar de nenhuma tela de simulação manual.
  const runSlaTriggerScan = (currentReturns: ReturnCase[]): ReturnCase[] => {
    const now = Date.now();

    return currentReturns.map(item => {
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
              dataEnvio: new Date().toISOString(),
              tipoSla: 'SLA_RESPOSTA',
              tipoAlerta: 'VENCIDO',
              destinatarios: item.emailsResponsaveis,
              assunto,
              corpoHtml
            });
            sendEmailAlert(item.emailsResponsaveis, assunto, corpoHtml);
          }
        } else if (sla.respostaAlerta) {
          const alreadySent = newEmailLogs.some(e => e.tipoSla === 'SLA_RESPOSTA' && e.tipoAlerta === 'AVISO_PREVIO');
          if (!alreadySent) {
            const { assunto, corpoHtml } = generateSlaEmailAlert(item, 'SLA_RESPOSTA', 'AVISO_PREVIO');
            newEmailLogs.unshift({
              id: `alt-${crypto.randomUUID()}`,
              devolucaoId: item.id,
              cotacao: item.cotacao,
              dataEnvio: new Date().toISOString(),
              tipoSla: 'SLA_RESPOSTA',
              tipoAlerta: 'AVISO_PREVIO',
              destinatarios: item.emailsResponsaveis,
              assunto,
              corpoHtml
            });
            sendEmailAlert(item.emailsResponsaveis, assunto, corpoHtml);
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
              dataEnvio: new Date().toISOString(),
              tipoSla: 'SLA_RESOLUCAO',
              tipoAlerta: 'VENCIDO',
              destinatarios: item.emailsResponsaveis,
              assunto,
              corpoHtml
            });
            sendEmailAlert(item.emailsResponsaveis, assunto, corpoHtml);
          }
        } else if (sla.resolucaoAlerta) {
          const alreadySent = newEmailLogs.some(e => e.tipoSla === 'SLA_RESOLUCAO' && e.tipoAlerta === 'AVISO_PREVIO');
          if (!alreadySent) {
            const { assunto, corpoHtml } = generateSlaEmailAlert(item, 'SLA_RESOLUCAO', 'AVISO_PREVIO');
            newEmailLogs.unshift({
              id: `alt-${crypto.randomUUID()}`,
              devolucaoId: item.id,
              cotacao: item.cotacao,
              dataEnvio: new Date().toISOString(),
              tipoSla: 'SLA_RESOLUCAO',
              tipoAlerta: 'AVISO_PREVIO',
              destinatarios: item.emailsResponsaveis,
              assunto,
              corpoHtml
            });
            sendEmailAlert(item.emailsResponsaveis, assunto, corpoHtml);
          }
        }
      }

      return {
        ...item,
        alertasEnviados: newEmailLogs
      };
    });
  };

  // Dispara a varredura de SLA assim que a tela abre e depois a cada minuto,
  // substituindo o antigo botão manual de "simular gatilhos".
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    setReturns(prev => runSlaTriggerScan(prev));
    scanIntervalRef.current = setInterval(() => {
      setReturns(prev => runSlaTriggerScan(prev));
    }, 60000);
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResetData = () => {
    if (window.confirm('Deseja restaurar os dados de demonstração iniciais?')) {
      setReturns(INITIAL_RETURNS);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Header */}
      <Header
        onOpenNewModal={() => setIsNewModalOpen(true)}
        onResetData={handleResetData}
        alertCount={alertCount}
        expiredCount={expiredCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          <MetricsCards items={returns} />
          <ReturnsTable
            items={returns}
            onSelectReturn={item => setSelectedReturn(item)}
            onRecordFirstAction={handleRecordFirstAction}
            onConcludeReturn={handleConcludeReturn}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Sistema de Logística Reversa &amp; Devoluções de Clientes &copy; 2026</span>
          <span className="text-slate-500">Projeto de Engenharia de Sistemas &amp; Arquitetura de Software</span>
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
        onAddEmail={handleAddEmail}
        onRemoveEmail={handleRemoveEmail}
      />

    </div>
  );
}
