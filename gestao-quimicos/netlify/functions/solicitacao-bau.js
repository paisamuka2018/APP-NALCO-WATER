import { loadDb, json } from './_data.js';

export default async (req) => {
  const db = await loadDb();

  const itens = db.produtos
    .filter(p => p.estoque_bau_kg < p.estoque_minimo_bau_kg)
    .map(p => {
      const sistema = db.sistemas.find(s => s.id === p.sistema_id);
      const sugeridoKg = Math.max(p.estoque_minimo_bau_kg - p.estoque_bau_kg, 0);
      return {
        id: p.id,
        produto: p.nome,
        sistema: sistema?.nome,
        area: sistema?.area,
        estoque_bau_kg: p.estoque_bau_kg,
        estoque_minimo_bau_kg: p.estoque_minimo_bau_kg,
        tipo_embalagem: p.tipo_embalagem,
        peso_unitario_kg: p.peso_unitario_kg,
        sugerido_kg: sugeridoKg,
        sugerido_unidades: Math.ceil(sugeridoKg / p.peso_unitario_kg)
      };
    });

  return json(itens);
};

export const config = { path: '/api/solicitacao-bau' };
