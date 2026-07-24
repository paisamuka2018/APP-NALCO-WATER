import { loadDb, saveDb, json } from './_data.js';

export default async (req) => {
  const db = await loadDb();
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const sistemaId = url.searchParams.get('sistema_id');
    const area = url.searchParams.get('area');
    let lista = db.produtos.map(p => {
      const sistema = db.sistemas.find(s => s.id === p.sistema_id);
      return { ...p, sistema_nome: sistema?.nome, area_nome: sistema?.area };
    });
    if (sistemaId) lista = lista.filter(p => p.sistema_id === Number(sistemaId));
    if (area) lista = lista.filter(p => p.area_nome === area);
    return json(lista);
  }

  if (req.method === 'POST') {
    const body = await req.json();
    const novo = {
      id: db.nextIds.produto++,
      nome: body.nome,
      finalidade: body.finalidade || null,
      sistema_id: Number(body.sistema_id),
      tipo_embalagem: body.tipo_embalagem,
      peso_unitario_kg: Number(body.peso_unitario_kg),
      densidade: body.densidade ? Number(body.densidade) : null,
      estoque_kg: 0,
      estoque_minimo_kg: Number(body.estoque_minimo_kg || 0),
      volume_inicial_l: 0,
      volume_final_l: 0
    };
    db.produtos.push(novo);
    await saveDb(db);
    return json({ id: novo.id }, 201);
  }

  return json({ erro: 'Método não suportado' }, 405);
};

export const config = { path: '/api/produtos' };
