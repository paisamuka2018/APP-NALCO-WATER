import React, { useEffect, useState } from 'react';
import { mesAtualISO, nomeMes, buscarSemanas } from '../utils/periodo.js';

export default function ConfigSemanasScreen() {
  const [mes, setMes] = useState(mesAtualISO());
  const [semanas, setSemanas] = useState([]);
  const [personalizado, setPersonalizado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  function carregar() {
    buscarSemanas(mes).then(data => {
      setSemanas(data.semanas);
      setPersonalizado(data.personalizado);
    });
  }

  useEffect(() => { carregar(); }, [mes]);

  function atualizarSemana(idx, campo, valor) {
    setSemanas(prev => prev.map((s, i) => i === idx ? { ...s, [campo]: valor } : s));
  }

  function adicionarSemana() {
    const ultima = semanas[semanas.length - 1];
    const proximoInicio = ultima ? new Date(ultima.fim + 'T00:00:00') : new Date();
    proximoInicio.setDate(proximoInicio.getDate() + 1);
    const proximoFim = new Date(proximoInicio);
    proximoFim.setDate(proximoFim.getDate() + 6);
    setSemanas(prev => [...prev, {
      semana: prev.length + 1,
      inicio: proximoInicio.toISOString().slice(0, 10),
      fim: proximoFim.toISOString().slice(0, 10)
    }]);
  }

  function removerSemana(idx) {
    setSemanas(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, semana: i + 1 })));
  }

  async function salvar() {
    setSalvando(true);
    setMensagem('');
    try {
      const res = await fetch('/api/semanas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mes, semanas })
      });
      if (res.ok) {
        setMensagem('Configuração salva com sucesso.');
        setPersonalizado(true);
      } else {
        setMensagem('Não foi possível salvar.');
      }
    } catch {
      setMensagem('Erro de conexão ao salvar.');
    }
    setSalvando(false);
  }

  return (
    <div>
      <label>Mês</label>
      <input type="month" value={mes} onChange={e => setMes(e.target.value)} />

      <p style={{ fontSize: 13, color: '#6b7280' }}>
        {nomeMes(mes)} {personalizado ? '(configuração personalizada)' : '(gerado automaticamente, quarta a quarta)'}
      </p>

      {semanas.map((s, idx) => (
        <div className="card" key={idx}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ fontSize: 14 }}>Semana {s.semana}</strong>
            <button style={{ width: 'auto', padding: '4px 10px', color: '#b91c1c' }} onClick={() => removerSemana(idx)}>Remover</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13 }}>Início</label>
              <input type="date" value={s.inicio} onChange={e => atualizarSemana(idx, 'inicio', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 13 }}>Fim</label>
              <input type="date" value={s.fim} onChange={e => atualizarSemana(idx, 'fim', e.target.value)} />
            </div>
          </div>
        </div>
      ))}

      <button onClick={adicionarSemana} style={{ marginBottom: 12 }}>+ Adicionar semana</button>
      <button className="primary" disabled={salvando} onClick={salvar}>
        {salvando ? 'Salvando...' : 'Salvar configuração deste mês'}
      </button>

      {mensagem && <p style={{ fontSize: 13, marginTop: 8 }}>{mensagem}</p>}
    </div>
  );
}
