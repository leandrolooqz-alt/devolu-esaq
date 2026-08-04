export type MotivoDevolucao = 
  | 'Defeito de Fabricação'
  | 'Avaria no Transporte'
  | 'Produto Incorreto'
  | 'Arrependimento / Desistência'
  | 'Tamanho ou Modelo Incompatível'
  | 'Atraso na Entrega'
  | 'Outros';

export type StatusDevolucao = 
  | 'Pendente Ação'
  | 'Em Tratativa'
  | 'Aguardando Cliente'
  | 'Concluído'
  | 'Cancelado';

export type TipoSLA = 'SLA_RESPOSTA' | 'SLA_RESOLUCAO';

export type TipoAlertaSLA = 'AVISO_PREVIO' | 'VENCIDO';

export interface ActionLog {
  id: string;
  data: string;
  tipo: 'CRIACAO' | 'PRIMEIRA_ACAO' | 'ATUALIZACAO' | 'MUDANCA_STATUS' | 'CONCLUSAO';
  usuario: string;
  descricao: string;
}

export interface EmailAlertLog {
  id: string;
  devolucaoId: string;
  cotacao: string;
  clienteNome: string;
  dataEnvio: string;
  tipoSla: TipoSLA;
  tipoAlerta: TipoAlertaSLA;
  destinatarios: string[];
  assunto: string;
  corpoHtml: string;
  lido?: boolean;
}

export interface ReturnCase {
  id: string;
  clienteNome: string; // Obrigatório
  cotacao: string; // Obrigatório
  codigoRastreio: string; // Obrigatório
  motivoDevolucao: MotivoDevolucao; // Obrigatório
  motivoDetalhado?: string;
  dataEntrada: string; // ISO String - Obrigatório
  emailsResponsaveis: string[]; // Obrigatório
  slaRespostaHoras: number; // ex: 24h
  slaResolucaoDias: number; // ex: 5 dias
  status: StatusDevolucao;
  dataPrimeiraAcao?: string; // Se preenchido, encerra SLA de Resposta
  dataResolucao?: string; // Se preenchido, encerra SLA de Resolução
  observacoes?: string;
  logs: ActionLog[];
  alertasEnviados: EmailAlertLog[];
}

export interface SlaCalculatedStatus {
  // SLA de Resposta
  respostaCumprida: boolean;
  respostaVencida: boolean;
  respostaAlerta: boolean; // ex: consumiu > 75% do tempo
  respostaPercentualConsumido: number;
  respostaMinutosRestantes: number;
  dataLimiteResposta: string;

  // SLA de Resolução
  resolucaoCumprida: boolean;
  resolucaoVencida: boolean;
  resolucaoAlerta: boolean; // ex: consumiu > 80% do tempo
  resolucaoPercentualConsumido: number;
  resolucaoHorasRestantes: number;
  dataLimiteResolucao: string;

  // Status unificado
  nivelUrgencia: 'OK' | 'ALERTA' | 'VENCIDO' | 'CONCLUIDO';
}

export interface DatabaseFieldSpec {
  campo: string;
  tipoDado: string;
  obrigatorio: boolean;
  chave?: 'PK' | 'FK' | 'INDEX';
  descricao: string;
}

export interface DatabaseTableSpec {
  nomeTabela: string;
  descricao: string;
  campos: DatabaseFieldSpec[];
}

export interface PlatformComparison {
  plataforma: string;
  tempoImplementacao: string;
  custoLicenciamento: string;
  escalabilidade: string;
  facilidadeGatilhosEmail: string;
  uxUI: string;
  pontuacaoGeral: number; // 1 to 5
  recomendadoPara: string;
  pontosFortes: string[];
  pontosAtenção: string[];
  veredictoTecnico: string;
}
