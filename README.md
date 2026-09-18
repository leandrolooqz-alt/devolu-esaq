# Sistema de Logística Reversa — v2

Reestruturação do projeto original com **backend Python/FastAPI** e **frontend React + CSS**.

## Estrutura

- `backend.py` — API REST, regras de SLA e persistência JSON.
- `data/returns.json` — base local simples para desenvolvimento.
- `src/App.tsx` — interface e fluxo principal.
- `src/api.ts` — comunicação com o backend.
- `src/index.css` — identidade visual, responsividade e componentes visuais.
- `requirements.txt` — dependências Python.

## Rodar backend

```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend:app --reload --port 8000
```

## Rodar frontend

```bash
npm install
npm run dev
```

Crie `.env.local` se o backend estiver separado:

```env
VITE_API_URL=http://localhost:8000
```

## E-mail e alertas automáticos

A integração usa a API do **Resend**. Configure no backend: `RESEND_API_KEY` e, em produção, `RESEND_FROM` com um remetente aceito pelo Resend. O painel possui o botão **Testar e-mail**, que envia uma mensagem real para o endereço informado e mostra o erro devolvido pela API quando houver falha. O Resend disponibiliza envio por API e exemplos oficiais para FastAPI/Python.

A rotina `POST /api/alerts/scan` verifica os SLAs e envia alertas de aviso e de vencimento. Falhas de envio não são marcadas como concluídas, permitindo nova tentativa no próximo ciclo.

Para execução automática mesmo sem o painel aberto, existe `GET /api/cron/alerts`, protegido por `CRON_SECRET`. O `vercel.json` já deixa o Cron configurado para consultar a rotina a cada minuto; confira no plano de deploy qual frequência de Cron está disponível para sua conta.

Exemplo:

```json
{
  "crons": [
    {
      "path": "/api/cron/alerts",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Configure também `CRON_SECRET` nas variáveis de ambiente. O backend espera `Authorization: Bearer <CRON_SECRET>` nas chamadas automáticas.

### Observação de deploy

O arquivo JSON é adequado para demonstração e desenvolvimento. Para produção com múltiplos usuários, substitua a persistência por PostgreSQL/MySQL. O código foi separado para que essa troca possa ser feita sem refazer a interface.

## Padrão de comentários

O código usa comentários no formato solicitado:

```text
# Coluna: nome_da_coluna
# Título: finalidade
# Fazer: comportamento esperado
```

Use o mesmo padrão ao criar novos campos, endpoints ou componentes.
