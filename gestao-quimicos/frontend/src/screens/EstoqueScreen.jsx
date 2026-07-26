import React, { useEffect, useState } from 'react';
import PeriodoBadge from '../components/PeriodoBadge.jsx';

function fmt(n) {
  return Number(n).toLocaleString('pt-BR');
}

export default function EstoqueScreen() {
  const [area, setArea] = useState('CCN');
  const [subaba, setSubaba] = useState('bombonas'); // bombonas | tanque-area | bau
  const [itens, setItens] = useState([]);
  const [itensBau, setItensBau] = useState([]);
  const [busca, setBusca] = useState('');
  const [soAlerta, setSoAlerta] = useState(false);

  useEffect(() => {
    fetch(`/api/estoque?area=${area}`).then(r => r.json()).then(setItens);
  }, [area]);

  useEffect(() => {
    if (subaba !== 'bau') return;
    fetch('/api/estoque-bau').then(r => r.json()).then(setItensBau);
  }, [subaba]);

  const filtrados = itens.filter(i => {
    const bate = i.produto.toLowerCase().includes(busca.toLowerCase()) ||
                 i.sistema.toLowerCase().includes(busca.toLowerCase());
    const alerta = i.estoque_kg < i.estoque_minimo_kg;
    return bate && (!soAlerta || alerta);
  });

  const bauFiltrado = itensBau.filter(i => i.area === area);

  const totalEstoque = itens.reduce((a, i) => a + i.estoque_kg, 0);
  const totalAlerta = itens.filter(i => i.estoque_kg < i.estoque_minimo_kg).length;

  return (
    <div>
      <PeriodoBadge />
      <div className="tabs">
        <button className={subaba === 'bombonas' ? 'active' : ''} onClick={() => setSubaba('bombonas')}>Estoque (bombonas/IBC)</button>
        <button className={subaba === 'tanque-area' ? 'active' : ''} onClick={() => setSubaba('tanque-area')}>Estoque de área</button>
        <button className={subaba === 'bau' ? 'active' : ''} onClick={() => setSubaba('bau')}>Estoque do BAÚ</button>
      </div>

      {subaba !== 'bau' && (
        <div className="tabs">
          <button className={area === 'CCN' ? 'active' : ''} onClick={() => setArea('CCN')}>CCN</button>
          <button className={area === 'CCS' ? 'active' : ''} onClick={() => setArea('CCS')}>CCS</button>
        </div>
      )}

      {subaba === 'bombonas' && (
        <>
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
                    {unidades != null && <div style={{ fontSize: 11, color: '#6b7280' }}>≈ {fmt(unidades)} {i.tipo_embalagem}</div>}
                    <div style={{ fontSize: 11 }} className={baixo ? 'warning' : ''}>{baixo ? 'abaixo do mínimo' : 'nível ok'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {subaba === 'tanque-area' && (
        <div className="card" style={{ padding: 0 }}>
          <p style={{ fontSize: 12, color: '#6b7280', padding: '10px 12px 0' }}>
            Estoque de área = volume do tanque (convertido em kg pela densidade) + estoque de bombonas/IBC
          </p>
          {itens.map(i => {
            const volumeKg = i.volume_final_l != null && i.densidade ? i.volume_final_l * i.densidade : 0;
            const totalArea = Math.round((volumeKg + i.estoque_kg) * 100) / 100;
            return (
              <div key={i.id} className="list-item">
                <div>
                  <div style={{ fontWeight: 500 }}>{i.produto}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{i.sistema}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600 }}>{fmt(totalArea)} kg</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>
                    tanque {fmt(volumeKg.toFixed(1))} kg + bombonas {fmt(i.estoque_kg)} kg
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subaba === 'bau' && (
        <ContagemBau area={area} itensBau={itensBau} onSalvo={() => fetch('/api/estoque-bau').then(r => r.json()).then(setItensBau)} />
      )}
    </div>
  );
}

function ContagemBau({ area, itensBau, onSalvo }) {
  const [valores, setValores] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const bauFiltrado = itensBau.filter(i => i.area === area);

  function atualizar(id, campo, valor) {
    setValores(prev => ({ ...prev, [id]: { ...prev[id], [campo]: valor } }));
  }

  async function salvarContagem() {
    setSalvando(true);
    setMensagem('');
    const itens = Object.entries(valores).map(([produto_id, v]) => ({ produto_id: Number(produto_id), ...v }));
    if (itens.length === 0) { setMensagem('Preencha ao menos um item antes de salvar.'); setSalvando(false); return; }
    try {
      const res = await fetch('/api/estoque-bau', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens })
      });
      if (res.ok) {
        setMensagem('Contagem salva com sucesso.');
        setValores({});
        onSalvo();
      } else {
        setMensagem('Não foi possível salvar.');
      }
    } catch {
      setMensagem('Erro de conexão ao salvar.');
    }
    setSalvando(false);
  }

  return (
    <div className="card">
      <p style={{ fontSize: 12, color: '#6b7280', marginTop: 0 }}>
        Contagem mensal (dia 15) — informe o estoque atual e o mínimo desejado por produto
      </p>
      {bauFiltrado.map(i => (
        <div key={i.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, alignItems: 'end', marginBottom: 10 }}>
          <div style={{ fontSize: 13 }}>{i.produto}<div style={{ fontSize: 11, color: '#6b7280' }}>{i.sistema}</div></div>
          <div>
            <label style={{ fontSize: 11 }}>Estoque (kg)</label>
            <input type="number" placeholder={i.estoque_bau_kg} onChange={e => atualizar(i.id, 'estoque_bau_kg', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11 }}>Mínimo (kg)</label>
            <input type="number" placeholder={i.estoque_minimo_bau_kg} onChange={e => atualizar(i.id, 'estoque_minimo_bau_kg', e.target.value)} />
          </div>
        </div>
      ))}
      <button className="primary" disabled={salvando} onClick={salvarContagem}>
        {salvando ? 'Salvando...' : 'Salvar contagem do BAÚ'}
      </button>
      {mensagem && <p style={{ fontSize: 13, marginTop: 8 }}>{mensagem}</p>}
    </div>
  );
}
