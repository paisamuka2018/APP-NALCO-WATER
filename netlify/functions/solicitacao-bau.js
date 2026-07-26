import { loadDb, json } from './_data.js';

export default async (req) => {
  const db = await loadDb();

  const itens = db.produtosBau
    .filter(p => p.estoque_kg < p.estoque_minimo_kg)
    .map(p => ({
      id: p.id,
      produto: p.nome,
      estoque_kg: p.estoque_kg,
      estoque_minimo_kg: p.estoque_minimo_kg,
      sugerido_kg: Math.max(p.estoque_minimo_kg - p.estoque_kg, 0)
    }));

  return json(itens);
};

export const config = { path: '/api/solicitacao-bau' };
