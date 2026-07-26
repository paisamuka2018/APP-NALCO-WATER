import React, { useEffect, useState } from 'react';
import { mesAtualISO, nomeMes, buscarSemanas } from '../utils/periodo.js';

function fmt(n) {
  return Number(n).toLocaleString('pt-BR');
}

export default function RelatorioSemanalScreen() {
  const [mes, setMes] = useState(mesAtualISO());
  const [semanas, setSemanas] = useState([]);
  const [semanaEscolhida, setSemanaEscolhida] = useState(null);
  const [area, setArea] = useState('');
  const [linhas, setLinhas] = useState([]);
  const [custos, setCustos] = useState({}); // produto_id -> custo por kg (só nesta sessão, não é salvo)
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    buscarSemanas(mes).then(data => {
      setSemanas(data.semanas);
      if (data.semanas.length) setSemanaEscolhida(data.semanas[0]);
    });
  }, [mes]);

  useEffect(() => {
    if (!semanaEscolhida) return;
    setCarregando(true);
    const query = new URLSearchParams({ inicio: semanaEscolhida.inicio, fim: semanaEscolhida.fim });
    if (area) query.set('area', area);
    fetch(`/api/relatorio-semanal?${query}`)
      .then(r => r.json())
      .then(data => {
        setLinhas(data.linhas || []);
        setCarregando(false);
      });
  }, [semanaEscolhida, area]);

  function atualizarCusto(produtoId, valor) {
    setCustos(prev => ({ ...prev, [produtoId]: valor }));
  }

  const alertas = linhas.filter(l => l.abaixo_do_minimo);
  const custoTotal = linhas.reduce((acc, l) => {
    const c = Number(custos[l.produto_id]) || 0;
    return acc + c * l.consumo_kg;
  }, 0);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label>Mês</label>
          <input type="month" value={mes} onChange={e => setMes(e.target.value)} />
        </div>
        <div>
          <label>Área</label>
          <select value={area} onChange={e => setArea(e.target.value)}>
            <option value="">Todas</option>
            <option value="CCN">CCN</option>
            <option value="CCS">CCS</option>
          </select>
        </div>
      </div>

      <div className="tabs">
        {semanas.map(s => (
          <button
            key={s.semana}
            className={semanaEscolhida?.semana === s.semana ? 'active' : ''}
            onClick={() => setSemanaEscolhida(s)}
          >
            Semana {s.semana}
          </button>
        ))}
      </div>

      {semanaEscolhida && (
        <p style={{ fontSize: 12, color: '#6b7280' }}>
          {nomeMes(mes)} · {new Date(semanaEscolhida.inicio + 'T00:00:00').toLocaleDateString('pt-BR')} a {new Date(semanaEscolhida.fim + 'T00:00:00').toLocaleDateString('pt-BR')}
        </p>
      )}

      <div className="grid3">
        <div className="stat"><div className="label">Produtos com lançamento</div><div className="value">{linhas.length}</div></div>
        <div className="stat"><div className="label">Abaixo do mínimo</div><div className="value warning">{alertas.length}</div></div>
        <div className="stat"><div className="label">Custo estimado</div><div className="value">R$ {fmt(custoTotal.toFixed(2))}</div></div>
      </div>

      {carregando && <p style={{ fontSize: 13, color: '#9ca3af' }}>Carregando...</p>}

      {!carregando && linhas.length === 0 && (
        <p style={{ fontSize: 13, color: '#9ca3af' }}>Nenhum lançamento registrado nesta semana.</p>
      )}

      {linhas.map(l => (
        <div className="card" key={l.produto_id}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 600, margin: 0 }}>{l.produto}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>{l.sistema} · {l.area}</p>
            </div>
            {l.abaixo_do_minimo && <span className="warning" style={{ fontSize: 12 }}>abaixo do mínimo</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
            <div className="stat"><div className="label">Consumo na semana</div><div className="value">{fmt(l.consumo_kg)} kg</div></div>
            <div className="stat"><div className="label">Estoque atual</div><div className="value">{fmt(l.estoque_atual_kg)} kg</div></div>
          </div>

          <label style={{ fontSize: 12, marginTop: 10 }}>Custo por kg (R$) — opcional, só para este relatório</label>
          <input
            type="number"
            step="0.01"
            placeholder="Ex: 8.50"
            value={custos[l.produto_id] || ''}
            onChange={e => atualizarCusto(l.produto_id, e.target.value)}
          />
        </div>
      ))}

      {alertas.length > 0 && (
        <div className="card" style={{ background: '#fffbeb' }}>
          <p style={{ fontWeight: 600, margin: '0 0 8px', color: '#b45309' }}>Principais ajustes a fazer</p>
          {alertas.map(l => (
            <p key={l.produto_id} style={{ fontSize: 13, margin: '4px 0' }}>
              • {l.produto} ({l.sistema}) está abaixo do mínimo — considerar reposição
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
