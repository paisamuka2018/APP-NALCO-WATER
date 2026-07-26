import { loadDb, saveDb, json } from './_data.js';

export default async (req) => {
  const db = await loadDb();
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const area = url.searchParams.get('area');
    const lista = db.sistemas.filter(s => !area || s.area === area);
    return json(lista);
  }

  if (req.method === 'POST') {
    const body = await req.json();
    const novo = {
      id: db.nextIds.sistema++,
      nome: body.nome,
      subsistema: body.subsistema || null,
      area: body.area_nome
    };
    db.sistemas.push(novo);
    await saveDb(db);
    return json({ id: novo.id }, 201);
  }

  return json({ erro: 'Método não suportado' }, 405);
};

export const config = { path: '/api/sistemas' };
