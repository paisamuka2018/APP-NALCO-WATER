import React, { useEffect, useState } from 'react';

function ConsumoChart({ historico }) {
  const valores = historico.map(h => h.consumo_kg).filter(v => v != null);
  if (valores.length < 2) {
    return <p style={{ fontSize: 12, color: '#9ca3af' }}>Ainda não há lançamentos suficientes para montar o gráfico.</p>;
  }
  const max = Math.max(...valores);
  const min = Math.min(...valores);
  const range = max - min || 1;
  const width = 280;
  const height = 60;
  const pontosValidos = historico.map((h, i) => ({ i, v: h.consumo_kg })).filter(p => p.v != null);
  const pts = pontosValidos.map((p, idx) => {
    const x = (idx / (pontosValidos.length - 1)) * width;
    const y = height - ((p.v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: 320, height: 60 }} role="img" aria-label="Gráfico de consumo entre lançamentos">
      <polyline points={pts} fill="none" stroke="#2563eb" strokeWidth="2" />
    </svg>
  );
}

export default function SistemaScreen() {
  const [area, setArea] = useState('CCN');
  const [sistemas, setSistemas] = useState([]);
  const [sistemaId, setSistemaId] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [detalhes, setDetalhes] = useState({}); // produto_id -> { produto, historico, fds }
  const [editandoDosagem, setEditandoDosagem] = useState({}); // produto_id -> valor

  useEffect(() => {
    fetch(`/api/sistemas?area=${area}`)
      .then(r => r.json())
      .then(data => {
        setSistemas(data);
        if (data.length) setSistemaId(data[0].id);
      });
  }, [area]);

  useEffect(() => {
    if (!sistemaId) return;
    fetch(`/api/produtos?sistema_id=${sistemaId}`)
      .then(r => r.json())
      .then(data => {
        setProdutos(data);
        data.forEach(p => carregarDetalhe(p.id));
      });
  }, [sistemaId]);

  function carregarDetalhe(produtoId) {
    fetch(`/api/produto-detalhe?produto_id=${produtoId}`)
      .then(r => r.json())
      .then(data => {
        setDetalhes(prev => ({ ...prev, [produtoId]: data }));
      });
  }

  async function salvarDosagem(produtoId) {
    const valor = editandoDosagem[produtoId];
    if (valor === undefined) return;
    await fetch(`/api/produto-detalhe?produto_id=${produtoId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dosagem_alvo: valor })
    });
    carregarDetalhe(produtoId);
    setEditandoDosagem(prev => {
      const novo = { ...prev };
      delete novo[produtoId];
      return novo;
    });
  }

  async function anexarFds(produtoId, arquivo) {
    if (!arquivo) return;
    // Nesta versão inicial, guardamos apenas o nome do arquivo como referência.
    // O upload real do PDF (para o SharePoint) entra em uma próxima etapa.
    await fetch('/api/fds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produto_id: produtoId, arquivo_nome: arquivo.name })
    });
    carregarDetalhe(produtoId);
  }

  return (
    <div>
      <div className="tabs">
        <button className={area === 'CCN' ? 'active' : ''} onClick={() => setArea('CCN')}>CCN</button>
        <button className={area === 'CCS' ? 'active' : ''} onClick={() => setArea('CCS')}>CCS</button>
      </div>

      <select value={sistemaId} onChange={e => setSistemaId(e.target.value)}>
        {sistemas.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
      </select>

      {produtos.map(p => {
        const detalhe = detalhes[p.id];
        const historico = detalhe?.historico || [];
        const fds = detalhe?.fds || [];
        const dosagemAtual = editandoDosagem[p.id] ?? detalhe?.produto?.dosagem_alvo ?? '';

        return (
          <div className="card" key={p.id}>
            <p style={{ fontWeight: 600, marginTop: 0, marginBottom: 4 }}>{p.nome}</p>

            <label style={{ fontSize: 13 }}>Dosagem contratada</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Ex: 5,6 ppm"
                value={dosagemAtual}
                onChange={e => setEditandoDosagem(prev => ({ ...prev, [p.id]: e.target.value }))}
              />
              <button style={{ width: 'auto', padding: '10px 14px' }} onClick={() => salvarDosagem(p.id)}>
                Salvar
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#6b7280', margin: '12px 0 6px' }}>
              Consumo entre lançamentos (queda de volume no tanque, convertida em kg)
            </p>
            {historico.length === 0 && (
              <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Nenhum lançamento registrado ainda.</p>
            )}
            {historico.length > 0 && (
              <>
                <ConsumoChart historico={historico} />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0 12px' }}>
                  {historico.map((h, i) => (
                    <div key={i} style={{ background: '#f3f4f6', borderRadius: 8, padding: '6px 10px', textAlign: 'center', fontSize: 12 }}>
                      <div style={{ color: '#6b7280' }}>{new Date(h.data).toLocaleDateString('pt-BR')}</div>
                      <div style={{ fontWeight: 600 }}>
                        {h.consumo_kg != null ? `${h.consumo_kg} kg` : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ borderTop: '1px solid #eee', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: fds.length ? '#374151' : '#9ca3af' }}>
                {fds.length ? `FDS: ${fds[0].arquivo_nome}` : 'FDS não anexada'}
              </span>
              <label style={{ fontSize: 12, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }}>
                {fds.length ? 'Substituir' : 'Anexar'} FDS
                <input
                  type="file"
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  onChange={e => anexarFds(p.id, e.target.files[0])}
                />
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
}
