import { loadDb, saveDb, json } from './_data.js';

export default async (req) => {
  const db = await loadDb();

  if (req.method === 'GET') {
    return json(db.produtosBau);
  }

  if (req.method === 'POST') {
    // Contagem em lote (dia 15): [{ produto_bau_id, estoque_kg, estoque_minimo_kg }]
    const body = await req.json();
    if (!Array.isArray(body.itens)) return json({ erro: 'Envie itens[]' }, 400);

    for (const item of body.itens) {
      const produto = db.produtosBau.find(p => p.id === Number(item.produto_bau_id));
      if (!produto) continue;
      if (item.estoque_kg !== undefined && item.estoque_kg !== '') {
        produto.estoque_kg = Math.round(Number(item.estoque_kg) * 100) / 100;
      }
      if (item.estoque_minimo_kg !== undefined && item.estoque_minimo_kg !== '') {
        produto.estoque_minimo_kg = Number(item.estoque_minimo_kg);
      }
    }
    await saveDb(db);
    return json({ ok: true });
  }

  return json({ erro: 'Método não suportado' }, 405);
};

export const config = { path: '/api/estoque-bau' };
