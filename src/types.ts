export type MotivoDevolucao = string;
export type StatusDevolucao = 'Em Trânsito'|'Pendente Ação'|'Em Tratativa'|'Aguardando Cliente'|'Aguardando Resposta do Fornecedor'|'Em Análise Técnica'|'Recusado'|'Reenviado ao Cliente'|'Concluído'|'Cancelado';
export type TipoSLA = 'SLA_RESPOSTA'|'SLA_RESOLUCAO';
export type TipoAlertaSLA = 'AVISO_PREVIO'|'VENCIDO';
export interface ActionLog { id:string; data:string; tipo:string; usuario:string; descricao:string; }
export interface EmailAlertLog { id:string; devolucaoId:string; cotacao:string; dataEnvio:string; tipoSla:TipoSLA; tipoAlerta:TipoAlertaSLA; destinatarios:string[]; assunto:string; corpoHtml:string; lido?:boolean; }
export interface ReturnCase { id:string; cotacao:string; codigoRastreio:string; motivoDevolucao:MotivoDevolucao; motivoDetalhado?:string; dataEntrada:string; emailsResponsaveis:string[]; slaRespostaHoras:number; slaResolucaoDias:number; status:StatusDevolucao; dataPrimeiraAcao?:string|null; dataResolucao?:string|null; observacoes?:string; logs:ActionLog[]; alertasEnviados:EmailAlertLog[]; }
export interface SlaCalculatedStatus { respostaCumprida:boolean; respostaVencida:boolean; respostaAlerta:boolean; respostaPercentualConsumido:number; respostaMinutosRestantes:number; dataLimiteResposta:string; resolucaoCumprida:boolean; resolucaoVencida:boolean; resolucaoAlerta:boolean; resolucaoPercentualConsumido:number; resolucaoHorasRestantes:number; dataLimiteResolucao:string; nivelUrgencia:'OK'|'ALERTA'|'VENCIDO'|'CONCLUIDO'; }
