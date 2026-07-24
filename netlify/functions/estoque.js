import { loadDb, json } from './_data.js';

export default async (req) => {
  const db = await loadDb();
  const url = new URL(req.url);
  const area = url.searchParams.get('area');

  let lista = db.produtos.map(p => {
    const sistema = db.sistemas.find(s => s.id === p.sistema_id);
    return {
      id: p.id,
      produto: p.nome,
      estoque_kg: p.estoque_kg,
      estoque_minimo_kg: p.estoque_minimo_kg,
      tipo_embalagem: p.tipo_embalagem,
      peso_unitario_kg: p.peso_unitario_kg,
      sistema: sistema?.nome,
      area: sistema?.area
    };
  });

  if (area) lista = lista.filter(i => i.area === area);
  lista.sort((a, b) => a.sistema.localeCompare(b.sistema) || a.produto.localeCompare(b.produto));

  return json(lista);
};

export const config = { path: '/api/estoque' };
