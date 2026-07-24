import React, { useEffect, useState } from 'react';

export default function LancamentoScreen() {
  const [area, setArea] = useState('CCN');
  const [sistemas, setSistemas] = useState([]);
  const [sistemaId, setSistemaId] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [produtoId, setProdutoId] = useState('');
  const [unidades, setUnidades] = useState(0);
  const [volInicial, setVolInicial] = useState(0);
  const [volFinal, setVolFinal] = useState(0);
  const [responsavel, setResponsavel] = useState('');
  const [historico, setHistorico] = useState([]);

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
        if (data.length) {
          setProdutoId(data[0].id);
          setVolInicial(data[0].volume_inicial_l);
          setVolFinal(data[0].volume_final_l);
        }
      });
  }, [sistemaId]);

  useEffect(() => {
    if (!produtoId) return;
    fetch(`/api/lancamentos?produto_id=${produtoId}`)
      .then(r => r.json())
      .then(setHistorico);
  }, [produtoId]);

  const produto = produtos.find(p => p.id === Number(produtoId));
  const pesoTotal = produto ? Math.round(unidades * produto.peso_unitario_kg * 100) / 100 : 0;

  async function registrar() {
    if (!produto) return;
    const res = await fetch('/api/lancamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produto_id: produto.id,
        unidades_carregadas: Number(unidades),
        volume_inicial_l: Number(volInicial),
        volume_final_l: Number(volFinal),
        responsavel,
        origem: navigator.onLine ? 'online' : 'offline_sync'
      })
    });
    const data = await res.json();
    setProdutos(prev =>
      prev.map(p => (p.id === produto.id ? { ...p, estoque_kg: data.novo_estoque_kg } : p))
    );
    setUnidades(0);
    fetch(`/api/lancamentos?produto_id=${produtoId}`).then(r => r.json()).then(setHistorico);
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

      <select value={produtoId} onChange={e => {
        setProdutoId(e.target.value);
        const p = produtos.find(x => x.id === Number(e.target.value));
        if (p) { setVolInicial(p.volume_inicial_l); setVolFinal(p.volume_final_l); }
      }}>
        {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
      </select>

      <div className="card">
        <label>Volume inicial (L)</label>
        <input type="number" value={volInicial} onChange={e => setVolInicial(e.target.value)} />
        <label>Volume final (L)</label>
        <input type="number" value={volFinal} onChange={e => setVolFinal(e.target.value)} />

        <label>Embalagem: {produto?.tipo_embalagem} · peso unitário: {produto?.peso_unitario_kg} kg</label>
        <label>Unidades carregadas</label>
        <input type="number" value={unidades} onChange={e => setUnidades(e.target.value)} />
        <p style={{ fontSize: 13, color: '#374151' }}>Total calculado: <strong>{pesoTotal} kg</strong></p>

        <label>Responsável</label>
        <input type="text" value={responsavel} onChange={e => setResponsavel(e.target.value)} />

        <button className="primary" onClick={registrar}>Registrar lançamento</button>
      </div>

      <div className="grid3">
        <div className="stat"><div className="label">Volume inicial</div><div className="value">{volInicial} L</div></div>
        <div className="stat"><div className="label">Volume final</div><div className="value">{volFinal} L</div></div>
        <div className="stat"><div className="label">Estoque</div><div className="value">{produto?.estoque_kg ?? '-'} kg</div></div>
      </div>

      <div className="card">
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 0 }}>Lançamentos recentes</p>
        {historico.length === 0 && <p style={{ fontSize: 13, color: '#9ca3af' }}>Nenhum lançamento ainda.</p>}
        {historico.map(h => (
          <div key={h.id} className="list-item">
            <span>{h.unidades_carregadas}x · {h.responsavel || 'sem nome'}</span>
            <span>+{h.peso_calculado_kg} kg</span>
          </div>
        ))}
      </div>
    </div>
  );
}
