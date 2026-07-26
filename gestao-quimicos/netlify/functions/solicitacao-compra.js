import { loadDb, json } from './_data.js';

export default async (req) => {
  const db = await loadDb();
  const url = new URL(req.url);
  const area = url.searchParams.get('area');

  let itens = db.produtos
    .map(p => {
      const sistema = db.sistemas.find(s => s.id === p.sistema_id);
      return { p, sistema };
    })
    .filter(({ p, sistema }) => p.estoque_kg < p.estoque_minimo_kg && (!area || sistema?.area === area))
    .map(({ p, sistema }) => {
      const sugeridoKg = Math.max(p.estoque_minimo_kg - p.estoque_kg, 0);
      return {
        id: p.id,
        produto: p.nome,
        estoque_kg: p.estoque_kg,
        estoque_minimo_kg: p.estoque_minimo_kg,
        tipo_embalagem: p.tipo_embalagem,
        peso_unitario_kg: p.peso_unitario_kg,
        sistema: sistema?.nome,
        area: sistema?.area,
        sugerido_kg: sugeridoKg,
        sugerido_unidades: Math.ceil(sugeridoKg / p.peso_unitario_kg)
      };
    });

  return json(itens);
};

export const config = { path: '/api/solicitacao-compra' };
