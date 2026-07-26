import React, { useState, useEffect } from 'react';
import LancamentoScreen from './screens/LancamentoScreen.jsx';
import EstoqueScreen from './screens/EstoqueScreen.jsx';
import SolicitacaoScreen from './screens/SolicitacaoScreen.jsx';
import SistemaScreen from './screens/SistemaScreen.jsx';
import RelatorioSemanalScreen from './screens/RelatorioSemanalScreen.jsx';
import GestaoScreen from './screens/GestaoScreen.jsx';
import ModificarEstoqueScreen from './screens/ModificarEstoqueScreen.jsx';
import LoginScreen from './screens/LoginScreen.jsx';

export default function App() {
  const [tela, setTela] = useState('lancamento');
  const [usuario, setUsuario] = useState(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);

  useEffect(() => {
    const salvo = localStorage.getItem('usuarioAtual');
    if (salvo) setUsuario(JSON.parse(salvo));
    setCarregandoSessao(false);
  }, []);

  function sair() {
    localStorage.removeItem('usuarioAtual');
    setUsuario(null);
  }

  if (carregandoSessao) return null;
  if (!usuario) return <LoginScreen onEntrar={setUsuario} />;

  return (
    <div className="app">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>Gestão de Químicos</h1>
        <div style={{ textAlign: 'right', fontSize: 12, color: '#6b7280' }}>
          {usuario.nome} · {usuario.papel} · <button style={{ width: 'auto', padding: '2px 8px', fontSize: 12 }} onClick={sair}>Sair</button>
        </div>
      </div>

      <div className="nav">
        <button className={tela === 'lancamento' ? 'active' : ''} onClick={() => setTela('lancamento')}>Lançamento</button>
        <button className={tela === 'estoque' ? 'active' : ''} onClick={() => setTela('estoque')}>Estoque</button>
        <button className={tela === 'modificar' ? 'active' : ''} onClick={() => setTela('modificar')}>Modificar estoque</button>
        <button className={tela === 'solicitacao' ? 'active' : ''} onClick={() => setTela('solicitacao')}>Solicitação</button>
        <button className={tela === 'sistema' ? 'active' : ''} onClick={() => setTela('sistema')}>Sistema</button>
        <button className={tela === 'relatorio' ? 'active' : ''} onClick={() => setTela('relatorio')}>Relatório semanal</button>
        <button className={tela === 'gestao' ? 'active' : ''} onClick={() => setTela('gestao')}>Gestão</button>
      </div>

      {tela === 'lancamento' && <LancamentoScreen />}
      {tela === 'estoque' && <EstoqueScreen />}
      {tela === 'modificar' && <ModificarEstoqueScreen />}
      {tela === 'solicitacao' && <SolicitacaoScreen />}
      {tela === 'sistema' && <SistemaScreen />}
      {tela === 'relatorio' && <RelatorioSemanalScreen />}
      {tela === 'gestao' && <GestaoScreen />}
    </div>
  );
}
