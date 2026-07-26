import React, { useEffect, useState } from 'react';

function fmt(n) {
  return Number(n).toLocaleString('pt-BR');
}

export default function ModificarEstoqueScreen() {
  const [area, setArea] = useState('CCN');
  const [produtos, setProdutos] = useState([]);
  const [valores, setValores] = useState({});
  const [salvando, setSalvando] = useState({});
  const [mensagem, setMensagem] = useState('');

  function carregar() {
    fetch(`/api/produtos?area=${area}`).then(r => r.json()).then(setProdutos);
  }

  useEffect(() => { carregar(); }, [area]);

  function atualizar(id, valor) {
    setValores(prev => ({ ...prev, [id]: valor }));
  }

  async function salvarUm(produtoId) {
    const valor = valores[produtoId];
    if (valor === undefined || valor === '') return;
    setSalvando(prev => ({ ...prev, [produtoId]: true }));
    try {
      const res = await fetch(`/api/produtos?produto_id=${produtoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estoque_kg: valor })
      });
      if (res.ok) {
        setMensagem('Estoque atualizado.');
        setValores(prev => { const novo = { ...prev }; delete novo[produtoId]; return novo; });
        carregar();
      } else {
        setMensagem('Não foi possível salvar.');
      }
    } catch {
      setMensagem('Erro de conexão.');
    }
    setSalvando(prev => ({ ...prev, [produtoId]: false }));
  }

  const porSistema = produtos.reduce((acc, p) => {
    const chave = p.sistema_nome || 'Sem sistema';
    if (!acc[chave]) acc[chave] = [];
    acc[chave].push(p);
    return acc;
  }, {});

  return (
    <div>
      <p style={{ fontSize: 12, color: '#6b7280' }}>
        Ajuste rápido do estoque de bombonas/IBC por produto — para correções pontuais,
        sem precisar abrir o formulário completo de edição.
      </p>

      <div className="tabs">
        <button className={area === 'CCN' ? 'active' : ''} onClick={() => setArea('CCN')}>CCN</button>
        <button className={area === 'CCS' ? 'active' : ''} onClick={() => setArea('CCS')}>CCS</button>
      </div>

      {mensagem && <p style={{ fontSize: 13 }}>{mensagem}</p>}

      {Object.entries(porSistema).map(([sistemaNome, lista]) => (
        <div key={sistemaNome} style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>{sistemaNome}</p>
          {lista.map(p => (
            <div key={p.id} className="card" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 8, alignItems: 'end' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 500 }}>{p.nome}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>atual: {fmt(p.estoque_kg)} kg</p>
              </div>
              <div>
                <label style={{ fontSize: 11 }}>Novo valor (kg)</label>
                <input type="number" placeholder={p.estoque_kg} value={valores[p.id] ?? ''} onChange={e => atualizar(p.id, e.target.value)} />
              </div>
              <button
                style={{ width: 'auto', padding: '10px 14px' }}
                disabled={salvando[p.id] || valores[p.id] === undefined || valores[p.id] === ''}
                onClick={() => salvarUm(p.id)}
              >
                Salvar
              </button>
            </div>
          ))}
        </div>
      ))}

      {produtos.length === 0 && <p style={{ fontSize: 13, color: '#9ca3af' }}>Nenhum produto cadastrado nesta área.</p>}
    </div>
  );
}
