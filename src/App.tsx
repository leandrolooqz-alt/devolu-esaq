import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Activity, Bell, Boxes, CheckCircle2, CircleCheck, CircleX, Clock3, MailCheck, Plus, RefreshCw, Send, ShieldAlert, X } from 'lucide-react';
import { api } from './api';
import { ReturnCase, StatusDevolucao } from './types';
import { calculateSlaStatus, formatHoursRemaining, formatTimeRemaining } from './utils/slaCalculations';

const statuses: StatusDevolucao[] = ['Em Trânsito','Pendente Ação','Em Tratativa','Aguardando Cliente','Aguardando Resposta do Fornecedor','Em Análise Técnica','Recusado','Reenviado ao Cliente','Concluído','Cancelado'];
const motivos = ['Defeito de Fabricação','Avaria no Transporte','Produto Incorreto','Arrependimento / Desistência','Tamanho ou Modelo Incompatível','Atraso na Entrega','Outros'];

// Coluna: cotacao / codigoRastreio
// Título: Identificação operacional
// Fazer: Permitir localizar rapidamente uma devolução pelo número da cotação ou rastreio.
export default function App() {
  const [items, setItems] = useState<ReturnCase[]>([]);
  const [selected, setSelected] = useState<ReturnCase | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('TODOS');
  const [slaFilter, setSlaFilter] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEmailTest, setShowEmailTest] = useState(false);
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [emailFrom, setEmailFrom] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      await api.scanAlerts().catch(() => undefined);
      const [returns, email] = await Promise.all([api.list(), api.emailStatus()]);
      setItems(returns);
      setEmailConfigured(email.configured);
      setEmailFrom(email.from);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); const timer = setInterval(load, 60000); return () => clearInterval(timer); }, []);

  const filtered = useMemo(() => items.filter(item => {
    const text = `${item.cotacao} ${item.codigoRastreio} ${item.motivoDevolucao}`.toLowerCase();
    if (query && !text.includes(query.toLowerCase())) return false;
    if (status !== 'TODOS' && item.status !== status) return false;
    if (slaFilter !== 'TODOS' && calculateSlaStatus(item).nivelUrgencia !== slaFilter) return false;
    return true;
  }), [items, query, status, slaFilter]);

  const metrics = useMemo(() => items.reduce((acc, item) => {
    const sla = calculateSlaStatus(item); acc.total++; if (item.status === 'Concluído') acc.done++; else if (sla.nivelUrgencia === 'VENCIDO') acc.expired++; else if (sla.nivelUrgencia === 'ALERTA') acc.alert++; else acc.ok++; return acc;
  }, { total: 0, done: 0, expired: 0, alert: 0, ok: 0 }), [items]);

  const replace = (updated: ReturnCase) => { setItems(prev => prev.map(i => i.id === updated.id ? updated : i)); setSelected(updated); };

  const reset = async () => { if (!confirm('Deseja apagar os dados atuais e iniciar uma nova base?')) return; await api.reset(); setSelected(null); await load(); };

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><Boxes size={23}/></div><div><div className="eyebrow">PAINEL OPERACIONAL</div><h1>Logística Reversa</h1><p>Controle de devoluções, prazos e alertas de SLA</p></div></div>
      <div className="top-actions"><div className="live"><span/> Sistema conectado</div><button className={`button email-test ${emailConfigured ? 'ready' : ''}`} onClick={() => setShowEmailTest(true)}><MailCheck size={16}/> Testar e-mail</button><button className="icon-button" onClick={load} title="Verificar SLAs e atualizar"><RefreshCw size={17}/></button><button className="button primary" onClick={() => setShowNew(true)}><Plus size={17}/> Nova devolução</button></div>
    </header>

    <main className="content">
      <section className="hero"><div><span className="section-kicker">VISÃO GERAL</span><h2>Acompanhamento de operações</h2><p>Monitore cada retorno e identifique rapidamente o que exige atenção.</p></div><div className="hero-status"><Activity size={17}/> Atualização automática a cada minuto <span className={emailConfigured ? "mail-state ok" : "mail-state warning"}>{emailConfigured ? "• E-mail configurado" : "• E-mail não configurado"}</span></div></section>
      {error && <div className="alert error"><ShieldAlert size={18}/><span>{error}</span><button onClick={load}><RefreshCw size={15}/> Tentar novamente</button></div>}

      <section className="metrics">
        <Metric icon={<Boxes/>} label="Total em controle" value={metrics.total} hint={`${metrics.done} concluído(s)`}/>
        <Metric icon={<Clock3/>} label="Dentro do SLA" value={metrics.ok} hint="Fluxo regular" tone="success"/>
        <Metric icon={<Bell/>} label="Em alerta" value={metrics.alert} hint="Atenção necessária" tone="warning"/>
        <Metric icon={<ShieldAlert/>} label="SLAs vencidos" value={metrics.expired} hint="Ação necessária" tone="danger"/>
        <Metric icon={<CheckCircle2/>} label="Compliance" value={`${metrics.total ? Math.round(((metrics.ok + metrics.done) / metrics.total) * 100) : 100}%`} hint="Dentro do prazo" tone="info"/>
      </section>

      <section className="panel">
        <div className="panel-head"><div><h3>Devoluções em acompanhamento</h3><span>{filtered.length} registro(s) exibido(s)</span></div><div className="filters"><div className="search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cotação, rastreio ou motivo"/></div><select value={status} onChange={e => setStatus(e.target.value)}><option value="TODOS">Todos os status</option>{statuses.map(s => <option key={s}>{s}</option>)}</select><select value={slaFilter} onChange={e => setSlaFilter(e.target.value)}><option value="TODOS">Todos os SLAs</option><option value="OK">No prazo</option><option value="ALERTA">Em alerta</option><option value="VENCIDO">Vencido</option><option value="CONCLUIDO">Concluído</option></select></div></div>
        {loading ? <div className="empty"><div className="spinner"/><p>Carregando operações...</p></div> : filtered.length === 0 ? <div className="empty"><Boxes size={30}/><h4>Nenhuma devolução encontrada</h4><p>Cadastre uma nova devolução para começar o acompanhamento.</p><button className="button primary" onClick={() => setShowNew(true)}><Plus size={16}/> Nova devolução</button></div> : <div className="table-wrap"><table><thead><tr><th>Identificação</th><th>Motivo</th><th>Status</th><th>SLA resposta</th><th>SLA resolução</th><th>Urgência</th><th/></tr></thead><tbody>{filtered.map(item => <ReturnRow key={item.id} item={item} onOpen={() => setSelected(item)} onFirst={async () => replace(await api.firstAction(item.id))} onConclude={async () => replace(await api.conclude(item.id))}/>)}</tbody></table></div>}
      </section>
    </main>

    <footer><span>Logística Reversa • 2026</span><span>Backend Python + FastAPI • Frontend React + CSS</span><button onClick={reset}>Resetar base</button></footer>
    {showNew && <NewReturn onClose={() => setShowNew(false)} onCreated={async () => { setShowNew(false); await load(); }}/>} 
    {selected && <Detail item={selected} onClose={() => setSelected(null)} onUpdated={replace}/>}
    {showEmailTest && <EmailTestModal defaultEmail={items.flatMap(i => i.emailsResponsaveis)[0] || ""} configured={emailConfigured} from={emailFrom} onClose={() => setShowEmailTest(false)}/>} 
  </div>;
}

function Metric({icon,label,value,hint,tone='default'}:{icon:ReactNode,label:string,value:ReactNode,hint:string,tone?:string}) { return <div className={`metric ${tone}`}><div className="metric-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{hint}</small></div></div>; }

function ReturnRow({item,onOpen,onFirst,onConclude}:{item:ReturnCase,onOpen:()=>void,onFirst:()=>Promise<void>,onConclude:()=>Promise<void>}) { const sla=calculateSlaStatus(item); return <tr onClick={onOpen}><td><b className="mono">{item.cotacao}</b><small>{item.codigoRastreio}</small></td><td>{item.motivoDevolucao}<small>{item.motivoDetalhado || 'Sem detalhamento'}</small></td><td><StatusBadge status={item.status}/></td><td><Progress percent={sla.respostaPercentualConsumido} label={sla.respostaCumprida ? 'Cumprido' : formatTimeRemaining(sla.respostaMinutosRestantes)} danger={sla.respostaVencida}/></td><td><Progress percent={sla.resolucaoPercentualConsumido} label={sla.resolucaoCumprida ? 'Cumprido' : formatHoursRemaining(sla.resolucaoHorasRestantes)} danger={sla.resolucaoVencida}/></td><td><Urgency level={sla.nivelUrgencia}/></td><td><div className="row-actions"><button onClick={e=>{e.stopPropagation();onOpen()}}>Abrir</button>{!sla.respostaCumprida && item.status !== 'Concluído' && <button onClick={e=>{e.stopPropagation();onFirst()}}>1ª ação</button>}{item.status !== 'Concluído' && item.status !== 'Cancelado' && <button className="soft-success" onClick={e=>{e.stopPropagation();onConclude()}}>Concluir</button>}</div></td></tr>; }

function EmailTestModal({defaultEmail, configured, from, onClose}:{defaultEmail:string; configured:boolean; from:string; onClose:()=>void}) {
  const [email,setEmail]=useState(defaultEmail);
  const [sending,setSending]=useState(false);
  const [result,setResult]=useState<"success"|"error"|null>(null);
  const [message,setMessage]=useState("");

  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();
    setSending(true);
    setResult(null);
    setMessage("");
    try {
      await api.testEmail(email.trim());
      setResult("success");
      setMessage(`Teste enviado para ${email.trim()}. Verifique a caixa de entrada e também o spam.`);
    } catch (err) {
      setResult("error");
      setMessage(err instanceof Error ? err.message : "Não foi possível enviar o teste.");
    } finally { setSending(false); }
  };

  return <Modal title="Testar integração de e-mail" subtitle="Este botão envia uma mensagem real pelo Resend." onClose={onClose}>
    <div className="email-test-box">
      <div className="email-test-status">{configured ? <><CircleCheck size={18}/><div><b>Resend configurado</b><small>Remetente: {from}</small></div></> : <><CircleX size={18}/><div><b>Resend não configurado</b><small>Cadastre RESEND_API_KEY no ambiente do backend.</small></div></>}</div>
      <form onSubmit={submit} className="form">
        <Field label="E-mail para teste *"><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu-email@empresa.com.br"/></Field>
        {result && <div className={`test-result ${result}`}>{result === "success" ? <CircleCheck size={17}/> : <CircleX size={17}/>}<span>{message}</span></div>}
        <div className="modal-actions">
          <button type="button" className="button ghost" onClick={onClose}>Fechar</button>
          <button disabled={sending || !configured} className="button primary"><Send size={15}/>{sending ? "Enviando..." : "Enviar e-mail de teste"}</button>
        </div>
      </form>
    </div>
  </Modal>;
}

function StatusBadge({status}:{status:string}) { return <span className={`badge status-${status.toLowerCase().replaceAll(' ','-')}`}>{status}</span>; }
function Urgency({level}:{level:string}) { const map:any={OK:['No prazo','ok'],ALERTA:['Em alerta','warning'],VENCIDO:['Vencido','danger'],CONCLUIDO:['Concluído','success']}; const [label,cls]=map[level]||['—','']; return <span className={`badge ${cls}`}>{label}</span>; }
function Progress({percent,label,danger}:{percent:number,label:string,danger:boolean}) { return <div className="progress-cell"><div className="progress-line"><i className={danger?'danger':''} style={{width:`${Math.min(100,Math.max(3,percent))}%`}}/></div><small>{label}</small></div>; }

function NewReturn({onClose,onCreated}:{onClose:()=>void,onCreated:()=>Promise<void>}) { const [form,setForm]=useState({cotacao:'',codigoRastreio:'',motivoDevolucao:motivos[0],motivoDetalhado:'',dataEntrada:new Date().toISOString().slice(0,16),emailsResponsaveis:'',slaRespostaHoras:24,slaResolucaoDias:5}); const [saving,setSaving]=useState(false); const set=(k:string,v:any)=>setForm(f=>({...f,[k]:v})); const submit=async(e:React.FormEvent)=>{e.preventDefault();setSaving(true);try{await api.create({...form,dataEntrada:new Date(form.dataEntrada).toISOString(),emailsResponsaveis:form.emailsResponsaveis.split(',').map(x=>x.trim()).filter(Boolean),status:'Em Trânsito',observacoes:'Produto em trânsito.'});await onCreated()}finally{setSaving(false)}}; return <Modal title="Nova devolução" subtitle="Cadastre o retorno e acompanhe automaticamente o produto em trânsito." onClose={onClose}><form onSubmit={submit} className="form"><div className="form-grid"><Field label="Cotação *"><input required value={form.cotacao} onChange={e=>set('cotacao',e.target.value.toUpperCase())} placeholder="QUO-00000-XXXXX"/></Field><Field label="Código de rastreio *"><input required value={form.codigoRastreio} onChange={e=>set('codigoRastreio',e.target.value.toUpperCase())} placeholder="AD000000000BR"/></Field><Field label="Motivo"><select value={form.motivoDevolucao} onChange={e=>set('motivoDevolucao',e.target.value)}>{motivos.map(m=><option key={m}>{m}</option>)}</select></Field><Field label="Data de entrada"><input type="datetime-local" value={form.dataEntrada} onChange={e=>set('dataEntrada',e.target.value)}/></Field><Field label="SLA de resposta (horas)"><input type="number" min="1" value={form.slaRespostaHoras} onChange={e=>set('slaRespostaHoras',Number(e.target.value))}/></Field><Field label="SLA de resolução (dias)"><input type="number" min="1" value={form.slaResolucaoDias} onChange={e=>set('slaResolucaoDias',Number(e.target.value))}/></Field></div><div className="system-note"><div className="system-note-icon"><Send size={15}/></div><div><b>Descrição automática</b><span>Produto em trânsito.</span><small>O cadastro também será iniciado com o status “Em Trânsito”.</small></div></div><Field label="E-mails responsáveis"><input value={form.emailsResponsaveis} onChange={e=>set('emailsResponsaveis',e.target.value)} placeholder="email@empresa.com.br, outro@empresa.com.br"/><small>Separe múltiplos e-mails por vírgula.</small></Field><Field label="Detalhamento"><textarea value={form.motivoDetalhado} onChange={e=>set('motivoDetalhado',e.target.value)} placeholder="Descreva o motivo ou contexto da devolução..."/></Field><div className="modal-actions"><button type="button" className="button ghost" onClick={onClose}>Cancelar</button><button disabled={saving} className="button primary">{saving?'Salvando...':'Cadastrar devolução'}</button></div></form></Modal>; }

function Detail({item,onClose,onUpdated}:{item:ReturnCase,onClose:()=>void,onUpdated:(i:ReturnCase)=>void}) { const [note,setNote]=useState(''); const [newStatus,setNewStatus]=useState<StatusDevolucao>(item.status); const sla=calculateSlaStatus(item); const saveLog=async()=>{if(!note.trim())return;onUpdated(await api.log(item.id,note,newStatus));setNote('')}; return <Modal title={item.cotacao} subtitle={`${item.codigoRastreio} • ${item.motivoDevolucao}`} onClose={onClose}><div className="detail-grid"><div className="detail-main"><div className="sla-banner"><div><span>Urgência atual</span><Urgency level={sla.nivelUrgencia}/></div><div><span>Resposta</span><b>{sla.respostaCumprida?'Cumprido':formatTimeRemaining(sla.respostaMinutosRestantes)}</b></div><div><span>Resolução</span><b>{sla.resolucaoCumprida?'Cumprido':formatHoursRemaining(sla.resolucaoHorasRestantes)}</b></div></div><div className="detail-card"><div className="card-title"><Activity size={17}/> Descrição atual</div><div className="description-callout"><div><span>STATUS INICIAL</span><b>{item.observacoes || 'Produto em trânsito.'}</b></div><span>Essa descrição é criada automaticamente no cadastro e pode ser complementada no histórico abaixo.</span></div></div><div className="detail-card"><div className="card-title"><Activity size={17}/> Registrar atualização</div><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Ex.: etiqueta emitida, contato realizado, equipamento recebido..."/><div className="inline-form"><select value={newStatus} onChange={e=>setNewStatus(e.target.value as StatusDevolucao)}>{statuses.map(s=><option key={s}>{s}</option>)}</select><button className="button primary" onClick={saveLog}>Registrar</button></div></div><div className="detail-card"><div className="card-title">Histórico</div><div className="timeline">{item.logs.length ? item.logs.map(log=><div className="timeline-item" key={log.id}><div className="dot"/><div><b>{log.descricao}</b><small>{log.usuario} • {new Date(log.data).toLocaleString('pt-BR')}</small></div></div>) : <p className="muted">Nenhuma atualização registrada.</p>}</div></div></div><aside className="side-card"><span className="section-kicker">DADOS DO PROCESSO</span><dl><dt>Motivo</dt><dd>{item.motivoDevolucao}</dd><dt>Entrada</dt><dd>{new Date(item.dataEntrada).toLocaleString('pt-BR')}</dd><dt>Limite resposta</dt><dd>{new Date(sla.dataLimiteResposta).toLocaleString('pt-BR')}</dd><dt>Limite resolução</dt><dd>{new Date(sla.dataLimiteResolucao).toLocaleString('pt-BR')}</dd><dt>Responsáveis</dt><dd>{item.emailsResponsaveis.length ? item.emailsResponsaveis.join(', ') : 'Não informado'}</dd></dl></aside></div></Modal>; }

function Modal({title,subtitle,onClose,children}:{title:string,subtitle?:string,onClose:()=>void,children:ReactNode}) { return <div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal"><div className="modal-head"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div><button className="icon-button" onClick={onClose}><X size={18}/></button></div>{children}</div></div>; }
function Field({label,children}:{label:string,children:ReactNode}) { return <label className="field"><span>{label}</span>{children}</label>; }
