import { loadDb, saveDb, json } from './_data.js';

export default async (req) => {
  const db = await loadDb();
  const url = new URL(req.url);
  const produtoId = Number(url.searchParams.get('produto_id'));

  if (req.method === 'GET') {
    const lista = db.fichasSeguranca
      .filter(f => f.produto_id === produtoId)
      .sort((a, b) => new Date(b.data_upload) - new Date(a.data_upload));
    return json(lista);
  }

  if (req.method === 'POST') {
    const body = await req.json();
    const nova = {
      id: db.nextIds.fds++,
      produto_id: Number(body.produto_id),
      arquivo_nome: body.arquivo_nome,
      arquivo_url: body.arquivo_url || null,
      data_upload: new Date().toISOString()
    };
    db.fichasSeguranca.push(nova);
    await saveDb(db);
    return json({ id: nova.id }, 201);
  }

  return json({ erro: 'Método não suportado' }, 405);
};

export const config = { path: '/api/fds' };
