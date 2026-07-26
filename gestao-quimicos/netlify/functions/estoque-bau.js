import { loadDb, saveDb, json } from './_data.js';

export default async (req) => {
  const db = await loadDb();

  if (req.method === 'GET') {
    const lista = db.produtos.map(p => {
      const sistema = db.sistemas.find(s => s.id === p.sistema_id);
      return {
        id: p.id,
        produto: p.nome,
        sistema: sistema?.nome,
        area: sistema?.area,
        tipo_embalagem: p.tipo_embalagem,
        peso_unitario_kg: p.peso_unitario_kg,
        estoque_bau_kg: p.estoque_bau_kg,
        estoque_minimo_bau_kg: p.estoque_minimo_bau_kg
      };
    });
    return json(lista);
  }

  if (req.method === 'POST') {
    // Contagem em lote (dia 15): [{ produto_id, estoque_bau_kg, estoque_minimo_bau_kg }]
    const body = await req.json();
    if (!Array.isArray(body.itens)) return json({ erro: 'Envie itens[]' }, 400);

    for (const item of body.itens) {
      const produto = db.produtos.find(p => p.id === Number(item.produto_id));
      if (!produto) continue;
      if (item.estoque_bau_kg !== undefined && item.estoque_bau_kg !== '') {
        produto.estoque_bau_kg = Math.round(Number(item.estoque_bau_kg) * 100) / 100;
      }
      if (item.estoque_minimo_bau_kg !== undefined && item.estoque_minimo_bau_kg !== '') {
        produto.estoque_minimo_bau_kg = Number(item.estoque_minimo_bau_kg);
      }
    }
    await saveDb(db);
    return json({ ok: true });
  }

  return json({ erro: 'Método não suportado' }, 405);
};

export const config = { path: '/api/estoque-bau' };
