import React, { useEffect, useState } from 'react';

function fmt(n) {
  return Number(n).toLocaleString('pt-BR');
}

export default function EditarProdutosScreen() {
  const [subaba, setSubaba] = useState('produtos'); // produtos | sistemas
  const [area, setArea] = useState('CCN');
  const [produtos, setProdutos] = useState([]);
  const [todosSistemas, setTodosSistemas] = useState([]);
  const [editando, setEditando] = useState(null); // produto_id
  const [rascunho, setRascunho] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(null);
  const [mensagem, setMensagem] = useState('');

  // --- edição de sistema (dados operacionais) ---
  const [editandoSistema, setEditandoSistema] = useState(null);
  const [rascunhoSistema, setRascunhoSistema] = useState({});
  const [salvandoSistema, setSalvandoSistema] = useState(false);

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
      sistema_id: p.sistema_id,
      preco_unitario: p.preco_unitario ?? ''
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

  function abrirEdicaoSistema(s) {
    setEditandoSistema(s.id);
    setRascunhoSistema({
      nome: s.nome,
      subsistema: s.subsistema || '',
      area: s.area,
      clientes_atendidos: s.clientes_atendidos || '',
      vazao: s.vazao || '',
      dosagem_contrato: s.dosagem_contrato || '',
      observacoes: s.observacoes || ''
    });
  }

  async function salvarSistema(sistemaId) {
    setSalvandoSistema(true);
    try {
      const res = await fetch(`/api/sistemas?sistema_id=${sistemaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rascunhoSistema)
      });
      if (res.ok) {
        setMensagem('Sistema atualizado com sucesso.');
        setEditandoSistema(null);
        fetch('/api/sistemas').then(r => r.json()).then(setTodosSistemas);
      } else {
        setMensagem('Não foi possível salvar o sistema.');
      }
    } catch {
      setMensagem('Erro de conexão ao salvar o sistema.');
    }
    setSalvandoSistema(false);
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
        <button className={subaba === 'produtos' ? 'active' : ''} onClick={() => setSubaba('produtos')}>Editar produtos</button>
        <button className={subaba === 'sistemas' ? 'active' : ''} onClick={() => setSubaba('sistemas')}>Editar sistemas</button>
      </div>

      {mensagem && <p style={{ fontSize: 13, marginBottom: 12 }}>{mensagem}</p>}

      {subaba === 'sistemas' && (
        <div>
          {todosSistemas.map(s => (
            <div className="card" key={s.id}>
              {editandoSistema === s.id ? (
                <>
                  <label style={{ fontSize: 13 }}>Nome do sistema</label>
                  <input type="text" value={rascunhoSistema.nome} onChange={e => setRascunhoSistema(prev => ({ ...prev, nome: e.target.value }))} />

                  <label style={{ fontSize: 13 }}>Subsistema</label>
                  <input type="text" value={rascunhoSistema.subsistema} onChange={e => setRascunhoSistema(prev => ({ ...prev, subsistema: e.target.value }))} />

                  <label style={{ fontSize: 13 }}>Área</label>
                  <select value={rascunhoSistema.area} onChange={e => setRascunhoSistema(prev => ({ ...prev, area: e.target.value }))}>
                    <option value="CCN">CCN</option>
                    <option value="CCS">CCS</option>
                  </select>

                  <label style={{ fontSize: 13 }}>Clientes atendidos</label>
                  <input type="text" placeholder="Ex: Aciaria, Lingotamento" value={rascunhoSistema.clientes_atendidos} onChange={e => setRascunhoSistema(prev => ({ ...prev, clientes_atendidos: e.target.value }))} />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 13 }}>Vazão</label>
                      <input type="text" placeholder="Ex: 450 m³/h" value={rascunhoSistema.vazao} onChange={e => setRascunhoSistema(prev => ({ ...prev, vazao: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13 }}>Dosagem de contrato</label>
                      <input type="text" placeholder="Ex: 5,6 ppm" value={rascunhoSistema.dosagem_contrato} onChange={e => setRascunhoSistema(prev => ({ ...prev, dosagem_contrato: e.target.value }))} />
                    </div>
                  </div>

                  <label style={{ fontSize: 13 }}>Observações</label>
                  <input type="text" value={rascunhoSistema.observacoes} onChange={e => setRascunhoSistema(prev => ({ ...prev, observacoes: e.target.value }))} />

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="primary" disabled={salvandoSistema} onClick={() => salvarSistema(s.id)} style={{ flex: 1 }}>
                      {salvandoSistema ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                    <button onClick={() => setEditandoSistema(null)} style={{ flex: 1 }}>Cancelar</button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>{s.nome} <span style={{ fontWeight: 400, color: '#6b7280', fontSize: 12 }}>({s.area})</span></p>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>
                      {s.clientes_atendidos ? `Clientes: ${s.clientes_atendidos}` : 'Sem dados operacionais cadastrados'}
                      {s.vazao ? ` · Vazão: ${s.vazao}` : ''}
                    </p>
                  </div>
                  <button style={{ width: 'auto', padding: '8px 12px' }} onClick={() => abrirEdicaoSistema(s)}>Editar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {subaba === 'produtos' && (
      <div>
      <div className="tabs">
        <button className={area === 'CCN' ? 'active' : ''} onClick={() => setArea('CCN')}>CCN</button>
        <button className={area === 'CCS' ? 'active' : ''} onClick={() => setArea('CCS')}>CCS</button>
      </div>

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

                  <label style={{ fontSize: 13 }}>Preço por kg (R$) — opcional</label>
                  <input type="number" step="0.01" value={rascunho.preco_unitario} onChange={e => setRascunho(prev => ({ ...prev, preco_unitario: e.target.value }))} />

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
      )}
    </div>
  );
}
