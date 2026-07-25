import React, { useState } from 'react';
import LancamentoScreen from './screens/LancamentoScreen.jsx';
import EstoqueScreen from './screens/EstoqueScreen.jsx';
import SolicitacaoScreen from './screens/SolicitacaoScreen.jsx';
import CadastroScreen from './screens/CadastroScreen.jsx';
import SistemaScreen from './screens/SistemaScreen.jsx';
import EditarProdutosScreen from './screens/EditarProdutosScreen.jsx';

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
        <button className={tela === 'sistema' ? 'active' : ''} onClick={() => setTela('sistema')}>
          Sistema
        </button>
        <button className={tela === 'cadastro' ? 'active' : ''} onClick={() => setTela('cadastro')}>
          Cadastro
        </button>
        <button className={tela === 'editar' ? 'active' : ''} onClick={() => setTela('editar')}>
          Editar
        </button>
      </div>

      {tela === 'lancamento' && <LancamentoScreen />}
      {tela === 'estoque' && <EstoqueScreen />}
      {tela === 'solicitacao' && <SolicitacaoScreen />}
      {tela === 'sistema' && <SistemaScreen />}
      {tela === 'cadastro' && <CadastroScreen />}
      {tela === 'editar' && <EditarProdutosScreen />}
    </div>
  );
}
