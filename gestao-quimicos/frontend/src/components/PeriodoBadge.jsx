import React, { useEffect, useState } from 'react';
import { mesAtualISO, nomeMes, buscarSemanas, semanaAtual } from '../utils/periodo.js';

export default function PeriodoBadge() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const mes = mesAtualISO();
    buscarSemanas(mes).then(data => {
      const atual = semanaAtual(data.semanas);
      setInfo({ mes, atual, personalizado: data.personalizado });
    });
  }, []);

  if (!info) return null;

  return (
    <div style={{ background: '#eef2ff', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#3730a3', display: 'flex', justifyContent: 'space-between' }}>
      <span>
        Mês de referência: <strong>{nomeMes(info.mes)}</strong>
        {info.atual && (
          <> · Semana {info.atual.semana} ({new Date(info.atual.inicio + 'T00:00:00').toLocaleDateString('pt-BR')} - {new Date(info.atual.fim + 'T00:00:00').toLocaleDateString('pt-BR')})</>
        )}
      </span>
      {!info.personalizado && <span style={{ color: '#6366f1' }}>padrão (qua-qua)</span>}
    </div>
  );
}
