import React, { useEffect, useState } from 'react';

export default function SolicitacaoScreen() {
  const [area, setArea] = useState('CCN');
  const [itens, setItens] = useState([]);

  useEffect(() => {
    fetch(`/api/solicitacao-compra?area=${area}`).then(r => r.json()).then(setItens);
  }, [area]);

  const urgentes = itens.filter(i => i.estoque_kg === 0).length;

  async function baixarExcel() {
    const res = await fetch(`/api/relatorio-solicitacao-excel?area=${area}`);
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `solicitacao-compra-${area}.xlsx`;
    link.click();
  }

  return (
    <div>
      <div className="tabs">
        <button className={area === 'CCN' ? 'active' : ''} onClick={() => setArea('CCN')}>CCN</button>
        <button className={area === 'CCS' ? 'active' : ''} onClick={() => setArea('CCS')}>CCS</button>
      </div>

      <div className="grid3">
        <div className="stat"><div className="label">Itens</div><div className="value">{itens.length}</div></div>
        <div className="stat"><div className="label">Urgentes</div><div className="value warning">{urgentes}</div></div>
        <div className="stat"><div className="label">Área</div><div className="value">{area}</div></div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {itens.length === 0 && (
          <p style={{ padding: 16, fontSize: 13, color: '#9ca3af' }}>Nenhum item abaixo do mínimo nesta área.</p>
        )}
        {itens.map(i => (
          <div key={i.id} className="list-item">
            <div>
              <div style={{ fontWeight: 500 }}>
                {i.produto} {i.estoque_kg === 0 && <span className="warning" style={{ fontSize: 11 }}> · zerado</span>}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {i.sistema} · estoque {i.estoque_kg} kg · mínimo {i.estoque_minimo_kg} kg
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600 }}>{i.sugerido_kg} kg</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{i.sugerido_unidades} {i.tipo_embalagem}</div>
            </div>
          </div>
        ))}
      </div>

      <button className="primary" disabled={itens.length === 0} onClick={baixarExcel}>
        Gerar planilha de solicitação (Excel)
      </button>
    </div>
  );
}
