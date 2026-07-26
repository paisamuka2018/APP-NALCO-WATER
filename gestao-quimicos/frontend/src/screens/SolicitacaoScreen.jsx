import React, { useEffect, useState } from 'react';
import PeriodoBadge from '../components/PeriodoBadge.jsx';

function fmt(n) {
  return Number(n).toLocaleString('pt-BR');
}

export default function SolicitacaoScreen() {
  const [tipo, setTipo] = useState('semanal'); // semanal (bombona/ibc) | mensal (baú)
  const [area, setArea] = useState('CCN');
  const [itens, setItens] = useState([]);

  useEffect(() => {
    if (tipo === 'semanal') {
      fetch(`/api/solicitacao-compra?area=${area}`).then(r => r.json()).then(setItens);
    } else {
      fetch('/api/solicitacao-bau').then(r => r.json()).then(data => setItens(data.filter(i => i.area === area)));
    }
  }, [tipo, area]);

  const urgentes = itens.filter(i => (tipo === 'semanal' ? i.estoque_kg : i.estoque_bau_kg) === 0).length;

  async function baixarExcel() {
    if (tipo !== 'semanal') return; // Excel do BAÚ pode ser adicionado em uma próxima etapa
    const res = await fetch(`/api/relatorio-solicitacao-excel?area=${area}`);
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `solicitacao-compra-${area}.xlsx`;
    link.click();
  }

  return (
    <div>
      <PeriodoBadge />
      <div className="tabs">
        <button className={tipo === 'semanal' ? 'active' : ''} onClick={() => setTipo('semanal')}>Solicitação semanal</button>
        <button className={tipo === 'mensal' ? 'active' : ''} onClick={() => setTipo('mensal')}>Solicitação mensal (BAÚ)</button>
      </div>

      <div className="tabs">
        <button className={area === 'CCN' ? 'active' : ''} onClick={() => setArea('CCN')}>CCN</button>
        <button className={area === 'CCS' ? 'active' : ''} onClick={() => setArea('CCS')}>CCS</button>
      </div>

      <p style={{ fontSize: 12, color: '#6b7280' }}>
        {tipo === 'semanal'
          ? 'Baseada no estoque de bombonas/IBC de cada sistema.'
          : 'Baseada na contagem mensal do BAÚ (estoque central, dia 15).'}
      </p>

      <div className="grid3">
        <div className="stat"><div className="label">Itens</div><div className="value">{itens.length}</div></div>
        <div className="stat"><div className="label">Urgentes</div><div className="value warning">{urgentes}</div></div>
        <div className="stat"><div className="label">Área</div><div className="value">{area}</div></div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {itens.length === 0 && (
          <p style={{ padding: 16, fontSize: 13, color: '#9ca3af' }}>Nenhum item abaixo do mínimo nesta área.</p>
        )}
        {itens.map(i => {
          const estoqueAtual = tipo === 'semanal' ? i.estoque_kg : i.estoque_bau_kg;
          const estoqueMinimo = tipo === 'semanal' ? i.estoque_minimo_kg : i.estoque_minimo_bau_kg;
          return (
            <div key={i.id} className="list-item">
              <div>
                <div style={{ fontWeight: 500 }}>
                  {i.produto} {estoqueAtual === 0 && <span className="warning" style={{ fontSize: 11 }}> · zerado</span>}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  {i.sistema} · estoque {fmt(estoqueAtual)} kg · mínimo {fmt(estoqueMinimo)} kg
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600 }}>{fmt(i.sugerido_kg)} kg</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{fmt(i.sugerido_unidades)} {i.tipo_embalagem}</div>
              </div>
            </div>
          );
        })}
      </div>

      {tipo === 'semanal' && (
        <button className="primary" disabled={itens.length === 0} onClick={baixarExcel}>
          Gerar planilha de solicitação (Excel)
        </button>
      )}
    </div>
  );
}
