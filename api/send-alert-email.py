# Função serverless da Vercel (runtime Python): recebe os dados do alerta de
# SLA e usa a API do Resend para disparar o e-mail de verdade. A chave
# RESEND_API_KEY fica só aqui no servidor (variável de ambiente), nunca é
# exposta ao navegador. Só usa a biblioteca padrão do Python (sem pip install).
from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request
import urllib.error


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            raw_body = self.rfile.read(content_length) if content_length > 0 else b'{}'
            data = json.loads(raw_body)
        except Exception:
            self._send_json(400, {'error': 'Corpo da requisição inválido (JSON esperado).'})
            return

        to = data.get('to')
        subject = data.get('subject')
        html = data.get('html')

        if not to or not isinstance(to, list) or len(to) == 0 or not subject or not html:
            self._send_json(400, {'error': 'Campos obrigatórios: to (array), subject, html'})
            return

        api_key = os.environ.get('RESEND_API_KEY')
        if not api_key:
            self._send_json(500, {'error': 'RESEND_API_KEY não configurada nas variáveis de ambiente da Vercel.'})
            return

        payload = json.dumps({
            'from': 'Logística Reversa <onboarding@resend.dev>',
            'to': to,
            'subject': subject,
            'html': html
        }).encode('utf-8')

        req = urllib.request.Request(
            'https://api.resend.com/emails',
            data=payload,
            method='POST',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
        )

        try:
            with urllib.request.urlopen(req) as resp:
                self._send_raw(resp.status, resp.read())
        except urllib.error.HTTPError as e:
            self._send_raw(e.code, e.read())
        except Exception as e:
            self._send_json(500, {'error': str(e)})

    def _send_json(self, status, obj):
        self._send_raw(status, json.dumps(obj).encode('utf-8'))

    def _send_raw(self, status, body_bytes):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(body_bytes)
