import React, { useEffect, useState } from 'react';

export default function CadastroScreen() {
  const [aba, setAba] = useState('sistema');

  // --- Cadastro de sistema ---
  const [nomeSistema, setNomeSistema] = useState('');
  const [subsistema, setSubsistema] = useState('');
  const [areaSistema, setAreaSistema] = useState('CCN');

  // --- Cadastro de produto ---
  const [sistemas, setSistemas] = useState([]);
  const [nomeProduto, setNomeProduto] = useState('');
  const [finalidade, setFinalidade] = useState('');
  const [sistemaVinculado, setSistemaVinculado] = useState('');
  const [tipoEmbalagem, setTipoEmbalagem] = useState('IBC');
  const [pesoUnitario, setPesoUnitario] = useState('');
  const [densidade, setDensidade] = useState('');
  const [estoqueMinimo, setEstoqueMinimo] = useState('');

  const [mensagem, setMensagem] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [recentes, setRecentes] = useState([]);

  function carregarSistemas() {
    fetch('/api/sistemas')
      .then(r => r.json())
      .then(data => {
        setSistemas(data);
        if (data.length && !sistemaVinculado) setSistemaVinculado(data[0].id);
      });
  }

  useEffect(() => { carregarSistemas(); }, []);

  async function salvarSistema() {
    if (!nomeSistema.trim()) { setMensagem('Informe o nome do sistema.'); return; }
    setSalvando(true);
    setMensagem('');
    try {
      const res = await fetch('/api/sistemas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeSistema, subsistema, area_nome: areaSistema })
      });
      if (res.ok) {
        setMensagem(`Sistema "${nomeSistema}" cadastrado com sucesso.`);
        setRecentes(prev => [{ tipo: 'sistema', nome: nomeSistema, detalhe: `área ${areaSistema}` }, ...prev]);
        setNomeSistema('');
        setSubsistema('');
        carregarSistemas();
      } else {
        setMensagem('Não foi possível salvar o sistema.');
      }
    } catch {
      setMensagem('Erro de conexão ao salvar o sistema.');
    }
    setSalvando(false);
  }

  async function salvarProduto() {
    if (!nomeProduto.trim() || !pesoUnitario || !sistemaVinculado) {
      setMensagem('Preencha nome, sistema vinculado e peso por unidade.');
      return;
    }
    setSalvando(true);
    setMensagem('');
    try {
      const res = await fetch('/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeProduto,
          finalidade,
          sistema_id: Number(sistemaVinculado),
          tipo_embalagem: tipoEmbalagem,
          peso_unitario_kg: Number(pesoUnitario),
          densidade: densidade ? Number(densidade) : null,
          estoque_minimo_kg: Number(estoqueMinimo) || 0
        })
      });
      if (res.ok) {
        setMensagem(`Produto "${nomeProduto}" cadastrado com sucesso.`);
        setRecentes(prev => [{ tipo: 'produto', nome: nomeProduto, detalhe: `${pesoUnitario} kg / ${tipoEmbalagem}` }, ...prev]);
        setNomeProduto('');
        setFinalidade('');
        setPesoUnitario('');
        setDensidade('');
        setEstoqueMinimo('');
      } else {
        setMensagem('Não foi possível salvar o produto.');
      }
    } catch {
      setMensagem('Erro de conexão ao salvar o produto.');
    }
    setSalvando(false);
  }

  return (
    <div>
      <div className="tabs">
        <button className={aba === 'sistema' ? 'active' : ''} onClick={() => setAba('sistema')}>Novo sistema</button>
        <button className={aba === 'produto' ? 'active' : ''} onClick={() => setAba('produto')}>Novo produto</button>
      </div>

      {aba === 'sistema' && (
        <div className="card">
          <label>Nome do sistema</label>
          <input type="text" placeholder="Ex: ETA COMBUSTOL" value={nomeSistema} onChange={e => setNomeSistema(e.target.value)} />

          <label>Subsistema (opcional)</label>
          <input type="text" placeholder="Ex: TORRE COMBUSTOL COM e S/CONTATO" value={subsistema} onChange={e => setSubsistema(e.target.value)} />

          <label>Área</label>
          <select value={areaSistema} onChange={e => setAreaSistema(e.target.value)}>
            <option value="CCN">CCN</option>
            <option value="CCS">CCS</option>
          </select>

          <button className="primary" disabled={salvando} onClick={salvarSistema}>
            {salvando ? 'Salvando...' : 'Salvar sistema'}
          </button>
        </div>
      )}

      {aba === 'produto' && (
        <div className="card">
          <label>Nome do produto</label>
          <input type="text" placeholder="Ex: MAGNAPRO 15.11" value={nomeProduto} onChange={e => setNomeProduto(e.target.value)} />

          <label>Finalidade</label>
          <input type="text" placeholder="Ex: Inibidor de corrosão (fosfato)" value={finalidade} onChange={e => setFinalidade(e.target.value)} />

          <label>Sistema vinculado</label>
          <select value={sistemaVinculado} onChange={e => setSistemaVinculado(e.target.value)}>
            {sistemas.map(s => <option key={s.id} value={s.id}>{s.nome} ({s.area})</option>)}
          </select>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13 }}>Tipo de embalagem</label>
              <select value={tipoEmbalagem} onChange={e => setTipoEmbalagem(e.target.value)}>
                <option value="IBC">IBC</option>
                <option value="BB">BB (bombona)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13 }}>Peso por unidade (kg)</label>
              <input type="number" placeholder="Ex: 1050" value={pesoUnitario} onChange={e => setPesoUnitario(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13 }}>Densidade</label>
              <input type="number" step="0.01" placeholder="Ex: 1.58" value={densidade} onChange={e => setDensidade(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 13 }}>Estoque mínimo (kg)</label>
              <input type="number" placeholder="Ex: 60" value={estoqueMinimo} onChange={e => setEstoqueMinimo(e.target.value)} />
            </div>
          </div>

          <button className="primary" disabled={salvando} onClick={salvarProduto}>
            {salvando ? 'Salvando...' : 'Salvar produto'}
          </button>
        </div>
      )}

      {mensagem && <p style={{ fontSize: 13, marginBottom: 12 }}>{mensagem}</p>}

      {recentes.length > 0 && (
        <div className="card">
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 0 }}>Cadastros recentes nesta sessão</p>
          {recentes.map((r, i) => (
            <div key={i} className="list-item">
              <span>{r.nome}</span>
              <span style={{ color: '#6b7280' }}>{r.detalhe}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
