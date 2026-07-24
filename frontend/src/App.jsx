import React, { useState } from 'react';
import LancamentoScreen from './screens/LancamentoScreen.jsx';
import EstoqueScreen from './screens/EstoqueScreen.jsx';
import SolicitacaoScreen from './screens/SolicitacaoScreen.jsx';

export default function App() {
  const [tela, setTela] = useState('lancamento');

  return (
    <div className="app">
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Gestão de Químicos</h1>
      <div className="nav">
        <button className={tela === 'lancamento' ? 'active' : ''} onClick={() => setTela('lancamento')}>
          Lançamento
        </button>
        <button className={tela === 'estoque' ? 'active' : ''} onClick={() => setTela('estoque')}>
          Estoque
        </button>
        <button className={tela === 'solicitacao' ? 'active' : ''} onClick={() => setTela('solicitacao')}>
          Solicitação
        </button>
      </div>

      {tela === 'lancamento' && <LancamentoScreen />}
      {tela === 'estoque' && <EstoqueScreen />}
      {tela === 'solicitacao' && <SolicitacaoScreen />}
    </div>
  );
}
