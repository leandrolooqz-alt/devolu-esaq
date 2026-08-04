import { DatabaseTableSpec, PlatformComparison } from '../types';

export const DATABASE_TABLES: DatabaseTableSpec[] = [
  {
    nomeTabela: 'devolucoes',
    descricao: 'Tabela principal com todas as solicitações de logística reversa e prazos de SLA.',
    campos: [
      { campo: 'id', tipoDado: 'UUID / INT AUTO_INCREMENT', obrigatorio: true, chave: 'PK', descricao: 'Identificador único da devolução' },
      { campo: 'nome_cliente', tipoDado: 'VARCHAR(150)', obrigatorio: true, descricao: 'Nome ou Razão Social do cliente' },
      { campo: 'cotacao', tipoDado: 'VARCHAR(50)', obrigatorio: true, chave: 'INDEX', descricao: 'Número da cotação ou pedido original' },
      { campo: 'codigo_rastreio', tipoDado: 'VARCHAR(50)', obrigatorio: true, chave: 'INDEX', descricao: 'Código de rastreio dos Correios ou Transportadora' },
      { campo: 'motivo_id', tipoDado: 'INT', obrigatorio: true, chave: 'FK', descricao: 'Chave estrangeira para a tabela motivos_devolucao' },
      { campo: 'motivo_detalhado', tipoDado: 'TEXT', obrigatorio: false, descricao: 'Descrição detalhada informada pelo cliente ou operador' },
      { campo: 'data_entrada', tipoDado: 'TIMESTAMP WITH TIME ZONE', obrigatorio: true, chave: 'INDEX', descricao: 'Data e hora exatas da entrada no sistema' },
      { campo: 'emails_responsaveis', tipoDado: 'TEXT[] / JSONB', obrigatorio: true, descricao: 'Lista de e-mails para notificações e alertas de SLA' },
      { campo: 'sla_resposta_horas', tipoDado: 'INT', obrigatorio: true, descricao: 'SLA limite em horas para a 1ª ação (Ex: 24h)' },
      { campo: 'sla_resolucao_dias', tipoDado: 'INT', obrigatorio: true, descricao: 'SLA limite em dias para a conclusão (Ex: 5 dias)' },
      { campo: 'status', tipoDado: 'VARCHAR(30)', obrigatorio: true, chave: 'INDEX', descricao: 'Pendente Ação, Em Tratativa, Aguardando Cliente, Concluído, Cancelado' },
      { campo: 'data_primeira_acao', tipoDado: 'TIMESTAMP WITH TIME ZONE', obrigatorio: false, descricao: 'Data/Hora da 1ª resposta humana (zera SLA de resposta)' },
      { campo: 'data_resolucao', tipoDado: 'TIMESTAMP WITH TIME ZONE', obrigatorio: false, descricao: 'Data/Hora da conclusão (zera SLA de resolução)' },
      { campo: 'alerta_resposta_enviado', tipoDado: 'BOOLEAN', obrigatorio: true, descricao: 'Flag indicando se o alerta prévio de resposta já foi disparado' },
      { campo: 'vencimento_resposta_enviado', tipoDado: 'BOOLEAN', obrigatorio: true, descricao: 'Flag indicando se a notificação de resposta vencida foi disparada' },
      { campo: 'alerta_resolucao_enviado', tipoDado: 'BOOLEAN', obrigatorio: true, descricao: 'Flag indicando se o alerta prévio de resolução já foi disparado' },
      { campo: 'vencimento_resolucao_enviado', tipoDado: 'BOOLEAN', obrigatorio: true, descricao: 'Flag indicando se a notificação de resolução vencida foi disparada' },
      { campo: 'created_at', tipoDado: 'TIMESTAMP', obrigatorio: true, descricao: 'Data de criação do registro' },
      { campo: 'updated_at', tipoDado: 'TIMESTAMP', obrigatorio: true, descricao: 'Data da última modificação' }
    ]
  },
  {
    nomeTabela: 'historico_acoes',
    descricao: 'Trilha de auditoria das ações realizadas em cada processo de devolução.',
    campos: [
      { campo: 'id', tipoDado: 'UUID / INT AUTO_INCREMENT', obrigatorio: true, chave: 'PK', descricao: 'ID do histórico' },
      { campo: 'devolucao_id', tipoDado: 'UUID / INT', obrigatorio: true, chave: 'FK', descricao: 'Chave estrangeira apontando para devolucoes.id' },
      { campo: 'tipo_acao', tipoDado: 'VARCHAR(40)', obrigatorio: true, descricao: 'CRIACAO, PRIMEIRA_ACAO, ATUALIZACAO, MUDANCA_STATUS, CONCLUSAO' },
      { campo: 'usuario_responsavel', tipoDado: 'VARCHAR(100)', obrigatorio: true, descricao: 'Nome ou e-mail do usuário que executou a ação' },
      { campo: 'descricao', tipoDado: 'TEXT', obrigatorio: true, descricao: 'Detalhamento do evento ou observação inserida' },
      { campo: 'created_at', tipoDado: 'TIMESTAMP', obrigatorio: true, descricao: 'Data e hora do registro da ação' }
    ]
  },
  {
    nomeTabela: 'logs_alertas_email',
    descricao: 'Registro de todos os disparos de e-mail automatizados para controle e auditoria de SLAs.',
    campos: [
      { campo: 'id', tipoDado: 'UUID / INT AUTO_INCREMENT', obrigatorio: true, chave: 'PK', descricao: 'ID do log do alerta' },
      { campo: 'devolucao_id', tipoDado: 'UUID / INT', obrigatorio: true, chave: 'FK', descricao: 'Chave estrangeira apontando para devolucoes.id' },
      { campo: 'tipo_sla', tipoDado: 'VARCHAR(30)', obrigatorio: true, descricao: 'SLA_RESPOSTA ou SLA_RESOLUCAO' },
      { campo: 'tipo_alerta', tipoDado: 'VARCHAR(30)', obrigatorio: true, descricao: 'AVISO_PREVIO ou VENCIDO' },
      { campo: 'destinatarios', tipoDado: 'TEXT', obrigatorio: true, descricao: 'E-mails que receberam a notificação separados por vírgula' },
      { campo: 'assunto', tipoDado: 'VARCHAR(255)', obrigatorio: true, descricao: 'Assunto do e-mail enviado' },
      { campo: 'status_envio', tipoDado: 'VARCHAR(20)', obrigatorio: true, descricao: 'ENVIADO, ERRO, SIMULADO' },
      { campo: 'data_disparo', tipoDado: 'TIMESTAMP', obrigatorio: true, descricao: 'Data e hora em que o disparo ocorreu' }
    ]
  },
  {
    nomeTabela: 'motivos_devolucao',
    descricao: 'Tabela de domínio com a classificação dos motivos de devolução.',
    campos: [
      { campo: 'id', tipoDado: 'INT', obrigatorio: true, chave: 'PK', descricao: 'Código do motivo' },
      { campo: 'nome', tipoDado: 'VARCHAR(100)', obrigatorio: true, descricao: 'Defeito de Fabricação, Avaria no Transporte, Produto Incorreto, etc.' },
      { campo: 'ativo', tipoDado: 'BOOLEAN', obrigatorio: true, descricao: 'Indica se o motivo está disponível para escolha' }
    ]
  }
];

export const SQL_DDL_SCRIPT = `-- ====================================================================
-- SISTEMA DE LOGÍSTICA REVERSA E DEVOLUÇÕES
-- ESTRUTURA COMPLETA DE BANCO DE DADOS (POSTGRESQL / MYSQL)
-- Autor: Analista de Sistemas & Desenvolvedor
-- ====================================================================

-- 1. Tabela de Domínio: Motivos de Devolução
CREATE TABLE motivos_devolucao (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO motivos_devolucao (nome) VALUES 
('Defeito de Fabricação'),
('Avaria no Transporte'),
('Produto Incorreto'),
('Arrependimento / Desistência'),
('Tamanho ou Modelo Incompatível'),
('Atraso na Entrega'),
('Outros');

-- 2. Tabela Principal: Devoluções de Clientes
CREATE TABLE devolucoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_cliente VARCHAR(150) NOT NULL,
    cotacao VARCHAR(50) NOT NULL,
    codigo_rastreio VARCHAR(50) NOT NULL,
    motivo_id INT NOT NULL REFERENCES motivos_devolucao(id),
    motivo_detalhado TEXT,
    data_entrada TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    emails_responsaveis TEXT[] NOT NULL, -- Array de e-mails
    sla_resposta_horas INT NOT NULL DEFAULT 24,
    sla_resolucao_dias INT NOT NULL DEFAULT 5,
    status VARCHAR(30) NOT NULL DEFAULT 'Pendente Ação',
    data_primeira_acao TIMESTAMP WITH TIME ZONE,
    data_resolucao TIMESTAMP WITH TIME ZONE,
    alerta_resposta_enviado BOOLEAN DEFAULT FALSE,
    vencimento_resposta_enviado BOOLEAN DEFAULT FALSE,
    alerta_resolucao_enviado BOOLEAN DEFAULT FALSE,
    vencimento_resolucao_enviado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices estratégicos para buscas rápidas de SLA e consultas de rotina
CREATE INDEX idx_devolucoes_cotacao ON devolucoes(cotacao);
CREATE INDEX idx_devolucoes_codigo_rastreio ON devolucoes(codigo_rastreio);
CREATE INDEX idx_devolucoes_status ON devolucoes(status);
CREATE INDEX idx_devolucoes_sla_resposta ON devolucoes(data_entrada, data_primeira_acao, alerta_resposta_enviado, vencimento_resposta_enviado) 
    WHERE status != 'Concluído' AND status != 'Cancelado';
CREATE INDEX idx_devolucoes_sla_resolucao ON devolucoes(data_entrada, data_resolucao, alerta_resolucao_enviado, vencimento_resolucao_enviado) 
    WHERE status != 'Concluído' AND status != 'Cancelado';

-- 3. Tabela de Histórico de Ações (Auditoria)
CREATE TABLE historico_acoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    devolucao_id UUID NOT NULL REFERENCES devolucoes(id) ON DELETE CASCADE,
    tipo_acao VARCHAR(40) NOT NULL,
    usuario_responsavel VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_historico_devolucao_id ON historico_acoes(devolucao_id);

-- 4. Tabela de Log de Disparo de E-mails de Alerta
CREATE TABLE logs_alertas_email (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    devolucao_id UUID NOT NULL REFERENCES devolucoes(id) ON DELETE CASCADE,
    tipo_sla VARCHAR(30) NOT NULL, -- SLA_RESPOSTA | SLA_RESOLUCAO
    tipo_alerta VARCHAR(30) NOT NULL, -- AVISO_PREVIO | VENCIDO
    destinatarios TEXT NOT NULL,
    assunto VARCHAR(255) NOT NULL,
    status_envio VARCHAR(20) NOT NULL DEFAULT 'ENVIADO',
    data_disparo TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

export const TRIGGER_APPS_SCRIPT_CODE = `/**
 * AUTOMAÇÃO DE ALERTAS DE SLA DE LOGÍSTICA REVERSA (GOOGLE APPS SCRIPT)
 * Executado via Cron / Time-Driven Trigger a cada 15 ou 30 minutos.
 */
function verificarSLAsEDispararAlertas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abaDevolucoes = ss.getSheetByName("Devoluções");
  const dados = abaDevolucoes.getDataRange().getValues();
  
  const AGORA = new Date();
  
  // Mapeamento das colunas (considerando cabeçalho na linha 1)
  // Colunas: [0:ID, 1:Cliente, 2:Cotação, 3:Rastreio, 4:Motivo, 5:Data Entrada, 6:E-mails, 7:SLA Resp(h), 8:SLA Res(d), 9:Status, 10:1ª Ação, 11:Resolução, 12:AlertaResp, 13:VencResp, 14:AlertaRes, 15:VencRes]
  
  for (let i = 1; i < dados.length; i++) {
    const linha = dados[i];
    const status = linha[9];
    
    // Ignorar casos encerrados
    if (status === "Concluído" || status === "Cancelado") continue;
    
    const cotacao = linha[2];
    const cliente = linha[1];
    const rastreio = linha[3];
    const motivo = linha[4];
    const dataEntrada = new Date(linha[5]);
    const emailsResponsaveis = linha[6]; // string com emails separados por virgula
    const slaRespostaHoras = Number(linha[7]) || 24;
    const slaResolucaoDias = Number(linha[8]) || 5;
    
    const dataPrimeiraAcao = linha[10] ? new Date(linha[10]) : null;
    const dataResolucao = linha[11] ? new Date(linha[11]) : null;
    
    let alertaRespEnviado = linha[12] === true || linha[12] === "SIM";
    let vencRespEnviado = linha[13] === true || linha[13] === "SIM";
    let alertaResEnviado = linha[14] === true || linha[14] === "SIM";
    let vencResEnviado = linha[15] === true || linha[15] === "SIM";

    // -------------------------------------------------------------
    // 1. CHECAGEM DO SLA DE RESPOSTA (se ainda não houve 1ª Ação)
    // -------------------------------------------------------------
    if (!dataPrimeiraAcao) {
      const limiteResposta = new Date(dataEntrada.getTime() + (slaRespostaHoras * 60 * 60 * 1000));
      const tempoRestanteMs = limiteResposta.getTime() - AGORA.getTime();
      const tempoTotalMs = slaRespostaHoras * 60 * 60 * 1000;
      const pctConsumido = ((tempoTotalMs - tempoRestanteMs) / tempoTotalMs) * 100;

      // Vencido
      if (AGORA > limiteResposta && !vencRespEnviado) {
        enviarEmailAlerta(emailsResponsaveis, "🚨 VENCIDO: SLA de Resposta", cliente, cotacao, rastreio, motivo, "O SLA de 1ª Resposta expirou sem atendimento.");
        abaDevolucoes.getRange(i + 1, 14).setValue("SIM"); // VencResp = SIM
      } 
      // Alerta Prévio (>= 75% consumido)
      else if (pctConsumido >= 75 && !alertaRespEnviado && !vencRespEnviado) {
        enviarEmailAlerta(emailsResponsaveis, "⚠️ ALERTA: SLA de Resposta prestes a vencer", cliente, cotacao, rastreio, motivo, "O SLA de 1ª Resposta atingiu 75% do prazo.");
        abaDevolucoes.getRange(i + 1, 13).setValue("SIM"); // AlertaResp = SIM
      }
    }

    // -------------------------------------------------------------
    // 2. CHECAGEM DO SLA DE RESOLUÇÃO (se ainda não resolvido)
    // -------------------------------------------------------------
    if (!dataResolucao && status !== "Concluído") {
      const limiteResolucao = new Date(dataEntrada.getTime() + (slaResolucaoDias * 24 * 60 * 60 * 1000));
      const tempoRestanteMs = limiteResolucao.getTime() - AGORA.getTime();
      const tempoTotalMs = slaResolucaoDias * 24 * 60 * 60 * 1000;
      const pctConsumido = ((tempoTotalMs - tempoRestanteMs) / tempoTotalMs) * 100;

      // Vencido
      if (AGORA > limiteResolucao && !vencResEnviado) {
        enviarEmailAlerta(emailsResponsaveis, "🚨 VENCIDO: SLA de Resolução Final", cliente, cotacao, rastreio, motivo, "O prazo para resolução final da devolução expirou.");
        abaDevolucoes.getRange(i + 1, 16).setValue("SIM"); // VencRes = SIM
      } 
      // Alerta Prévio (>= 80% consumido)
      else if (pctConsumido >= 80 && !alertaResEnviado && !vencResEnviado) {
        enviarEmailAlerta(emailsResponsaveis, "⚠️ ALERTA: SLA de Resolução prestes a vencer", cliente, cotacao, rastreio, motivo, "O processo de devolução consumiu 80% do tempo estipulado.");
        abaDevolucoes.getRange(i + 1, 15).setValue("SIM"); // AlertaRes = SIM
      }
    }
  }
}

function enviarEmailAlerta(destinatarios, titulo, cliente, cotacao, rastreio, motivo, mensagemSla) {
  const assunto = \`[LOGÍSTICA REVERSA] \${titulo} - Cotação: \${cotacao} | \${cliente}\`;
  const corpo = \`
    Olá,\n\n
    Atenção para o processo de logística reversa do cliente \${cliente}.\n\n
    Cotação: \${cotacao}\n
    Código Rastreio: \${rastreio}\n
    Motivo: \${motivo}\n\n
    Situação: \${mensagemSla}\n\n
    Acesse o sistema para atuar imediatamente.
  \`;
  
  GmailApp.sendEmail(destinatarios, assunto, corpo);
}
`;

export const PLATFORM_RECOMMENDATIONS: PlatformComparison[] = [
  {
    plataforma: 'Google Sheets + Apps Script',
    tempoImplementacao: '⚡ Muito Rápido (1 a 2 dias)',
    custoLicenciamento: '💚 Gratuito (Incluso no Workspace / Gmail)',
    escalabilidade: '⚠️ Baixa / Média (< 10.000 registros)',
    facilidadeGatilhosEmail: '⭐⭐⭐⭐⭐ Nativa via Time-driven Triggers & GmailApp',
    uxUI: '⭐⭐ Simples (Tabela e Formulário do Google Forms)',
    pontuacaoGeral: 4.3,
    recomendadoPara: 'PMEs, Startups e equipes operacionais que precisam colocar o sistema no ar IMEDIATAMENTE sem custos de licenças adicionais.',
    pontosFortes: [
      'Custo zero de infraestrutura e licenças',
      'Disparo nativo e ilimitado de e-mails via Gmail/Google Workspace',
      'Configuração de gatilhos temporais em 2 cliques',
      'Facilidade de exportação para Excel/BI'
    ],
    pontosAtenção: [
      'Interface crua baseada em planilha',
      'Limite de linhas no Google Sheets se o volume explodir',
      'Concorrência de edição por múltiplos usuários'
    ],
    veredictoTecnico: '🥇 RECOMENDAÇÃO #1 PARA VELOCIDADE E CUSTO: Ideal para iniciar hoje mesmo sem burocracia corporativa ou aprovação de orçamento.'
  },
  {
    plataforma: 'AppSheet (Google Cloud)',
    tempoImplementacao: '🚀 Rápido (3 a 5 dias)',
    custoLicenciamento: '💵 Baixo (~US$ 5 a 10 / usuário / mês ou incluso em planos Workspace Enterprise)',
    escalabilidade: '⭐⭐⭐⭐ Boa (Suporta Sheets, Cloud SQL e BigQuery)',
    facilidadeGatilhosEmail: '⭐⭐⭐⭐⭐ Automações e Bot Workflows nativos com templates HTML',
    uxUI: '⭐⭐⭐⭐ Excelente UI mobile e web gerada automaticamente',
    pontuacaoGeral: 4.7,
    recomendadoPara: 'Empresas que desejam um App Mobile e Web moderno, responsivo, sem digitar código tradicional, mantendo dados no Google Sheets ou SQL.',
    pontosFortes: [
      'Transforma planilhas ou SQL em App profissional instantaneamente',
      'Workflows automáticos de e-mail e notificações Push',
      'Interface nativa para celulares, tablets e desktop',
      'Leitor de código de barras / QR Code via câmera do celular para código de rastreio'
    ],
    pontosAtenção: [
      'Licenciamento por usuário ativo se for utilizado fora do ambiente Enterprise',
      'Personalização de layouts limitada aos componentes do AppSheet'
    ],
    veredictoTecnico: '🏆 RECOMENDAÇÃO #1 EM PRODUTIVIDADE CORPORATIVA NO-CODE: A melhor combinação entre agilidade, interface moderna e facilidade de automação.'
  },
  {
    plataforma: 'Power Apps + Power Automate',
    tempoImplementacao: '⏱️ Médio (1 a 2 semanas)',
    custoLicenciamento: '💵💵 Pago (Incluso em licenças M365 E3/E5 ou Pague por App ~US$ 5/mês)',
    escalabilidade: '⭐⭐⭐⭐⭐ Alta (Integração direta com Dataverse, SharePoint, SQL Server)',
    facilidadeGatilhosEmail: '⭐⭐⭐⭐⭐ Excelente integração nativa com Outlook via Power Automate',
    uxUI: '⭐⭐⭐⭐ Totalmente customizável estilo Canvas App',
    pontuacaoGeral: 4.5,
    recomendadoPara: 'Empresas que já utilizam a suíte Microsoft 365 / Office 365 e possuem infraestrutura corporativa sob diretrizes de governança.',
    pontosFortes: [
      'Integração perfeita com Microsoft Outlook, Teams e SharePoint',
      'Power Automate gerencia agendamentos e SLAs com precisão de minutos',
      'Segurança corporativa rigorosa (Azure Active Directory / Entra ID)',
      'Possibilidade de criar telas altamente customizadas'
    ],
    pontosAtenção: [
      'Curva de aprendizado das fórmulas Power Fx',
      'Requer governança e permissões no ecossistema Microsoft 365'
    ],
    veredictoTecnico: '🏢 RECOMENDAÇÃO #1 PARA AMBIENTES MICROSOFT: A escolha natural se a sua empresa já utiliza Teams, Outlook e SharePoint.'
  },
  {
    plataforma: 'Notion + Make / Zapier',
    tempoImplementacao: '⏱️ Rápido (2 a 4 dias)',
    custoLicenciamento: '💵 Custo do Notion + Custo da ferramenta de automação (Make/Zapier)',
    escalabilidade: '⭐⭐ Baixa (Notion não foi feito para banco relacional pesado)',
    facilidadeGatilhosEmail: '⭐⭐⭐ Requer integração externa via Webhooks',
    uxUI: '⭐⭐⭐⭐ Visual moderno e organizado em cartões/Kanban',
    pontuacaoGeral: 3.5,
    recomendadoPara: 'Equipes que utilizam Notion como base de conhecimento e possuem baixo volume diário de trocas.',
    pontosFortes: [
      'Visual limpo e visualização em formato Kanban (Quadros)',
      'Fácil inclusão de documentação de processos nas próprias páginas'
    ],
    pontosAtenção: [
      'Não possui cronJobs nativos para calcular SLAs e disparar e-mails sem ferramentas externas',
      'Custo extra acumulado por operações no Zapier/Make',
      'Sem validações rígidas de formulário de entrada'
    ],
    veredictoTecnico: '⚠️ NÃO RECOMENDADO PARA CRITICIDADE DE SLA: Falta rigidez em regras de banco de dados e automação nativa.'
  },
  {
    plataforma: 'Desenvolvimento Web Customizado (React + Node + PostgreSQL)',
    tempoImplementacao: '🐢 Longo (3 a 6 semanas)',
    custoLicenciamento: '💻 Custo de servidor (Cloud Run/AWS) + Custo de desenvolvimento',
    escalabilidade: '🚀 Infinita (Sem limites de dados, regras ou usuários)',
    facilidadeGatilhosEmail: '⭐⭐⭐⭐ Total controle via Node-Cron / BullMQ / SendGrid',
    uxUI: '🚀 Pixel-perfect (Interface 100% sob medida)',
    pontuacaoGeral: 4.8,
    recomendadoPara: 'Empresas de grande porte, e-commerces de alto volume ou sistemas integrados diretamente com ERP (SAP, TOTVS, Bling, Tiny).',
    pontosFortes: [
      'Zero dependência de plataformas de terceiros',
      'Regras de negócio ilimitadas e relatórios avançados em tempo real',
      'Auditoria completa de logs e integridade de dados'
    ],
    pontosAtenção: [
      'Maior tempo e custo inicial de desenvolvimento',
      'Necessidade de manutenção contínua de código e servidor'
    ],
    veredictoTecnico: '🎯 SOLUÇÃO DEFINITIVA PARA ALTO VOLUME E INTEGRAÇÃO ERP: O modelo demonstrado neste protótipo representa essa arquitetura!'
  }
];
