import React, { useEffect, useState } from 'react';

function fmt(n) {
  return Number(n).toLocaleString('pt-BR');
}

export default function EstoqueScreen() {
  const [area, setArea] = useState('CCN');
  const [itens, setItens] = useState([]);
  const [busca, setBusca] = useState('');
  const [soAlerta, setSoAlerta] = useState(false);

  useEffect(() => {
    fetch(`/api/estoque?area=${area}`).then(r => r.json()).then(setItens);
  }, [area]);

  const filtrados = itens.filter(i => {
    const bate = i.produto.toLowerCase().includes(busca.toLowerCase()) ||
                 i.sistema.toLowerCase().includes(busca.toLowerCase());
    const alerta = i.estoque_kg < i.estoque_minimo_kg;
    return bate && (!soAlerta || alerta);
  });

  const totalEstoque = itens.reduce((a, i) => a + i.estoque_kg, 0);
  const totalAlerta = itens.filter(i => i.estoque_kg < i.estoque_minimo_kg).length;

  return (
    <div>
      <div className="tabs">
        <button className={area === 'CCN' ? 'active' : ''} onClick={() => setArea('CCN')}>CCN</button>
        <button className={area === 'CCS' ? 'active' : ''} onClick={() => setArea('CCS')}>CCS</button>
      </div>

      <input placeholder="Buscar produto ou sistema" value={busca} onChange={e => setBusca(e.target.value)} />
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input type="checkbox" style={{ width: 'auto' }} checked={soAlerta} onChange={e => setSoAlerta(e.target.checked)} />
        Apenas nível baixo
      </label>

      <div className="grid3">
        <div className="stat"><div className="label">Produtos</div><div className="value">{itens.length}</div></div>
        <div className="stat"><div className="label">Estoque total</div><div className="value">{fmt(totalEstoque.toFixed(1))} kg</div></div>
        <div className="stat"><div className="label">Nível baixo</div><div className="value warning">{totalAlerta}</div></div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {filtrados.map(i => {
          const baixo = i.estoque_kg < i.estoque_minimo_kg;
          const unidades = i.peso_unitario_kg ? (i.estoque_kg / i.peso_unitario_kg).toFixed(1) : null;
          return (
            <div key={i.id} className="list-item">
              <div>
                <div style={{ fontWeight: 500 }}>{i.produto}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{i.sistema}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className={baixo ? 'warning' : ''} style={{ fontWeight: 600 }}>{fmt(i.estoque_kg)} kg</div>
                {unidades != null && (
                  <div style={{ fontSize: 11, color: '#6b7280' }}>≈ {fmt(unidades)} {i.tipo_embalagem}</div>
                )}
                <div style={{ fontSize: 11 }} className={baixo ? 'warning' : ''}>
                  {baixo ? 'abaixo do mínimo' : 'nível ok'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
