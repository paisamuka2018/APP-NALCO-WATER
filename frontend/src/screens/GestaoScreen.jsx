import React, { useState } from 'react';
import CadastroScreen from './CadastroScreen.jsx';
import ConfigSemanasScreen from './ConfigSemanasScreen.jsx';

export default function GestaoScreen() {
  const [sub, setSub] = useState('cadastro');

  return (
    <div>
      <div className="tabs">
        <button className={sub === 'cadastro' ? 'active' : ''} onClick={() => setSub('cadastro')}>Cadastros</button>
        <button className={sub === 'semanas' ? 'active' : ''} onClick={() => setSub('semanas')}>Configurar semanas</button>
      </div>

      {sub === 'cadastro' && <CadastroScreen />}
      {sub === 'semanas' && <ConfigSemanasScreen />}
    </div>
  );
}
