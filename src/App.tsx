import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { MetricsCards } from './components/MetricsCards';
import { ReturnsTable } from './components/ReturnsTable';
import { ReturnFormModal } from './components/ReturnFormModal';
import { ReturnDetailModal } from './components/ReturnDetailModal';

import { ReturnCase, StatusDevolucao } from './types';
import { calculateSlaStatus } from './utils/slaCalculations';

// Todas as chamadas vão pro backend Python (api/index.py). Nada mais fica
// salvo no navegador — o navegador só pede e mostra o que o backend responde.
async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Erro desconhecido' }));
    throw new Error(err.detail || 'Erro na requisição');
  }
  return res.json();
}

export default function App() {
  const [returns, setReturns] = useState<ReturnCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnCase | null>(null);

  const loadReturns = async () => {
    try {
      const data = await api<ReturnCase[]>('/api/returns');
      setReturns(data);
      setSelectedReturn(prev => {
        if (!prev) return prev;
        return data.find(r => r.id === prev.id) || null;
      });
    } catch (e) {
      console.error('Erro ao carregar devoluções:', e);
    } finally {
      setLoading(false);
    }
  };

  // Carrega ao abrir e roda a varredura de SLA (que dispara os e-mails no
  // backend) a cada minuto, recarregando a lista em seguida.
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    loadReturns();
    scanIntervalRef.current = setInterval(async () => {
      try {
        await api('/api/scan', { method: 'POST' });
      } catch (e) {
        console.error('Erro na varredura de SLA:', e);
      }
      loadReturns();
    }, 60000);
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculated Counters for Header
  let alertCount = 0;
  let expiredCount = 0;

  returns.forEach(item => {
    const sla = calculateSlaStatus(item);
    if (sla.nivelUrgencia === 'VENCIDO') expiredCount++;
    if (sla.nivelUrgencia === 'ALERTA') alertCount++;
  });

  const handleCreateReturn = async (newReturnData: Omit<ReturnCase, 'id' | 'logs' | 'alertasEnviados'>) => {
    try {
      await api('/api/returns', { method: 'POST', body: JSON.stringify(newReturnData) });
      loadReturns();
    } catch (e) {
      console.error('Erro ao criar devolução:', e);
      alert('Não foi possível salvar a devolução. Tente novamente.');
    }
  };

  const handleRecordFirstAction = async (item: ReturnCase) => {
    try {
      await api(`/api/returns/${item.id}/first-action`, { method: 'POST' });
      loadReturns();
    } catch (e) {
      console.error('Erro ao registrar 1ª ação:', e);
    }
  };

  const handleConcludeReturn = async (item: ReturnCase) => {
    try {
      await api(`/api/returns/${item.id}/conclude`, { method: 'POST' });
      loadReturns();
    } catch (e) {
      console.error('Erro ao concluir devolução:', e);
    }
  };

  const handleAddLog = async (returnId: string, descricao: string, novoStatus?: StatusDevolucao) => {
    try {
      await api(`/api/returns/${returnId}/logs`, {
        method: 'POST',
        body: JSON.stringify({ descricao, novoStatus })
      });
      loadReturns();
    } catch (e) {
      console.error('Erro ao registrar atualização:', e);
    }
  };

  const handleAddEmail = async (returnId: string, email: string) => {
    try {
      await api(`/api/returns/${returnId}/emails`, {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      loadReturns();
    } catch (e) {
      console.error('Erro ao adicionar e-mail:', e);
    }
  };

  const handleRemoveEmail = async (returnId: string, email: string) => {
    try {
      await api(`/api/returns/${returnId}/emails/${encodeURIComponent(email)}`, { method: 'DELETE' });
      loadReturns();
    } catch (e) {
      console.error('Erro ao remover e-mail:', e);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Deseja apagar todas as devoluções cadastradas?')) return;
    try {
      await api('/api/reset', { method: 'POST' });
      loadReturns();
    } catch (e) {
      console.error('Erro ao resetar dados:', e);
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
        {loading ? (
          <div className="text-center text-slate-400 py-20 text-sm">Carregando devoluções...</div>
        ) : (
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
