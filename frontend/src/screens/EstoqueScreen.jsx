import React, { useEffect, useState } from 'react';
import PeriodoBadge from '../components/PeriodoBadge.jsx';
import { mesAtualISO, nomeMes, buscarSemanas } from '../utils/periodo.js';

function fmt(n) {
  return Number(n).toLocaleString('pt-BR');
}

export default function EstoqueScreen() {
  const [area, setArea] = useState('CCN');
  const [subaba, setSubaba] = useState('bombonas'); // bombonas | tanque-area | bau
  const [mes, setMes] = useState(mesAtualISO());
  const [semanas, setSemanas] = useState([]);
  const [semanaEscolhida, setSemanaEscolhida] = useState(null); // null = estoque atual
  const [itens, setItens] = useState([]);
  const [itensBau, setItensBau] = useState([]);
  const [busca, setBusca] = useState('');
  const [soAlerta, setSoAlerta] = useState(false);
  const [expandido, setExpandido] = useState({});

  useEffect(() => {
    buscarSemanas(mes).then(data => setSemanas(data.semanas));
  }, [mes]);

  useEffect(() => {
    const query = new URLSearchParams({ area });
    if (semanaEscolhida) query.set('ate', semanaEscolhida.fim);
    fetch(`/api/estoque?${query}`).then(r => r.json()).then(setItens);
  }, [area, semanaEscolhida]);

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

  const totalEstoque = itens.reduce((a, i) => a + i.estoque_kg, 0);
  const totalAlerta = itens.filter(i => i.estoque_kg < i.estoque_minimo_kg).length;

  const porSistema = itens.reduce((acc, i) => {
    if (!acc[i.sistema]) acc[i.sistema] = [];
    acc[i.sistema].push(i);
    return acc;
  }, {});

  function toggleExpandido(sistema) {
    setExpandido(prev => ({ ...prev, [sistema]: !prev[sistema] }));
  }

  return (
    <div>
      <PeriodoBadge />
      <div className="tabs">
        <button className={subaba === 'bombonas' ? 'active' : ''} onClick={() => setSubaba('bombonas')}>Estoque (bombonas/IBC)</button>
        <button className={subaba === 'tanque-area' ? 'active' : ''} onClick={() => setSubaba('tanque-area')}>Estoque de área</button>
        <button className={subaba === 'bau' ? 'active' : ''} onClick={() => setSubaba('bau')}>Estoque do BAÚ</button>
      </div>

      {subaba !== 'bau' && (
        <>
          <div className="tabs">
            <button className={area === 'CCN' ? 'active' : ''} onClick={() => setArea('CCN')}>CCN</button>
            <button className={area === 'CCS' ? 'active' : ''} onClick={() => setArea('CCS')}>CCS</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 13 }}>Mês</label>
              <input type="month" value={mes} onChange={e => setMes(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 13 }}>Semana</label>
              <select
                value={semanaEscolhida?.semana ?? ''}
                onChange={e => setSemanaEscolhida(semanas.find(s => s.semana === Number(e.target.value)) || null)}
              >
                <option value="">Atual (tempo real)</option>
                {semanas.map(s => (
                  <option key={s.semana} value={s.semana}>
                    Semana {s.semana} (até {new Date(s.fim + 'T00:00:00').toLocaleDateString('pt-BR')})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
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
        <div>
          <p style={{ fontSize: 12, color: '#6b7280' }}>
            Estoque de área = volume do tanque (convertido em kg pela densidade) + estoque de bombonas/IBC.
            Clique em um sistema para expandir.
          </p>
          {Object.entries(porSistema).map(([sistemaNome, lista]) => {
            const aberto = !!expandido[sistemaNome];
            const totalSistema = lista.reduce((acc, i) => {
              const volumeKg = i.volume_final_l != null && i.densidade ? i.volume_final_l * i.densidade : 0;
              return acc + volumeKg + i.estoque_kg;
            }, 0);
            return (
              <div className="card" key={sistemaNome} style={{ padding: 0 }}>
                <button
                  onClick={() => toggleExpandido(sistemaNome)}
                  style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: 14, display: 'flex', justifyContent: 'space-between', margin: 0 }}
                >
                  <span style={{ fontWeight: 600 }}>{aberto ? '▾' : '▸'} {sistemaNome}</span>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{fmt(totalSistema.toFixed(1))} kg total</span>
                </button>
                {aberto && lista.map(i => {
                  const volumeKg = i.volume_final_l != null && i.densidade ? i.volume_final_l * i.densidade : 0;
                  const totalArea = Math.round((volumeKg + i.estoque_kg) * 100) / 100;
                  return (
                    <div key={i.id} className="list-item">
                      <div style={{ fontWeight: 500 }}>{i.produto}</div>
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
            );
          })}
        </div>
      )}

      {subaba === 'bau' && (
        <ContagemBau itensBau={itensBau} onSalvo={() => fetch('/api/estoque-bau').then(r => r.json()).then(setItensBau)} />
      )}
    </div>
  );
}

function ContagemBau({ itensBau, onSalvo }) {
  const [valores, setValores] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [busca, setBusca] = useState('');

  const filtrados = itensBau.filter(i => i.nome.toLowerCase().includes(busca.toLowerCase()));

  function atualizar(id, campo, valor) {
    setValores(prev => ({ ...prev, [id]: { ...prev[id], [campo]: valor } }));
  }

  async function salvarContagem() {
    setSalvando(true);
    setMensagem('');
    const itens = Object.entries(valores).map(([produto_bau_id, v]) => ({ produto_bau_id: Number(produto_bau_id), ...v }));
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

  const totalAlerta = itensBau.filter(i => i.estoque_kg < i.estoque_minimo_kg).length;

  return (
    <div>
      <p style={{ fontSize: 12, color: '#6b7280' }}>
        Contagem mensal (dia 15) — estoque central que abastece todas as áreas.
      </p>
      <div className="grid3">
        <div className="stat"><div className="label">Produtos</div><div className="value">{itensBau.length}</div></div>
        <div className="stat"><div className="label">Nível baixo</div><div className="value warning">{totalAlerta}</div></div>
        <div className="stat"><div className="label">&nbsp;</div><div className="value">&nbsp;</div></div>
      </div>
      <input placeholder="Buscar produto" value={busca} onChange={e => setBusca(e.target.value)} />
      <div className="card">
        {filtrados.map(i => (
          <div key={i.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, alignItems: 'end', marginBottom: 10 }}>
            <div style={{ fontSize: 13 }}>{i.nome}</div>
            <div>
              <label style={{ fontSize: 11 }}>Estoque (kg)</label>
              <input type="number" placeholder={i.estoque_kg} onChange={e => atualizar(i.id, 'estoque_kg', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 11 }}>Mínimo (kg)</label>
              <input type="number" placeholder={i.estoque_minimo_kg} onChange={e => atualizar(i.id, 'estoque_minimo_kg', e.target.value)} />
            </div>
          </div>
        ))}
        <button className="primary" disabled={salvando} onClick={salvarContagem}>
          {salvando ? 'Salvando...' : 'Salvar contagem do BAÚ'}
        </button>
        {mensagem && <p style={{ fontSize: 13, marginTop: 8 }}>{mensagem}</p>}
      </div>
    </div>
  );
}
