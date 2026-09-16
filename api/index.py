# Backend em Python (FastAPI) do Sistema de Logística Reversa & Devoluções.
# Guarda tudo em um banco Postgres de verdade (Vercel Postgres) em vez do
# localStorage do navegador. Usa pg8000 (driver 100% Python, sem nada pra
# compilar) para evitar os erros de build do psycopg2 em ambiente serverless.
import os
import ssl
import json
import uuid
import urllib.request
import urllib.error
from urllib.parse import urlparse
from datetime import datetime, timezone

import pg8000.dbapi as pg
from fastapi import FastAPI, HTTPException, Body

app = FastAPI()

DB_URL = os.environ.get('POSTGRES_URL') or os.environ.get('DATABASE_URL')

MOTIVOS_VALIDOS = {
    'Defeito de Fabricação', 'Avaria no Transporte', 'Produto Incorreto',
    'Arrependimento / Desistência', 'Tamanho ou Modelo Incompatível',
    'Atraso na Entrega', 'Outros'
}


def get_conn():
    if not DB_URL:
        raise HTTPException(500, 'POSTGRES_URL não configurada. Crie um banco em Vercel > Storage > Postgres.')
    u = urlparse(DB_URL)
    return pg.connect(
        user=u.username,
        password=u.password,
        host=u.hostname,
        port=u.port or 5432,
        database=u.path.lstrip('/'),
        ssl_context=ssl.create_default_context()
    )


def rows_as_dicts(cur):
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]


def row_as_dict(cur):
    row = cur.fetchone()
    if row is None:
        return None
    cols = [d[0] for d in cur.description]
    return dict(zip(cols, row))


def as_json_list(value):
    """pg8000 pode devolver jsonb já como list/dict OU como string, dependendo
    da versão — normaliza pra sempre virar objeto Python."""
    if value is None:
        return []
    if isinstance(value, str):
        return json.loads(value)
    return value


def jsonb_param(value):
    """Serializa pra string JSON; usado junto com o cast %s::jsonb no SQL."""
    return json.dumps(value)


def init_db():
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute('''
            CREATE TABLE IF NOT EXISTS returns (
                id TEXT PRIMARY KEY,
                cotacao TEXT NOT NULL,
                codigo_rastreio TEXT NOT NULL,
                motivo_devolucao TEXT NOT NULL,
                motivo_detalhado TEXT,
                data_entrada TIMESTAMPTZ NOT NULL,
                sla_resposta_horas INTEGER NOT NULL,
                sla_resolucao_dias INTEGER NOT NULL,
                status TEXT NOT NULL,
                data_primeira_acao TIMESTAMPTZ,
                data_resolucao TIMESTAMPTZ,
                emails_responsaveis JSONB NOT NULL DEFAULT '[]'
            )
        ''')
        cur.execute('''
            CREATE TABLE IF NOT EXISTS logs (
                id TEXT PRIMARY KEY,
                return_id TEXT REFERENCES returns(id) ON DELETE CASCADE,
                data TIMESTAMPTZ NOT NULL,
                tipo TEXT NOT NULL,
                usuario TEXT NOT NULL,
                descricao TEXT NOT NULL
            )
        ''')
        cur.execute('''
            CREATE TABLE IF NOT EXISTS email_alerts (
                id TEXT PRIMARY KEY,
                return_id TEXT REFERENCES returns(id) ON DELETE CASCADE,
                cotacao TEXT NOT NULL,
                data_envio TIMESTAMPTZ NOT NULL,
                tipo_sla TEXT NOT NULL,
                tipo_alerta TEXT NOT NULL,
                destinatarios JSONB NOT NULL,
                assunto TEXT NOT NULL,
                corpo_html TEXT NOT NULL
            )
        ''')
        conn.commit()
    finally:
        conn.close()


_initialized = False


def ensure_db():
    global _initialized
    if not _initialized:
        init_db()
        _initialized = True


def iso(dt):
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    dt = dt.astimezone(timezone.utc)
    return dt.strftime('%Y-%m-%dT%H:%M:%S.') + f'{dt.microsecond // 1000:03d}Z'


def new_id(prefix):
    return f'{prefix}-{uuid.uuid4()}'


def serialize_return(row, logs, alerts):
    return {
        'id': row['id'],
        'cotacao': row['cotacao'],
        'codigoRastreio': row['codigo_rastreio'],
        'motivoDevolucao': row['motivo_devolucao'],
        'motivoDetalhado': row['motivo_detalhado'] or '',
        'dataEntrada': iso(row['data_entrada']),
        'emailsResponsaveis': as_json_list(row['emails_responsaveis']),
        'slaRespostaHoras': row['sla_resposta_horas'],
        'slaResolucaoDias': row['sla_resolucao_dias'],
        'status': row['status'],
        'dataPrimeiraAcao': iso(row['data_primeira_acao']),
        'dataResolucao': iso(row['data_resolucao']),
        'logs': logs,
        'alertasEnviados': alerts,
    }


def fetch_return_full(cur, return_id):
    cur.execute('SELECT * FROM returns WHERE id = %s', (return_id,))
    row = row_as_dict(cur)
    if not row:
        return None
    cur.execute('SELECT * FROM logs WHERE return_id = %s ORDER BY data DESC', (return_id,))
    logs = [{
        'id': l['id'], 'data': iso(l['data']), 'tipo': l['tipo'],
        'usuario': l['usuario'], 'descricao': l['descricao']
    } for l in rows_as_dicts(cur)]
    cur.execute('SELECT * FROM email_alerts WHERE return_id = %s ORDER BY data_envio DESC', (return_id,))
    alerts = [{
        'id': a['id'], 'devolucaoId': a['return_id'], 'cotacao': a['cotacao'],
        'dataEnvio': iso(a['data_envio']), 'tipoSla': a['tipo_sla'], 'tipoAlerta': a['tipo_alerta'],
        'destinatarios': as_json_list(a['destinatarios']), 'assunto': a['assunto'], 'corpoHtml': a['corpo_html']
    } for a in rows_as_dicts(cur)]
    return serialize_return(row, logs, alerts)


# ---------------------------------------------------------------------------
# Rotas de devoluções
# ---------------------------------------------------------------------------

@app.get('/api/returns')
def list_returns():
    ensure_db()
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute('SELECT id FROM returns ORDER BY data_entrada DESC')
        ids = [r[0] for r in cur.fetchall()]
        return [fetch_return_full(cur, rid) for rid in ids]
    finally:
        conn.close()


@app.post('/api/returns')
def create_return(payload: dict = Body(...)):
    ensure_db()
    required = ['cotacao', 'codigoRastreio', 'motivoDevolucao', 'dataEntrada', 'emailsResponsaveis']
    for f in required:
        if not payload.get(f):
            raise HTTPException(400, f'Campo obrigatório: {f}')
    if payload['motivoDevolucao'] not in MOTIVOS_VALIDOS:
        raise HTTPException(400, 'motivoDevolucao inválido')

    rid = new_id('ret')
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO returns (id, cotacao, codigo_rastreio, motivo_devolucao, motivo_detalhado,
                data_entrada, sla_resposta_horas, sla_resolucao_dias, status, emails_responsaveis)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb)
        ''', (
            rid, payload['cotacao'].strip().upper(), payload['codigoRastreio'].strip().upper(),
            payload['motivoDevolucao'], payload.get('motivoDetalhado', ''), payload['dataEntrada'],
            int(payload.get('slaRespostaHoras', 24)), int(payload.get('slaResolucaoDias', 5)),
            payload.get('status', 'Em Trânsito'), jsonb_param(payload['emailsResponsaveis'])
        ))
        cur.execute('''
            INSERT INTO logs (id, return_id, data, tipo, usuario, descricao)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (
            new_id('log'), rid, datetime.now(timezone.utc), 'CRIACAO', 'Operador Logístico (Sistema)',
            f"Registro de devolução criado para a cotação {payload['cotacao']}."
        ))
        conn.commit()
        return fetch_return_full(cur, rid)
    finally:
        conn.close()


def _add_log_and_update(cur, return_id, descricao, tipo, usuario, novo_status=None,
                         set_primeira_acao=False, set_resolucao=False):
    cur.execute('SELECT * FROM returns WHERE id = %s', (return_id,))
    row = row_as_dict(cur)
    if not row:
        raise HTTPException(404, 'Devolução não encontrada')

    now = datetime.now(timezone.utc)
    updates = []
    params = []

    if novo_status:
        updates.append('status = %s')
        params.append(novo_status)
    if set_primeira_acao and not row['data_primeira_acao']:
        updates.append('data_primeira_acao = %s')
        params.append(now)
    if set_resolucao and not row['data_resolucao']:
        updates.append('data_resolucao = %s')
        params.append(now)

    if updates:
        params.append(return_id)
        cur.execute(f"UPDATE returns SET {', '.join(updates)} WHERE id = %s", params)

    cur.execute('''
        INSERT INTO logs (id, return_id, data, tipo, usuario, descricao)
        VALUES (%s, %s, %s, %s, %s, %s)
    ''', (new_id('log'), return_id, now, tipo, usuario, descricao))


@app.post('/api/returns/{return_id}/first-action')
def first_action(return_id: str):
    ensure_db()
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute('SELECT status FROM returns WHERE id = %s', (return_id,))
        row = row_as_dict(cur)
        if not row:
            raise HTTPException(404, 'Devolução não encontrada')
        novo_status = 'Em Tratativa' if row['status'] in ('Pendente Ação', 'Em Trânsito') else None
        _add_log_and_update(
            cur, return_id,
            'Primeira resposta ou ação tomada (Etiqueta emitida ou contato iniciado).',
            'PRIMEIRA_ACAO', 'Analista de Atendimento',
            novo_status=novo_status, set_primeira_acao=True
        )
        conn.commit()
        return fetch_return_full(cur, return_id)
    finally:
        conn.close()


@app.post('/api/returns/{return_id}/conclude')
def conclude(return_id: str):
    ensure_db()
    conn = get_conn()
    try:
        cur = conn.cursor()
        _add_log_and_update(
            cur, return_id,
            'Processo de devolução e restituição totalmente concluído.',
            'CONCLUSAO', 'Gestor de Estoque / SAC',
            novo_status='Concluído', set_primeira_acao=True, set_resolucao=True
        )
        conn.commit()
        return fetch_return_full(cur, return_id)
    finally:
        conn.close()


@app.post('/api/returns/{return_id}/logs')
def add_log(return_id: str, payload: dict = Body(...)):
    ensure_db()
    descricao = (payload.get('descricao') or '').strip()
    if not descricao:
        raise HTTPException(400, 'descricao é obrigatória')
    novo_status = payload.get('novoStatus') or None
    conn = get_conn()
    try:
        cur = conn.cursor()
        tipo = 'CONCLUSAO' if novo_status == 'Concluído' else 'ATUALIZACAO'
        _add_log_and_update(
            cur, return_id, descricao, tipo, 'Analista Responsável',
            novo_status=novo_status, set_primeira_acao=True,
            set_resolucao=(novo_status == 'Concluído')
        )
        conn.commit()
        return fetch_return_full(cur, return_id)
    finally:
        conn.close()


@app.post('/api/returns/{return_id}/emails')
def add_email(return_id: str, payload: dict = Body(...)):
    ensure_db()
    email = (payload.get('email') or '').strip().lower()
    if not email or '@' not in email:
        raise HTTPException(400, 'E-mail inválido')
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute('SELECT emails_responsaveis FROM returns WHERE id = %s', (return_id,))
        row = row_as_dict(cur)
        if not row:
            raise HTTPException(404, 'Devolução não encontrada')
        emails = as_json_list(row['emails_responsaveis'])
        if email in emails:
            raise HTTPException(400, 'Este e-mail já está na lista')
        emails = emails + [email]
        cur.execute('UPDATE returns SET emails_responsaveis = %s::jsonb WHERE id = %s',
                    (jsonb_param(emails), return_id))
        conn.commit()
        return fetch_return_full(cur, return_id)
    finally:
        conn.close()


@app.delete('/api/returns/{return_id}/emails/{email}')
def remove_email(return_id: str, email: str):
    ensure_db()
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute('SELECT emails_responsaveis FROM returns WHERE id = %s', (return_id,))
        row = row_as_dict(cur)
        if not row:
            raise HTTPException(404, 'Devolução não encontrada')
        emails = [e for e in as_json_list(row['emails_responsaveis']) if e != email]
        cur.execute('UPDATE returns SET emails_responsaveis = %s::jsonb WHERE id = %s',
                    (jsonb_param(emails), return_id))
        conn.commit()
        return fetch_return_full(cur, return_id)
    finally:
        conn.close()


@app.post('/api/reset')
def reset_data():
    ensure_db()
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute('DELETE FROM returns')
        conn.commit()
        return {'ok': True}
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Varredura de SLA + envio de e-mail (Resend) — chamada pelo front a cada minuto
# ---------------------------------------------------------------------------

def escape_html(value):
    return (value or '').replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;') \
        .replace('"', '&quot;').replace("'", '&#39;')


def send_resend_email(to, subject, html):
    api_key = os.environ.get('RESEND_API_KEY')
    if not api_key:
        print('RESEND_API_KEY não configurada — pulando envio.')
        return
    payload = json.dumps({
        'from': 'Logística Reversa <onboarding@resend.dev>',
        'to': to, 'subject': subject, 'html': html
    }).encode('utf-8')
    req = urllib.request.Request(
        'https://api.resend.com/emails', data=payload, method='POST',
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'}
    )
    try:
        urllib.request.urlopen(req)
    except urllib.error.HTTPError as e:
        print('Erro ao enviar e-mail via Resend:', e.read())
    except Exception as e:
        print('Erro de rede ao enviar e-mail:', e)


def build_email(item, tipo_sla, tipo_alerta):
    is_resposta = tipo_sla == 'SLA_RESPOSTA'
    is_vencido = tipo_alerta == 'VENCIDO'
    sla_nome = 'SLA de Primeira Resposta' if is_resposta else 'SLA de Resolução Final'
    status_str = '🚨 VENCIDO' if is_vencido else '⚠️ PRESTES A VENCER (ALERTA)'
    cotacao = escape_html(item['cotacao'])
    rastreio = escape_html(item['codigo_rastreio'])
    motivo = escape_html(item['motivo_devolucao'])
    status = escape_html(item['status'])
    assunto = f"[LOGÍSTICA REVERSA] {status_str} - Cotação: {item['cotacao']}"
    cor = '#8e2e22' if is_vencido else '#b7791f'
    emails_str = ', '.join(escape_html(e) for e in as_json_list(item['emails_responsaveis']))
    mensagem = ('⚠️ <strong>Ação imediata necessária!</strong> O tempo limite estipulado foi ultrapassado sem a conclusão da etapa.'
                if is_vencido else
                '⌛ <strong>Atenção ao prazo:</strong> O limite de tempo está próximo de expirar. Por favor, acesse o sistema para atuar na solicitação.')
    corpo = f'''
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background-color: #ffffff;">
      <div style="background-color: {cor}; color: #ffffff; padding: 12px 16px; border-radius: 6px; font-size: 16px; font-weight: bold; margin-bottom: 20px;">
        {status_str}: {sla_nome}
      </div>
      <p style="font-size: 15px; color: #334155;">Olá, Equipe de Atendimento / Logística,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.5;">
        A devolução registrada para a cotação <strong>{cotacao}</strong> atingiu o gatilho de notificação para o <strong>{sla_nome}</strong>.
      </p>
      <div style="background-color: #f8fafc; border-left: 4px solid {cor}; padding: 14px; margin: 16px 0; border-radius: 4px;">
        <table style="width: 100%; font-size: 13px; color: #334155;">
          <tr><td style="padding: 4px 0;"><strong>Cotação:</strong></td><td>{cotacao}</td></tr>
          <tr><td style="padding: 4px 0;"><strong>Código Rastreio:</strong></td><td><code>{rastreio}</code></td></tr>
          <tr><td style="padding: 4px 0;"><strong>Motivo:</strong></td><td>{motivo}</td></tr>
          <tr><td style="padding: 4px 0;"><strong>Status Atual:</strong></td><td><span style="background-color: #e2e8f0; padding: 2px 8px; border-radius: 4px;">{status}</span></td></tr>
        </table>
      </div>
      <p style="font-size: 14px; color: #334155;">{mensagem}</p>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
        E-mails notificados: {emails_str}<br/>
        Disparado automaticamente pelo Sistema de Gestão de Logística Reversa.
      </div>
    </div>
    '''
    return assunto, corpo


@app.post('/api/scan')
def scan():
    ensure_db()
    now = datetime.now(timezone.utc)
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM returns WHERE status NOT IN ('Concluído', 'Cancelado')")
        items = rows_as_dicts(cur)

        for item in items:
            entrada = item['data_entrada']
            if entrada.tzinfo is None:
                entrada = entrada.replace(tzinfo=timezone.utc)
            emails = as_json_list(item['emails_responsaveis'])

            # SLA de Resposta
            if not item['data_primeira_acao']:
                limite = entrada.timestamp() + item['sla_resposta_horas'] * 3600
                decorrido_pct = (now.timestamp() - entrada.timestamp()) / (item['sla_resposta_horas'] * 3600) * 100
                tipo_alerta = None
                if now.timestamp() > limite:
                    tipo_alerta = 'VENCIDO'
                elif decorrido_pct >= 75:
                    tipo_alerta = 'AVISO_PREVIO'
                if tipo_alerta:
                    cur.execute('''SELECT 1 FROM email_alerts WHERE return_id = %s AND tipo_sla = 'SLA_RESPOSTA' AND tipo_alerta = %s''',
                                (item['id'], tipo_alerta))
                    if not cur.fetchone():
                        assunto, corpo = build_email(item, 'SLA_RESPOSTA', tipo_alerta)
                        cur.execute('''
                            INSERT INTO email_alerts (id, return_id, cotacao, data_envio, tipo_sla, tipo_alerta, destinatarios, assunto, corpo_html)
                            VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s)
                        ''', (new_id('alt'), item['id'], item['cotacao'], now, 'SLA_RESPOSTA', tipo_alerta,
                              jsonb_param(emails), assunto, corpo))
                        send_resend_email(emails, assunto, corpo)

            # SLA de Resolução
            if not item['data_resolucao']:
                limite = entrada.timestamp() + item['sla_resolucao_dias'] * 86400
                decorrido_pct = (now.timestamp() - entrada.timestamp()) / (item['sla_resolucao_dias'] * 86400) * 100
                tipo_alerta = None
                if now.timestamp() > limite:
                    tipo_alerta = 'VENCIDO'
                elif decorrido_pct >= 80:
                    tipo_alerta = 'AVISO_PREVIO'
                if tipo_alerta:
                    cur.execute('''SELECT 1 FROM email_alerts WHERE return_id = %s AND tipo_sla = 'SLA_RESOLUCAO' AND tipo_alerta = %s''',
                                (item['id'], tipo_alerta))
                    if not cur.fetchone():
                        assunto, corpo = build_email(item, 'SLA_RESOLUCAO', tipo_alerta)
                        cur.execute('''
                            INSERT INTO email_alerts (id, return_id, cotacao, data_envio, tipo_sla, tipo_alerta, destinatarios, assunto, corpo_html)
                            VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s)
                        ''', (new_id('alt'), item['id'], item['cotacao'], now, 'SLA_RESOLUCAO', tipo_alerta,
                              jsonb_param(emails), assunto, corpo))
                        send_resend_email(emails, assunto, corpo)

        conn.commit()
        return {'ok': True}
    finally:
        conn.close()
