import { ReturnCase, SlaCalculatedStatus } from '../types';

// Coluna: dataEntrada + SLAs
// Título: Motor de SLA
// Fazer: Calcular prazo, percentual consumido e nível de urgência sem depender da interface.
export function calculateSlaStatus(item: ReturnCase, nowTime = Date.now()): SlaCalculatedStatus {
  const entrada = new Date(item.dataEntrada).getTime();
  const respostaMs = item.slaRespostaHoras * 3600000;
  const resolucaoMs = item.slaResolucaoDias * 86400000;
  const limiteResposta = entrada + respostaMs;
  const limiteResolucao = entrada + resolucaoMs;
  const respostaCumprida = Boolean(item.dataPrimeiraAcao);
  const resolucaoCumprida = Boolean(item.dataResolucao) || item.status === 'Concluído';

  const respostaReferencia = respostaCumprida ? new Date(item.dataPrimeiraAcao!).getTime() : nowTime;
  const resolucaoReferencia = resolucaoCumprida ? new Date(item.dataResolucao || new Date(nowTime).toISOString()).getTime() : nowTime;
  const respostaPercentual = Math.min(100, Math.max(0, Math.round(((respostaReferencia - entrada) / respostaMs) * 100)));
  const resolucaoPercentual = Math.min(100, Math.max(0, Math.round(((resolucaoReferencia - entrada) / resolucaoMs) * 100)));
  const respostaVencida = !respostaCumprida && nowTime > limiteResposta;
  const resolucaoVencida = !resolucaoCumprida && nowTime > limiteResolucao;
  const respostaAlerta = !respostaCumprida && !respostaVencida && respostaPercentual >= 75;
  const resolucaoAlerta = !resolucaoCumprida && !resolucaoVencida && resolucaoPercentual >= 80;

  let nivelUrgencia: SlaCalculatedStatus['nivelUrgencia'] = 'OK';
  if (item.status === 'Concluído' || item.status === 'Cancelado') nivelUrgencia = 'CONCLUIDO';
  else if (respostaVencida || resolucaoVencida) nivelUrgencia = 'VENCIDO';
  else if (respostaAlerta || resolucaoAlerta) nivelUrgencia = 'ALERTA';

  return {
    respostaCumprida, respostaVencida, respostaAlerta, respostaPercentualConsumido: respostaPercentual,
    respostaMinutosRestantes: Math.round((limiteResposta - nowTime) / 60000),
    dataLimiteResposta: new Date(limiteResposta).toISOString(),
    resolucaoCumprida, resolucaoVencida, resolucaoAlerta, resolucaoPercentualConsumido: resolucaoPercentual,
    resolucaoHorasRestantes: Math.round(((limiteResolucao - nowTime) / 3600000) * 10) / 10,
    dataLimiteResolucao: new Date(limiteResolucao).toISOString(), nivelUrgencia,
  };
}

export function formatTimeRemaining(minutes: number) {
  if (minutes <= 0) return 'Vencido';
  const hours = Math.floor(minutes / 60); const mins = minutes % 60;
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h restantes`;
  if (hours) return `${hours}h ${mins}m restantes`;
  return `${mins} min restantes`;
}

export function formatHoursRemaining(hours: number) {
  if (hours <= 0) return 'Vencido';
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${Math.round(hours % 24)}h restantes`;
  return `${hours.toFixed(1)}h restantes`;
}
