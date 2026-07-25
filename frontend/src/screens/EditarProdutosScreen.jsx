import React, { useEffect, useState } from 'react';

function fmt(n) {
  return Number(n).toLocaleString('pt-BR');
}

export default function EditarProdutosScreen() {
  const [area, setArea] = useState('CCN');
  const [produtos, setProdutos] = useState([]);
  const [todosSistemas, setTodosSistemas] = useState([]);
  const [editando, setEditando] = useState(null); // produto_id
  const [rascunho, setRascunho] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(null);
  const [mensagem, setMensagem] = useState('');

  function carregar() {
    fetch(`/api/produtos?area=${area}`)
      .then(r => r.json())
      .then(setProdutos);
  }

  useEffect(() => { carregar(); }, [area]);

  useEffect(() => {
    fetch('/api/sistemas').then(r => r.json()).then(setTodosSistemas);
  }, []);

  function abrirEdicao(p) {
    setEditando(p.id);
    setRascunho({
      nome: p.nome,
      finalidade: p.finalidade || '',
      tipo_embalagem: p.tipo_embalagem,
      peso_unitario_kg: p.peso_unitario_kg,
      densidade: p.densidade ?? '',
      estoque_minimo_kg: p.estoque_minimo_kg,
      estoque_kg: p.estoque_kg,
      sistema_id: p.sistema_id
    });
    setMensagem('');
  }

  function cancelar() {
    setEditando(null);
    setRascunho({});
  }

  async function salvar(produtoId) {
    setSalvando(true);
    setMensagem('');
    try {
      const res = await fetch(`/api/produtos?produto_id=${produtoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rascunho)
      });
      if (res.ok) {
        setMensagem('Produto atualizado com sucesso.');
        setEditando(null);
        carregar();
      } else {
        setMensagem('Não foi possível salvar. Tente novamente.');
      }
    } catch {
      setMensagem('Erro de conexão ao salvar.');
    }
    setSalvando(false);
  }

  async function excluirProduto(produtoId, nome) {
    const confirmado = window.confirm(`Excluir "${nome}"? Isso também remove o histórico de lançamentos e FDS desse produto. Essa ação não pode ser desfeita.`);
    if (!confirmado) return;
    setExcluindo(produtoId);
    setMensagem('');
    try {
      const res = await fetch(`/api/produtos?produto_id=${produtoId}`, { method: 'DELETE' });
      if (res.ok) {
        setMensagem(`"${nome}" foi excluído.`);
        carregar();
      } else {
        setMensagem('Não foi possível excluir. Tente novamente.');
      }
    } catch {
      setMensagem('Erro de conexão ao excluir.');
    }
    setExcluindo(null);
  }

  // Agrupa por sistema para facilitar a navegação
  const porSistema = produtos.reduce((acc, p) => {
    const chave = p.sistema_nome || 'Sem sistema';
    if (!acc[chave]) acc[chave] = [];
    acc[chave].push(p);
    return acc;
  }, {});

  return (
    <div>
      <div className="tabs">
        <button className={area === 'CCN' ? 'active' : ''} onClick={() => setArea('CCN')}>CCN</button>
        <button className={area === 'CCS' ? 'active' : ''} onClick={() => setArea('CCS')}>CCS</button>
      </div>

      {mensagem && <p style={{ fontSize: 13, marginBottom: 12 }}>{mensagem}</p>}

      {Object.entries(porSistema).map(([sistemaNome, lista]) => (
        <div key={sistemaNome} style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>{sistemaNome}</p>

          {lista.map(p => (
            <div className="card" key={p.id}>
              {editando === p.id ? (
                <>
                  <label style={{ fontSize: 13 }}>Nome do produto</label>
                  <input type="text" value={rascunho.nome} onChange={e => setRascunho(prev => ({ ...prev, nome: e.target.value }))} />

                  <label style={{ fontSize: 13 }}>Finalidade</label>
                  <input type="text" value={rascunho.finalidade} onChange={e => setRascunho(prev => ({ ...prev, finalidade: e.target.value }))} />

                  <label style={{ fontSize: 13 }}>Sistema / área</label>
                  <select value={rascunho.sistema_id} onChange={e => setRascunho(prev => ({ ...prev, sistema_id: e.target.value }))}>
                    {todosSistemas.map(s => (
                      <option key={s.id} value={s.id}>{s.nome} ({s.area})</option>
                    ))}
                  </select>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 13 }}>Embalagem</label>
                      <select value={rascunho.tipo_embalagem} onChange={e => setRascunho(prev => ({ ...prev, tipo_embalagem: e.target.value }))}>
                        <option value="IBC">IBC</option>
                        <option value="BB">BB (bombona)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 13 }}>Peso por unidade (kg)</label>
                      <input type="number" value={rascunho.peso_unitario_kg} onChange={e => setRascunho(prev => ({ ...prev, peso_unitario_kg: e.target.value }))} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 13 }}>Densidade</label>
                      <input type="number" step="0.01" value={rascunho.densidade} onChange={e => setRascunho(prev => ({ ...prev, densidade: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13 }}>Estoque mínimo (kg)</label>
                      <input type="number" value={rascunho.estoque_minimo_kg} onChange={e => setRascunho(prev => ({ ...prev, estoque_minimo_kg: e.target.value }))} />
                    </div>
                  </div>

                  <label style={{ fontSize: 13 }}>Estoque atual (kg) — ajuste manual, use com cuidado</label>
                  <input type="number" value={rascunho.estoque_kg} onChange={e => setRascunho(prev => ({ ...prev, estoque_kg: e.target.value }))} />

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="primary" disabled={salvando} onClick={() => salvar(p.id)} style={{ flex: 1 }}>
                      {salvando ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                    <button onClick={cancelar} style={{ flex: 1 }}>Cancelar</button>
                  </div>
                  <button
                    disabled={excluindo === p.id}
                    onClick={() => excluirProduto(p.id, p.nome)}
                    style={{ marginTop: 8, color: '#b91c1c', borderColor: '#fca5a5' }}
                  >
                    {excluindo === p.id ? 'Excluindo...' : 'Excluir este produto'}
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>{p.nome}</p>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>
                      {p.tipo_embalagem} · {fmt(p.peso_unitario_kg)} kg/un · mínimo {fmt(p.estoque_minimo_kg)} kg · estoque {fmt(p.estoque_kg)} kg
                    </p>
                  </div>
                  <button style={{ width: 'auto', padding: '8px 12px' }} onClick={() => abrirEdicao(p)}>Editar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {produtos.length === 0 && (
        <p style={{ fontSize: 13, color: '#9ca3af' }}>Nenhum produto cadastrado nesta área ainda.</p>
      )}
    </div>
  );
}
