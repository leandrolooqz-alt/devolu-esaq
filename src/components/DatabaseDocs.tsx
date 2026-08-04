import React, { useState } from 'react';
import { 
  Database, 
  Table, 
  Key, 
  Copy, 
  Check, 
  Layers, 
  FileCode, 
  HelpCircle,
  Hash,
  ListFilter
} from 'lucide-react';
import { DATABASE_TABLES, SQL_DDL_SCRIPT } from '../data/architectureDocs';

export const DatabaseDocs: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeTable, setActiveTable] = useState(DATABASE_TABLES[0].nomeTabela);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_DDL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedTableSpec = DATABASE_TABLES.find(t => t.nomeTabela === activeTable) || DATABASE_TABLES[0];

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
                <Database className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold">Arquitetura de Banco de Dados Relacional</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
              Estrutura normalizada projetada para alta performance no acompanhamento de prazos de logística reversa, auditoria de ações e disparos de alertas de SLA.
            </p>
          </div>

          <button
            onClick={handleCopySql}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center space-x-2 active:scale-95 whitespace-nowrap"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Código SQL Copiado!' : 'Copiar Script SQL (DDL)'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Tables Selector & Fields Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Table Selector Sidebar */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Table className="w-4 h-4 text-blue-600" />
            Tabelas do Sistema ({DATABASE_TABLES.length})
          </h3>

          <div className="space-y-1.5">
            {DATABASE_TABLES.map(t => (
              <button
                key={t.nomeTabela}
                onClick={() => setActiveTable(t.nomeTabela)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                  activeTable === t.nomeTabela
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2 font-mono">
                  <span className="opacity-75">tbl_</span>
                  <span>{t.nomeTabela}</span>
                </div>
                <span className="text-[10px] opacity-80 px-1.5 py-0.5 rounded bg-black/10">
                  {t.campos.length} campos
                </span>
              </button>
            ))}
          </div>

          {/* Rationale Callout */}
          <div className="mt-6 p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 space-y-2">
            <p className="font-bold flex items-center gap-1 text-blue-950">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              Decisões de Modelagem:
            </p>
            <ul className="list-disc list-inside text-[11px] space-y-1 text-blue-800">
              <li><strong>UUID</strong> como Chave Primária para segurança contra enumeração.</li>
              <li><strong>TIMESTAMPTZ</strong> para suporte a fuso horários regionais.</li>
              <li><strong>TEXT[] / JSONB</strong> para e-mails dos responsáveis de notificação.</li>
              <li><strong>Índices B-Tree parciais</strong> para acelerar a busca de SLAs em risco.</li>
            </ul>
          </div>

        </div>

        {/* Fields Specs Table */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          
          <div className="border-b border-slate-200 pb-4 mb-4">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-lg font-bold text-blue-700">`{selectedTableSpec.nomeTabela}`</span>
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded font-mono border border-slate-200">
                Tabela Relacional
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{selectedTableSpec.descricao}</p>
          </div>

          {/* Field Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Nome do Campo</th>
                  <th className="py-2.5 px-3">Tipo de Dado</th>
                  <th className="py-2.5 px-3">Obrigatório</th>
                  <th className="py-2.5 px-3">Chave / Índice</th>
                  <th className="py-2.5 px-3">Descrição Técnica</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {selectedTableSpec.campos.map(campo => (
                  <tr key={campo.campo} className="hover:bg-slate-50/80">
                    
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {campo.campo}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-blue-700 bg-blue-50/50 rounded text-[11px] font-medium w-max">
                      {campo.tipoDado}
                    </td>

                    <td className="py-2.5 px-3">
                      {campo.obrigatorio ? (
                        <span className="text-red-600 font-semibold text-[11px]">Sim *</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Opcional</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3">
                      {campo.chave === 'PK' && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-max border border-amber-200">
                          <Key className="w-3 h-3" /> PK (Chave Primária)
                        </span>
                      )}
                      {campo.chave === 'FK' && (
                        <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-max border border-purple-200">
                          FK (Estrangeira)
                        </span>
                      )}
                      {campo.chave === 'INDEX' && (
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1 w-max border border-slate-200">
                          <Hash className="w-3 h-3" /> Índice
                        </span>
                      )}
                      {!campo.chave && <span className="text-slate-300">-</span>}
                    </td>

                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                      {campo.descricao}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* SQL DDL Code Section */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="bg-slate-900 px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center space-x-2 font-mono">
            <FileCode className="w-4 h-4 text-blue-400" />
            <span>schema_logistica_reversa.sql (PostgreSQL DDL)</span>
          </div>
          <button
            onClick={handleCopySql}
            className="hover:text-white transition-colors flex items-center space-x-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar DDL'}</span>
          </button>
        </div>

        <pre className="p-5 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed max-h-[350px]">
          {SQL_DDL_SCRIPT}
        </pre>
      </div>

    </div>
  );
};
