import { ReturnCase } from '../types';

const now = Date.now();
const hourInMs = 3600 * 1000;
const dayInMs = 24 * hourInMs;

export const INITIAL_RETURNS: ReturnCase[] = [
  {
    id: 'ret-101',
    clienteNome: 'Mercado e Distribuidora Silva LTDA',
    cotacao: 'COT-2026-8841',
    codigoRastreio: 'BR984723122SP',
    motivoDevolucao: 'Defeito de Fabricação',
    motivoDetalhado: 'Lote de inversores com erro E-04 no visor ao ligar.',
    dataEntrada: new Date(now - 30 * hourInMs).toISOString(), // 30h ago -> 24h SLA Resposta is EXPIRED!
    emailsResponsaveis: ['logistica@suaempresa.com.br', 'atendimento@suaempresa.com.br'],
    slaRespostaHoras: 24,
    slaResolucaoDias: 5,
    status: 'Pendente Ação',
    logs: [
      {
        id: 'log-1',
        data: new Date(now - 30 * hourInMs).toISOString(),
        tipo: 'CRIACAO',
        usuario: 'Portal do Cliente / API',
        descricao: 'Solicitação de devolução registrada via integração.'
      }
    ],
    alertasEnviados: [
      {
        id: 'alt-101',
        devolucaoId: 'ret-101',
        cotacao: 'COT-2026-8841',
        clienteNome: 'Mercado e Distribuidora Silva LTDA',
        dataEnvio: new Date(now - 6 * hourInMs).toISOString(),
        tipoSla: 'SLA_RESPOSTA',
        tipoAlerta: 'VENCIDO',
        destinatarios: ['logistica@suaempresa.com.br', 'atendimento@suaempresa.com.br'],
        assunto: '[LOGÍSTICA REVERSA] 🚨 VENCIDO - Cotação: COT-2026-8841 | Cliente: Mercado e Distribuidora Silva LTDA',
        corpoHtml: 'SLA de Primeira Resposta ultrapassado (30h decorridas de 24h).'
      }
    ]
  },
  {
    id: 'ret-102',
    clienteNome: 'Eletro Tech Importação e Varejo',
    cotacao: 'COT-2026-9102',
    codigoRastreio: 'QP332109847BR',
    motivoDevolucao: 'Avaria no Transporte',
    motivoDetalhado: 'Caixa externa amassada e produto trincado na lateral.',
    dataEntrada: new Date(now - 20 * hourInMs).toISOString(), // 20h ago -> 24h SLA (83% consumed, ALERT!)
    emailsResponsaveis: ['garantia@suaempresa.com.br', 'sac@suaempresa.com.br'],
    slaRespostaHoras: 24,
    slaResolucaoDias: 5,
    status: 'Pendente Ação',
    logs: [
      {
        id: 'log-2',
        data: new Date(now - 20 * hourInMs).toISOString(),
        tipo: 'CRIACAO',
        usuario: 'Operador Logístico',
        descricao: 'Devolução autorizada pelo SAC com inclusão de fotos do sinistro.'
      }
    ],
    alertasEnviados: [
      {
        id: 'alt-102',
        devolucaoId: 'ret-102',
        cotacao: 'COT-2026-9102',
        clienteNome: 'Eletro Tech Importação e Varejo',
        dataEnvio: new Date(now - 2 * hourInMs).toISOString(),
        tipoSla: 'SLA_RESPOSTA',
        tipoAlerta: 'AVISO_PREVIO',
        destinatarios: ['garantia@suaempresa.com.br', 'sac@suaempresa.com.br'],
        assunto: '[LOGÍSTICA REVERSA] ⚠️ PRESTES A VENCER (ALERTA) - Cotação: COT-2026-9102 | Cliente: Eletro Tech Importação e Varejo',
        corpoHtml: 'Alerta de aproximação do limite de 24h (83% do SLA de Resposta consumido).'
      }
    ]
  },
  {
    id: 'ret-103',
    clienteNome: 'Supermercados Alvorada S/A',
    cotacao: 'COT-2026-7730',
    codigoRastreio: 'PM771092384BR',
    motivoDevolucao: 'Produto Incorreto',
    motivoDetalhado: 'Enviado modelo 220V no lugar de 110V constante no pedido.',
    dataEntrada: new Date(now - 4.5 * dayInMs).toISOString(), // 4.5 days ago -> Resposta OK (done at 2h), Resolution at 90% (Alert!)
    emailsResponsaveis: ['qualidade@suaempresa.com.br', 'atendimento@suaempresa.com.br'],
    slaRespostaHoras: 24,
    slaResolucaoDias: 5,
    status: 'Em Tratativa',
    dataPrimeiraAcao: new Date(now - 44 * hourInMs).toISOString(),
    logs: [
      {
        id: 'log-3a',
        data: new Date(now - 4.5 * dayInMs).toISOString(),
        tipo: 'CRIACAO',
        usuario: 'Atendimento SAC',
        descricao: 'Abertura do chamado pelo formulário de logística reversa.'
      },
      {
        id: 'log-3b',
        data: new Date(now - 44 * hourInMs).toISOString(),
        tipo: 'PRIMEIRA_ACAO',
        usuario: 'Analista de Trocas (Carlos)',
        descricao: 'Código de postagem logística gerado e enviado ao cliente.'
      }
    ],
    alertasEnviados: [
      {
        id: 'alt-103',
        devolucaoId: 'ret-103',
        cotacao: 'COT-2026-7730',
        clienteNome: 'Supermercados Alvorada S/A',
        dataEnvio: new Date(now - 4 * hourInMs).toISOString(),
        tipoSla: 'SLA_RESOLUCAO',
        tipoAlerta: 'AVISO_PREVIO',
        destinatarios: ['qualidade@suaempresa.com.br', 'atendimento@suaempresa.com.br'],
        assunto: '[LOGÍSTICA REVERSA] ⚠️ PRESTES A VENCER (ALERTA) - Cotação: COT-2026-7730 | Cliente: Supermercados Alvorada S/A',
        corpoHtml: 'SLA de Resolução prestes a vencer (4.5 dias de 5.0 dias consumidos).'
      }
    ]
  },
  {
    id: 'ret-104',
    clienteNome: 'Construções & Reformas Horizon',
    cotacao: 'COT-2026-6419',
    codigoRastreio: 'LX123984012BR',
    motivoDevolucao: 'Arrependimento / Desistência',
    motivoDetalhado: 'Cliente desistiu da compra dentro do prazo legal de 7 dias.',
    dataEntrada: new Date(now - 2 * dayInMs).toISOString(),
    emailsResponsaveis: ['financeiro@suaempresa.com.br', 'logistica@suaempresa.com.br'],
    slaRespostaHoras: 12,
    slaResolucaoDias: 3,
    status: 'Concluído',
    dataPrimeiraAcao: new Date(now - 42 * hourInMs).toISOString(),
    dataResolucao: new Date(now - 10 * hourInMs).toISOString(),
    logs: [
      {
        id: 'log-4a',
        data: new Date(now - 2 * dayInMs).toISOString(),
        tipo: 'CRIACAO',
        usuario: 'Portal do Cliente',
        descricao: 'Registro de desistência.'
      },
      {
        id: 'log-4b',
        data: new Date(now - 42 * hourInMs).toISOString(),
        tipo: 'PRIMEIRA_ACAO',
        usuario: 'Analista Financeiro (Mariana)',
        descricao: 'Etiqueta de coleta emitida.'
      },
      {
        id: 'log-4c',
        data: new Date(now - 10 * hourInMs).toISOString(),
        tipo: 'CONCLUSAO',
        usuario: 'Estoque / Recebimento',
        descricao: 'Produto recebido, vistoriado e estorno efetuado no cartão.'
      }
    ],
    alertasEnviados: []
  },
  {
    id: 'ret-105',
    clienteNome: 'Global Indústria e Comércio',
    cotacao: 'COT-2026-5501',
    codigoRastreio: 'TR884920192BR',
    motivoDevolucao: 'Tamanho ou Modelo Incompatível',
    motivoDetalhado: 'Falta de compatibilidade com acoplamento existente no cliente.',
    dataEntrada: new Date(now - 2 * hourInMs).toISOString(), // Fresh return (OK)
    emailsResponsaveis: ['suporte.tecnico@suaempresa.com.br'],
    slaRespostaHoras: 24,
    slaResolucaoDias: 7,
    status: 'Pendente Ação',
    logs: [
      {
        id: 'log-5',
        data: new Date(now - 2 * hourInMs).toISOString(),
        tipo: 'CRIACAO',
        usuario: 'Analista Comercial',
        descricao: 'Abertura de devolução por erro na especificação.'
      }
    ],
    alertasEnviados: []
  }
];
