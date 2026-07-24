import { loadDb, saveDb, json } from './_data.js';

export default async (req) => {
  const db = await loadDb();
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const produtoId = url.searchParams.get('produto_id');
    let lista = db.lancamentos;
    if (produtoId) lista = lista.filter(l => l.produto_id === Number(produtoId));
    lista = [...lista].sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora));
    return json(lista);
  }

  if (req.method === 'POST') {
    const body = await req.json();
    const produto = db.produtos.find(p => p.id === Number(body.produto_id));
    if (!produto) return json({ erro: 'Produto não encontrado' }, 404);

    const unidades = Number(body.unidades_carregadas) || 0;
    const pesoCalculado = Math.round(unidades * produto.peso_unitario_kg * 100) / 100;

    const lancamento = {
      id: db.nextIds.lancamento++,
      produto_id: produto.id,
      data_hora: new Date().toISOString(),
      unidades_carregadas: unidades,
      peso_calculado_kg: pesoCalculado,
      volume_inicial_l: body.volume_inicial_l ?? null,
      volume_final_l: body.volume_final_l ?? null,
      responsavel: body.responsavel || null,
      origem: body.origem || 'online',
      status_sincronizacao: 'sincronizado'
    };
    db.lancamentos.push(lancamento);

    produto.estoque_kg = Math.round((produto.estoque_kg + pesoCalculado) * 100) / 100;
    if (body.volume_inicial_l != null) produto.volume_inicial_l = Number(body.volume_inicial_l);
    if (body.volume_final_l != null) produto.volume_final_l = Number(body.volume_final_l);

    await saveDb(db);
    return json({ lancamento_id: lancamento.id, novo_estoque_kg: produto.estoque_kg }, 201);
  }

  return json({ erro: 'Método não suportado' }, 405);
};

export const config = { path: '/api/lancamentos' };
