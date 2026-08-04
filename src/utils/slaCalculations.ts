import { ReturnCase, SlaCalculatedStatus } from '../types';

export function calculateSlaStatus(item: ReturnCase, nowTime?: number): SlaCalculatedStatus {
  const now = nowTime || Date.now();
  const entrada = new Date(item.dataEntrada).getTime();

  // 1. SLA de Resposta
  const msSlaResposta = item.slaRespostaHoras * 60 * 60 * 1000;
  const limiteRespostaMs = entrada + msSlaResposta;
  const dataLimiteResposta = new Date(limiteRespostaMs).toISOString();

  let respostaCumprida = false;
  let respostaVencida = false;
  let respostaAlerta = false;
  let respostaMinutosRestantes = 0;
  let respostaPercentualConsumido = 0;

  if (item.dataPrimeiraAcao) {
    respostaCumprida = true;
    const acaoMs = new Date(item.dataPrimeiraAcao).getTime();
    const decorrido = acaoMs - entrada;
    respostaPercentualConsumido = Math.min(100, Math.max(0, Math.round((decorrido / msSlaResposta) * 100)));
  } else {
    const decorrido = now - entrada;
    respostaPercentualConsumido = Math.round((decorrido / msSlaResposta) * 100);
    const restMS = limiteRespostaMs - now;
    respostaMinutosRestantes = Math.round(restMS / (60 * 1000));

    if (now > limiteRespostaMs) {
      respostaVencida = true;
    } else if (respostaPercentualConsumido >= 75) {
      respostaAlerta = true;
    }
  }

  // 2. SLA de Resolução
  const msSlaResolucao = item.slaResolucaoDias * 24 * 60 * 60 * 1000;
  const limiteResolucaoMs = entrada + msSlaResolucao;
  const dataLimiteResolucao = new Date(limiteResolucaoMs).toISOString();

  let resolucaoCumprida = false;
  let resolucaoVencida = false;
  let resolucaoAlerta = false;
  let resolucaoHorasRestantes = 0;
  let resolucaoPercentualConsumido = 0;

  if (item.dataResolucao || item.status === 'Concluído') {
    resolucaoCumprida = true;
    const resMs = item.dataResolucao ? new Date(item.dataResolucao).getTime() : now;
    const decorrido = resMs - entrada;
    resolucaoPercentualConsumido = Math.min(100, Math.max(0, Math.round((decorrido / msSlaResolucao) * 100)));
  } else {
    const decorrido = now - entrada;
    resolucaoPercentualConsumido = Math.round((decorrido / msSlaResolucao) * 100);
    const restMS = limiteResolucaoMs - now;
    resolucaoHorasRestantes = Math.round((restMS / (60 * 60 * 1000)) * 10) / 10;

    if (now > limiteResolucaoMs) {
      resolucaoVencida = true;
    } else if (resolucaoPercentualConsumido >= 80) {
      resolucaoAlerta = true;
    }
  }

  // Nível de Urgência Geral
  let nivelUrgencia: 'OK' | 'ALERTA' | 'VENCIDO' | 'CONCLUIDO' = 'OK';
  if (item.status === 'Concluído' || item.status === 'Cancelado') {
    nivelUrgencia = 'CONCLUIDO';
  } else if (respostaVencida || resolucaoVencida) {
    nivelUrgencia = 'VENCIDO';
  } else if (respostaAlerta || resolucaoAlerta) {
    nivelUrgencia = 'ALERTA';
  }

  return {
    respostaCumprida,
    respostaVencida,
    respostaAlerta,
    respostaPercentualConsumido,
    respostaMinutosRestantes,
    dataLimiteResposta,

    resolucaoCumprida,
    resolucaoVencida,
    resolucaoAlerta,
    resolucaoPercentualConsumido,
    resolucaoHorasRestantes,
    dataLimiteResolucao,

    nivelUrgencia
  };
}

export function formatTimeRemaining(minutes: number): string {
  if (minutes <= 0) return 'Vencido';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours}h restantes`;
  }
  if (hours > 0) {
    return `${hours}h ${mins}m restantes`;
  }
  return `${mins} min restantes`;
}

export function formatHoursRemaining(hours: number): string {
  if (hours <= 0) return 'Vencido';
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = Math.round(hours % 24);
    return `${days}d ${remHours}h restantes`;
  }
  return `${hours.toFixed(1)}h restantes`;
}

/**
 * Escapa caracteres HTML especiais. Todo campo digitado pelo usuário (nome do
 * cliente, cotação, rastreio, motivo/observações) precisa passar por aqui antes
 * de ser interpolado no template do e-mail, já que o corpo é renderizado com
 * dangerouslySetInnerHTML no preview (TriggerSimulator). Sem isso, um nome de
 * cliente como "<img src=x onerror=...>" executaria no navegador de quem abrir
 * o preview.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function generateSlaEmailAlert(
  item: ReturnCase,
  tipoSla: 'SLA_RESPOSTA' | 'SLA_RESOLUCAO',
  tipoAlerta: 'AVISO_PREVIO' | 'VENCIDO'
): { assunto: string; corpoHtml: string } {
  const isResposta = tipoSla === 'SLA_RESPOSTA';
  const isVencido = tipoAlerta === 'VENCIDO';
  const slaNome = isResposta ? 'SLA de Primeira Resposta' : 'SLA de Resolução Final';
  const statusStr = isVencido ? '🚨 VENCIDO' : '⚠️ PRESTES A VENCER (ALERTA)';

  const cotacaoSafe = escapeHtml(item.cotacao);
  const clienteNomeSafe = escapeHtml(item.clienteNome);
  const codigoRastreioSafe = escapeHtml(item.codigoRastreio);
  const motivoSafe = escapeHtml(item.motivoDevolucao);
  const statusSafe = escapeHtml(item.status);
  const emailsSafe = item.emailsResponsaveis.map(escapeHtml).join(', ');

  const assunto = `[LOGÍSTICA REVERSA] ${statusStr} - Cotação: ${item.cotacao} | Cliente: ${item.clienteNome}`;

  const corpoHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background-color: #ffffff;">
      <div style="background-color: ${isVencido ? '#8e2e22' : '#b7791f'}; color: #ffffff; padding: 12px 16px; border-radius: 6px; font-size: 16px; font-weight: bold; margin-bottom: 20px;">
        ${statusStr}: ${slaNome}
      </div>

      <p style="font-size: 15px; color: #334155;">Olá, Equipe de Atendimento / Logística,</p>
      
      <p style="font-size: 14px; color: #475569; line-height: 1.5;">
        A devolução registrada para a cotação <strong>${cotacaoSafe}</strong> do cliente <strong>${clienteNomeSafe}</strong> atingiu o gatilho de notificação para o <strong>${slaNome}</strong>.
      </p>

      <div style="background-color: #f8fafc; border-left: 4px solid ${isVencido ? '#8e2e22' : '#b7791f'}; padding: 14px; margin: 16px 0; border-radius: 4px;">
        <table style="width: 100%; font-size: 13px; color: #334155;">
          <tr><td style="padding: 4px 0;"><strong>Cotação:</strong></td><td>${cotacaoSafe}</td></tr>
          <tr><td style="padding: 4px 0;"><strong>Cliente:</strong></td><td>${clienteNomeSafe}</td></tr>
          <tr><td style="padding: 4px 0;"><strong>Código Rastreio:</strong></td><td><code>${codigoRastreioSafe}</code></td></tr>
          <tr><td style="padding: 4px 0;"><strong>Motivo:</strong></td><td>${motivoSafe}</td></tr>
          <tr><td style="padding: 4px 0;"><strong>Data de Entrada:</strong></td><td>${new Date(item.dataEntrada).toLocaleString('pt-BR')}</td></tr>
          <tr><td style="padding: 4px 0;"><strong>Status Atual:</strong></td><td><span style="background-color: #e2e8f0; padding: 2px 8px; border-radius: 4px;">${statusSafe}</span></td></tr>
        </table>
      </div>

      <p style="font-size: 14px; color: #334155;">
        ${isVencido 
          ? '⚠️ <strong>Ação imediata necessária!</strong> O tempo limite estipulado foi ultrapassado sem a conclusão da etapa.' 
          : '⌛ <strong>Atenção ao prazo:</strong> O limite de tempo está próximo de expirar. Por favor, acesse o sistema para atuar na solicitação.'}
      </p>

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
        E-mails notificados: ${emailsSafe}<br/>
        Disparado automaticamente pelo Sistema de Gestão de Logística Reversa.
      </div>
    </div>
  `;

  return { assunto, corpoHtml };
}
