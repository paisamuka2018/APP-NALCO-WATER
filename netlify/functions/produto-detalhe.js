import { loadDb, saveDb, json } from './_data.js';

export default async (req) => {
  const db = await loadDb();
  const url = new URL(req.url);
  const produtoId = Number(url.searchParams.get('produto_id'));

  if (req.method === 'GET') {
    const produto = db.produtos.find(p => p.id === produtoId);
    if (!produto) return json({ erro: 'Produto não encontrado' }, 404);

    const historico = db.lancamentos
      .filter(l => l.produto_id === produtoId)
      .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora))
      .slice(-8)
      .map(l => ({ data: l.data_hora, estoque_kg: null, peso_calculado_kg: l.peso_calculado_kg }));

    const fds = db.fichasSeguranca
      .filter(f => f.produto_id === produtoId)
      .sort((a, b) => new Date(b.data_upload) - new Date(a.data_upload));

    return json({ produto, historico, fds });
  }

  if (req.method === 'POST') {
    const body = await req.json();
    const produto = db.produtos.find(p => p.id === produtoId);
    if (!produto) return json({ erro: 'Produto não encontrado' }, 404);
    if (body.dosagem_alvo !== undefined) produto.dosagem_alvo = body.dosagem_alvo;
    if (body.consumo_contratado_mensal_kg !== undefined) {
      produto.consumo_contratado_mensal_kg = body.consumo_contratado_mensal_kg
        ? Number(body.consumo_contratado_mensal_kg)
        : null;
    }
    await saveDb(db);
    return json({ ok: true, produto });
  }

  return json({ erro: 'Método não suportado' }, 405);
};

export const config = { path: '/api/produto-detalhe' };
