import React, { useState } from 'react';
import { COLABORADORES } from '../utils/colaboradores.js';

const PAPEIS = ['Engenheiro', 'Técnico', 'Gerencial'];

export default function LoginScreen({ onEntrar }) {
  const [nome, setNome] = useState('');
  const [papel, setPapel] = useState('Técnico');

  function entrar() {
    if (!nome) return;
    const usuario = { nome, papel };
    localStorage.setItem('usuarioAtual', JSON.stringify(usuario));
    onEntrar(usuario);
  }

  return (
    <div className="app" style={{ display: 'flex', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ width: '100%' }}>
        <h1 style={{ fontSize: 20, marginTop: 0 }}>Gestão de Químicos</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: -8 }}>
          Selecione seu nome e nível de acesso. (Login temporário — os usuários
          reais e permissões definitivas serão configurados em breve.)
        </p>

        <label>Nome</label>
        <select value={nome} onChange={e => setNome(e.target.value)}>
          <option value="">Selecione...</option>
          {COLABORADORES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <label>Nível de acesso</label>
        <select value={papel} onChange={e => setPapel(e.target.value)}>
          {PAPEIS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <button className="primary" disabled={!nome} onClick={entrar}>Entrar</button>
      </div>
    </div>
  );
}
