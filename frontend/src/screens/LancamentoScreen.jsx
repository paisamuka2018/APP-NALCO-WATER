import React, { useEffect, useState } from 'react';

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function LancamentoScreen() {
  const [area, setArea] = useState('CCN');
  const [sistemas, setSistemas] = useState([]);
  const [sistemaId, setSistemaId] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [linhas, setLinhas] = useState({}); // produto_id -> { unidades, volInicial, volFinal }
  const [dataLancamento, setDataLancamento] = useState(hojeISO());
  const [estoqueArea, setEstoqueArea] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState('');

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
        const iniciais = {};
        data.forEach(p => {
          iniciais[p.id] = {
            unidades: 0,
            volInicial: p.volume_inicial_l ?? 0,
            volFinal: p.volume_final_l ?? 0
          };
        });
        setLinhas(iniciais);
      });
  }, [sistemaId]);

  function atualizarLinha(produtoId, campo, valor) {
    setLinhas(prev => ({
      ...prev,
      [produtoId]: { ...prev[produtoId], [campo]: valor }
    }));
  }

  function pesoTotal(produto) {
    const linha = linhas[produto.id];
    if (!linha) return 0;
    return Math.round((Number(linha.unidades) || 0) * produto.peso_unitario_kg * 100) / 100;
  }

  async function registrarTudo() {
    setEnviando(true);
    setMensagem('');
    const itens = produtos.map(p => ({
      produto_id: p.id,
      unidades_carregadas: Number(linhas[p.id]?.unidades) || 0,
      volume_inicial_l: Number(linhas[p.id]?.volInicial) || 0,
      volume_final_l: Number(linhas[p.id]?.volFinal) || 0
    }));

    try {
      const res = await fetch('/api/lancamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_lancamento: dataLancamento,
          estoque_area_kg: estoqueArea === '' ? null : Number(estoqueArea),
          responsavel,
          itens,
          origem: navigator.onLine ? 'online' : 'offline_sync'
        })
      });

      if (res.ok) {
        const data = await res.json();
        const atualizados = new Map(data.resultados.map(r => [r.produto_id, r.novo_estoque_kg]));
        setProdutos(prev => prev.map(p => atualizados.has(p.id) ? { ...p, estoque_kg: atualizados.get(p.id) } : p));
        setMensagem(`${data.resultados.length} produto(s) atualizados com sucesso.`);
        setLinhas(prev => {
          const novo = { ...prev };
          produtos.forEach(p => { novo[p.id] = { ...novo[p.id], unidades: 0 }; });
          return novo;
        });
      } else {
        setMensagem('Não foi possível registrar. Tente novamente.');
      }
    } catch (e) {
      setMensagem('Erro de conexão. Tente novamente.');
    }
    setEnviando(false);
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

      <div className="card">
        <label>Data do lançamento</label>
        <input type="date" value={dataLancamento} onChange={e => setDataLancamento(e.target.value)} />

        <label>Estoque em área (kg)</label>
        <input type="number" placeholder="Nível geral do sistema" value={estoqueArea} onChange={e => setEstoqueArea(e.target.value)} />

        <label>Responsável</label>
        <input type="text" value={responsavel} onChange={e => setResponsavel(e.target.value)} />
      </div>

      {produtos.map(p => {
        const linha = linhas[p.id] || { unidades: 0, volInicial: 0, volFinal: 0 };
        return (
          <div className="card" key={p.id}>
            <p style={{ fontWeight: 600, marginTop: 0, marginBottom: 4 }}>{p.nome}</p>
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 0 }}>
              Embalagem {p.tipo_embalagem} · {p.peso_unitario_kg} kg/unidade · estoque atual {p.estoque_kg} kg
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13 }}>Volume inicial (L)</label>
                <input type="number" value={linha.volInicial} onChange={e => atualizarLinha(p.id, 'volInicial', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 13 }}>Volume final (L)</label>
                <input type="number" value={linha.volFinal} onChange={e => atualizarLinha(p.id, 'volFinal', e.target.value)} />
              </div>
            </div>

            <label style={{ fontSize: 13 }}>Unidades carregadas</label>
            <input type="number" value={linha.unidades} onChange={e => atualizarLinha(p.id, 'unidades', e.target.value)} />
            <p style={{ fontSize: 12, color: '#374151', margin: '4px 0 0' }}>
              Total calculado: <strong>{pesoTotal(p)} kg</strong>
            </p>
          </div>
        );
      })}

      <button className="primary" disabled={enviando || produtos.length === 0} onClick={registrarTudo}>
        {enviando ? 'Registrando...' : 'Registrar lançamento de todos os produtos'}
      </button>

      {mensagem && <p style={{ fontSize: 13, marginTop: 8 }}>{mensagem}</p>}
    </div>
  );
}
