// Função serverless da Vercel: recebe os dados do alerta de SLA e usa a API
// do Resend para disparar o e-mail de verdade. A chave RESEND_API_KEY fica
// só aqui no servidor (variável de ambiente), nunca é exposta ao navegador.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { to, subject, html } = req.body || {};

  if (!to || !Array.isArray(to) || to.length === 0 || !subject || !html) {
    return res.status(400).json({ error: 'Campos obrigatórios: to (array), subject, html' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY não configurada nas variáveis de ambiente da Vercel.' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Logística Reversa <onboarding@resend.dev>',
        to,
        subject,
        html
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erro desconhecido ao enviar e-mail.' });
  }
}
