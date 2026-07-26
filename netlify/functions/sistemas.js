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

  if (req.method === 'PUT') {
    const sistemaId = Number(url.searchParams.get('sistema_id'));
    const sistema = db.sistemas.find(s => s.id === sistemaId);
    if (!sistema) return json({ erro: 'Sistema não encontrado' }, 404);

    const body = await req.json();
    const campos = ['nome', 'subsistema', 'area', 'clientes_atendidos', 'vazao', 'dosagem_contrato', 'observacoes'];
    campos.forEach(campo => {
      if (body[campo] !== undefined) sistema[campo] = body[campo];
    });

    await saveDb(db);
    return json({ ok: true, sistema });
  }

  return json({ erro: 'Método não suportado' }, 405);
};

export const config = { path: '/api/sistemas' };
