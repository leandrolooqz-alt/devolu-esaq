"""Backend FastAPI do Sistema de Logística Reversa.

# Coluna: id
# Título: Identificador do chamado
# Fazer: Gerar um UUID único para cada devolução.

# Coluna: dataEntrada
# Título: Data de entrada
# Fazer: Servir de ponto inicial para os cálculos de SLA.
"""
from __future__ import annotations

import json
import os
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = Path(os.getenv("DATA_FILE", BASE_DIR / "data" / "returns.json"))
DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
LOCK = threading.Lock()

app = FastAPI(title="Logística Reversa API", version="2.0.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(CORSMiddleware, allow_origins=[o.strip() for o in origins if o.strip()], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

STATUSES = {
    "Em Trânsito", "Pendente Ação", "Em Tratativa", "Aguardando Cliente",
    "Aguardando Resposta do Fornecedor", "Em Análise Técnica", "Recusado",
    "Reenviado ao Cliente", "Concluído", "Cancelado"
}

class ReturnCreate(BaseModel):
    cotacao: str
    codigoRastreio: str
    motivoDevolucao: str
    motivoDetalhado: str = ""
    dataEntrada: str
    emailsResponsaveis: list[str] = Field(default_factory=list)
    slaRespostaHoras: float = 24
    slaResolucaoDias: float = 5
    # Coluna: status
    # Título: Situação inicial da devolução
    # Fazer: Toda nova devolução começa como Em Trânsito.
    status: str = "Em Trânsito"
    # Coluna: observacoes
    # Título: Descrição inicial
    # Fazer: Registrar automaticamente que o produto está em trânsito.
    observacoes: str = "Produto em trânsito."

class LogCreate(BaseModel):
    descricao: str
    novoStatus: str | None = None

class EmailCreate(BaseModel):
    email: str


class TestEmailCreate(BaseModel):
    # Coluna: email
    # Título: Destinatário do teste
    # Fazer: Receber uma mensagem real do Resend para validar a integração.
    email: str


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def read_all() -> list[dict[str, Any]]:
    with LOCK:
        if not DATA_FILE.exists():
            return []
        try:
            return json.loads(DATA_FILE.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return []


def write_all(items: list[dict[str, Any]]) -> None:
    with LOCK:
        tmp = DATA_FILE.with_suffix(".tmp")
        tmp.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp.replace(DATA_FILE)


def calculate_sla(item: dict[str, Any], now: datetime | None = None) -> dict[str, Any]:
    now = now or datetime.now(timezone.utc)
    entrada = datetime.fromisoformat(item["dataEntrada"].replace("Z", "+00:00"))
    resposta_limite = entrada.timestamp() + float(item.get("slaRespostaHoras", 24)) * 3600
    resolucao_limite = entrada.timestamp() + float(item.get("slaResolucaoDias", 5)) * 86400
    now_ts = now.timestamp()

    resposta_cumprida = bool(item.get("dataPrimeiraAcao"))
    resolucao_cumprida = bool(item.get("dataResolucao")) or item.get("status") == "Concluído"
    resposta_pct = min(100, max(0, round(((datetime.fromisoformat(item["dataPrimeiraAcao"].replace("Z", "+00:00")).timestamp() - entrada.timestamp()) / ((resposta_limite - entrada.timestamp()) or 1)) * 100))) if resposta_cumprida else round(((now_ts - entrada.timestamp()) / ((resposta_limite - entrada.timestamp()) or 1)) * 100)
    resolucao_pct = min(100, max(0, round(((datetime.fromisoformat(item.get("dataResolucao", now.isoformat()).replace("Z", "+00:00")).timestamp() - entrada.timestamp()) / ((resolucao_limite - entrada.timestamp()) or 1)) * 100))) if resolucao_cumprida else round(((now_ts - entrada.timestamp()) / ((resolucao_limite - entrada.timestamp()) or 1)) * 100)
    resposta_vencida = not resposta_cumprida and now_ts > resposta_limite
    resolucao_vencida = not resolucao_cumprida and now_ts > resolucao_limite
    resposta_alerta = not resposta_cumprida and not resposta_vencida and resposta_pct >= 75
    resolucao_alerta = not resolucao_cumprida and not resolucao_vencida and resolucao_pct >= 80

    if item.get("status") in {"Concluído", "Cancelado"}:
        urgencia = "CONCLUIDO"
    elif resposta_vencida or resolucao_vencida:
        urgencia = "VENCIDO"
    elif resposta_alerta or resolucao_alerta:
        urgencia = "ALERTA"
    else:
        urgencia = "OK"

    return {
        "respostaCumprida": resposta_cumprida, "respostaVencida": resposta_vencida,
        "respostaAlerta": resposta_alerta, "respostaPercentualConsumido": resposta_pct,
        "respostaMinutosRestantes": round((resposta_limite - now_ts) / 60),
        "dataLimiteResposta": datetime.fromtimestamp(resposta_limite, timezone.utc).isoformat(),
        "resolucaoCumprida": resolucao_cumprida, "resolucaoVencida": resolucao_vencida,
        "resolucaoAlerta": resolucao_alerta, "resolucaoPercentualConsumido": resolucao_pct,
        "resolucaoHorasRestantes": round((resolucao_limite - now_ts) / 3600, 1),
        "dataLimiteResolucao": datetime.fromtimestamp(resolucao_limite, timezone.utc).isoformat(),
        "nivelUrgencia": urgencia,
    }


def add_log(item: dict[str, Any], descricao: str, tipo: str = "ATUALIZACAO", usuario: str = "Analista Responsável") -> None:
    item.setdefault("logs", []).insert(0, {
        "id": f"log-{uuid.uuid4()}", "data": now_iso(), "tipo": tipo,
        "usuario": usuario, "descricao": descricao,
    })



def send_resend_email(to: list[str], subject: str, html: str) -> tuple[bool, str | None, str | None]:
    """
    Envia e-mail pelo Resend e devolve (sucesso, erro, id_do_email).

    # Coluna: RESEND_API_KEY
    # Título: Credencial do serviço de e-mail
    # Fazer: Autorizar o backend a chamar a API do Resend.
    """
    import urllib.error
    import urllib.request

    key = os.getenv("RESEND_API_KEY")
    if not key:
        return False, "RESEND_API_KEY não configurada.", None
    if not to:
        return False, "Nenhum destinatário foi informado.", None

    payload = json.dumps({
        "from": os.getenv("RESEND_FROM", "Logística Reversa <onboarding@resend.dev>"),
        "to": to,
        "subject": subject,
        "html": html,
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            body = json.loads(response.read().decode("utf-8") or "{}")
            return 200 <= response.status < 300, None, body.get("id")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(detail)
            detail = parsed.get("message") or parsed.get("name") or detail
        except json.JSONDecodeError:
            pass
        return False, f"Resend HTTP {exc.code}: {detail}", None
    except Exception as exc:
        return False, str(exc), None


def alert_email(item: dict[str, Any], sla_type: str, alert_type: str, remaining: str) -> tuple[str, str]:
    label = "SLA de resposta" if sla_type == "SLA_RESPOSTA" else "SLA de resolução"
    title = "SLA vencido" if alert_type == "VENCIDO" else "Aviso de SLA"
    subject = f"{title} — {item['cotacao']} — {label}"
    html = f"<div style='font-family:Arial,sans-serif'><h2>{title}</h2><p><b>Cotação:</b> {item['cotacao']}</p><p><b>Rastreio:</b> {item['codigoRastreio']}</p><p><b>Prazo:</b> {remaining}</p><p>Acesse o painel de Logística Reversa para registrar a tratativa.</p></div>"
    return subject, html


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "logistica-reversa-api"}


@app.get("/api/returns")
def list_returns() -> list[dict[str, Any]]:
    return read_all()


@app.post("/api/returns", status_code=201)
def create_return(payload: ReturnCreate) -> dict[str, Any]:
    if payload.status not in STATUSES:
        raise HTTPException(400, "Status inválido")
    item = payload.model_dump()

    # Coluna: status
    # Título: Fluxo inicial
    # Fazer: Garantir que o cadastro novo represente um produto em transporte.
    item["status"] = "Em Trânsito"

    # Coluna: observacoes
    # Título: Descrição automática
    # Fazer: Preencher a descrição padrão caso o usuário não informe outra.
    item["observacoes"] = (item.get("observacoes") or "").strip() or "Produto em trânsito."

    item.update({
        "id": f"ret-{uuid.uuid4()}", "dataPrimeiraAcao": None, "dataResolucao": None,
        "logs": [], "alertasEnviados": [], "criadoEm": now_iso(),
    })
    add_log(item, "Produto em trânsito — devolução cadastrada e aguardando recebimento.", "CRIACAO", "Operador Logístico (Sistema)")
    items = read_all(); items.insert(0, item); write_all(items)
    return item



@app.post("/api/alerts/scan")
def scan_alerts() -> dict[str, int]:
    """
    Varre os chamados e envia avisos/vencimentos de SLA.

    # Coluna: alertasEnviados
    # Título: Controle de notificações
    # Fazer: Garantir que cada alerta seja enviado uma vez quando houver sucesso.
    # Fazer: Repetir automaticamente em ciclos futuros se o envio anterior falhar.
    """
    items = read_all()
    enviados = 0
    falhas = 0
    pendentes = 0
    changed = False

    for item in items:
        if item.get("status") in {"Concluído", "Cancelado"}:
            continue

        sla = calculate_sla(item)
        logs = item.setdefault("alertasEnviados", [])
        checks: list[tuple[str, str, str]] = []

        if not item.get("dataPrimeiraAcao"):
            if sla["respostaVencida"]:
                checks.append(("SLA_RESPOSTA", "VENCIDO", "Vencido"))
            elif sla["respostaAlerta"]:
                checks.append(("SLA_RESPOSTA", "AVISO_PREVIO", format_minutes(sla["respostaMinutosRestantes"])))

        if not item.get("dataResolucao"):
            if sla["resolucaoVencida"]:
                checks.append(("SLA_RESOLUCAO", "VENCIDO", "Vencido"))
            elif sla["resolucaoAlerta"]:
                checks.append(("SLA_RESOLUCAO", "AVISO_PREVIO", format_hours(sla["resolucaoHorasRestantes"])))

        for sla_type, alert_type, remaining in checks:
            # Coluna: alertasEnviados.tipoSla + tipoAlerta + enviado
            # Título: Idempotência
            # Fazer: Não duplicar apenas alertas efetivamente enviados.
            if any(x.get("tipoSla") == sla_type and x.get("tipoAlerta") == alert_type and x.get("enviado") for x in logs):
                continue

            destinatarios = item.get("emailsResponsaveis", [])
            if not destinatarios:
                pendentes += 1
                continue

            subject, html = alert_email(item, sla_type, alert_type, remaining)
            ok, error, email_id = send_resend_email(destinatarios, subject, html)
            logs.insert(0, {
                "id": f"alt-{uuid.uuid4()}",
                "devolucaoId": item["id"],
                "cotacao": item["cotacao"],
                "dataEnvio": now_iso(),
                "tipoSla": sla_type,
                "tipoAlerta": alert_type,
                "destinatarios": destinatarios,
                "assunto": subject,
                "corpoHtml": html,
                "enviado": ok,
                "erro": error,
                "emailId": email_id,
            })
            changed = True
            if ok:
                enviados += 1
            else:
                falhas += 1

    if changed:
        write_all(items)
    return {"alertasEnviados": enviados, "falhas": falhas, "pendentes": pendentes}


@app.get("/api/cron/alerts")
def cron_alerts(request: Request) -> dict[str, int | str]:
    """Endpoint para scheduler externo/Vercel Pro.

    # Coluna: CRON_SECRET
    # Título: Proteção do agendador
    # Fazer: Aceitar chamadas automáticas somente com o token configurado.
    """
    secret = os.getenv("CRON_SECRET")
    if not secret:
        raise HTTPException(503, "CRON_SECRET não configurada no ambiente.")
    if request.headers.get("authorization") != f"Bearer {secret}":
        raise HTTPException(401, "Cron não autorizado.")
    return {"status": "ok", **scan_alerts()}


@app.get("/api/email/status")
def email_status() -> dict[str, Any]:
    """Informa se o Resend está pronto, sem expor a chave.

    # Coluna: RESEND_API_KEY / RESEND_FROM
    # Título: Saúde da integração de e-mail
    # Fazer: Permitir que o front-end mostre se a configuração básica existe.
    """
    return {
        "configured": bool(os.getenv("RESEND_API_KEY")),
        "from": os.getenv("RESEND_FROM", "Logística Reversa <onboarding@resend.dev>"),
    }


@app.post("/api/email/test")
def test_email(payload: TestEmailCreate) -> dict[str, Any]:
    """Envia um e-mail real de teste.

    # Coluna: email
    # Título: Teste de integração
    # Fazer: Validar a comunicação entre o backend e o Resend.
    """
    email = payload.email.strip()
    if "@" not in email or "." not in email.rsplit("@", 1)[-1]:
        raise HTTPException(400, "Informe um endereço de e-mail válido.")

    subject = "Teste de e-mail — Logística Reversa"
    html = (
        "<div style='font-family:Arial,sans-serif;max-width:620px;margin:auto'>"
        "<h2 style='color:#315c9a'>Integração de e-mail funcionando</h2>"
        "<p>Este é um e-mail de teste enviado pelo painel de Logística Reversa.</p>"
        f"<p><b>Data:</b> {datetime.now(timezone.utc).astimezone().strftime('%d/%m/%Y %H:%M:%S')}</p>"
        "<p>Se você recebeu esta mensagem, a integração com o Resend está respondendo corretamente.</p>"
        "</div>"
    )
    ok, error, email_id = send_resend_email([email], subject, html)
    if not ok:
        raise HTTPException(502, error or "O Resend recusou o envio.")
    return {"status": "sent", "email": email, "emailId": email_id}

def format_minutes(minutes: int) -> str:
    if minutes <= 0: return "Vencido"
    return f"{minutes // 60}h {minutes % 60}min restantes" if minutes >= 60 else f"{minutes}min restantes"

def format_hours(hours: float) -> str:
    if hours <= 0: return "Vencido"
    return f"{hours:.1f}h restantes"

@app.post("/api/returns/{return_id}/first-action")
def first_action(return_id: str) -> dict[str, Any]:
    items = read_all(); item = next((x for x in items if x["id"] == return_id), None)
    if not item: raise HTTPException(404, "Devolução não encontrada")
    timestamp = now_iso(); item["dataPrimeiraAcao"] = timestamp
    if item["status"] in {"Pendente Ação", "Em Trânsito"}: item["status"] = "Em Tratativa"
    add_log(item, "Primeira resposta ou ação tomada (etiqueta emitida ou contato iniciado).", "PRIMEIRA_ACAO", "Analista de Atendimento")
    write_all(items); return item


@app.post("/api/returns/{return_id}/conclude")
def conclude(return_id: str) -> dict[str, Any]:
    items = read_all(); item = next((x for x in items if x["id"] == return_id), None)
    if not item: raise HTTPException(404, "Devolução não encontrada")
    timestamp = now_iso(); item["dataPrimeiraAcao"] = item.get("dataPrimeiraAcao") or timestamp
    item["dataResolucao"] = timestamp; item["status"] = "Concluído"
    add_log(item, "Processo de devolução e restituição totalmente concluído.", "CONCLUSAO", "Gestor de Estoque / SAC")
    write_all(items); return item


@app.post("/api/returns/{return_id}/logs")
def create_log(return_id: str, payload: LogCreate) -> dict[str, Any]:
    items = read_all(); item = next((x for x in items if x["id"] == return_id), None)
    if not item: raise HTTPException(404, "Devolução não encontrada")
    if payload.novoStatus and payload.novoStatus not in STATUSES: raise HTTPException(400, "Status inválido")
    if payload.novoStatus: item["status"] = payload.novoStatus
    timestamp = now_iso(); item["dataPrimeiraAcao"] = item.get("dataPrimeiraAcao") or timestamp
    if item["status"] == "Concluído": item["dataResolucao"] = item.get("dataResolucao") or timestamp
    add_log(item, payload.descricao)
    write_all(items); return item


@app.post("/api/returns/{return_id}/emails")
def add_email(return_id: str, payload: EmailCreate) -> dict[str, Any]:
    items = read_all(); item = next((x for x in items if x["id"] == return_id), None)
    if not item: raise HTTPException(404, "Devolução não encontrada")
    if payload.email not in item.setdefault("emailsResponsaveis", []): item["emailsResponsaveis"].append(payload.email)
    write_all(items); return item


@app.delete("/api/returns/{return_id}/emails/{email}")
def remove_email(return_id: str, email: str) -> dict[str, Any]:
    items = read_all(); item = next((x for x in items if x["id"] == return_id), None)
    if not item: raise HTTPException(404, "Devolução não encontrada")
    item["emailsResponsaveis"] = [e for e in item.get("emailsResponsaveis", []) if e != email]
    write_all(items); return item


@app.post("/api/returns/reset")
def reset_returns() -> dict[str, str]:
    write_all([]); return {"status": "reset"}
