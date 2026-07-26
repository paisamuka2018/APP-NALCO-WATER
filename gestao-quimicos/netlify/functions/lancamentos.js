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
    const dataHora = body.data_lancamento
      ? new Date(body.data_lancamento).toISOString()
      : new Date().toISOString();

    // Formato novo: lançamento em lote, todos os produtos de um sistema de uma vez
    if (Array.isArray(body.itens)) {
      const resultados = [];
      for (const item of body.itens) {
        const produto = db.produtos.find(p => p.id === Number(item.produto_id));
        if (!produto) continue;
        const unidades = Number(item.unidades_carregadas) || 0;
        const temEstoqueMedido = item.estoque_medido_kg !== undefined && item.estoque_medido_kg !== null && item.estoque_medido_kg !== '';
        // Item sem nada preenchido: não gera lançamento, só pula
        if (unidades === 0 && !temEstoqueMedido && item.volume_inicial_l == null && item.volume_final_l == null) continue;

        const pesoCalculado = Math.round(unidades * produto.peso_unitario_kg * 100) / 100;

        // O estoque real do produto é o valor medido em campo (se informado);
        // caso contrário, cai para o cálculo acumulado (carregamento) como respaldo.
        const estoqueResultante = temEstoqueMedido
          ? Math.round(Number(item.estoque_medido_kg) * 100) / 100
          : Math.round((produto.estoque_kg + pesoCalculado) * 100) / 100;

        const lancamento = {
          id: db.nextIds.lancamento++,
          produto_id: produto.id,
          data_hora: dataHora,
          unidades_carregadas: unidades,
          peso_calculado_kg: pesoCalculado,
          volume_inicial_l: item.volume_inicial_l ?? null,
          volume_final_l: item.volume_final_l ?? null,
          estoque_resultante_kg: estoqueResultante,
          responsavel: body.responsavel || null,
          origem: body.origem || 'online',
          status_sincronizacao: 'sincronizado'
        };
        db.lancamentos.push(lancamento);

        produto.estoque_kg = estoqueResultante;
        if (item.volume_inicial_l != null) produto.volume_inicial_l = Number(item.volume_inicial_l);
        if (item.volume_final_l != null) produto.volume_final_l = Number(item.volume_final_l);

        resultados.push({ produto_id: produto.id, novo_estoque_kg: produto.estoque_kg, lancamento_id: lancamento.id });
      }
      await saveDb(db);
      return json({ resultados }, 201);
    }

    // Formato antigo: um produto por vez (mantido por compatibilidade)
    const produto = db.produtos.find(p => p.id === Number(body.produto_id));
    if (!produto) return json({ erro: 'Produto não encontrado' }, 404);

    const unidades = Number(body.unidades_carregadas) || 0;
    const pesoCalculado = Math.round(unidades * produto.peso_unitario_kg * 100) / 100;

    const lancamento = {
      id: db.nextIds.lancamento++,
      produto_id: produto.id,
      data_hora: dataHora,
      unidades_carregadas: unidades,
      peso_calculado_kg: pesoCalculado,
      volume_inicial_l: body.volume_inicial_l ?? null,
      volume_final_l: body.volume_final_l ?? null,
      estoque_area_kg: body.estoque_area_kg ?? null,
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
