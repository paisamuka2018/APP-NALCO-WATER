import { loadDb, json } from './_data.js';

// Reconstrói o estoque/volume "como estavam" até uma data de corte, usando o
// último lançamento daquele produto na data ou antes dela.
function valorHistorico(db, produtoId, ateISO, campoAtual, campoLancamento) {
  if (!ateISO) return null; // sem filtro, o chamador usa o valor atual do produto
  const ateData = new Date(ateISO + 'T23:59:59Z');
  const lancamentos = db.lancamentos
    .filter(l => l.produto_id === produtoId && new Date(l.data_hora) <= ateData)
    .sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora));
  if (lancamentos.length === 0) return 0; // nenhum lançamento até essa data ainda
  return lancamentos[0][campoLancamento] ?? 0;
}

export default async (req) => {
  const db = await loadDb();
  const url = new URL(req.url);
  const area = url.searchParams.get('area');
  const ate = url.searchParams.get('ate'); // YYYY-MM-DD (fim da semana escolhida)

  let lista = db.produtos.map(p => {
    const sistema = db.sistemas.find(s => s.id === p.sistema_id);
    const estoqueKg = ate ? valorHistorico(db, p.id, ate, 'estoque_kg', 'estoque_resultante_kg') : p.estoque_kg;
    const volumeFinalL = ate ? valorHistorico(db, p.id, ate, 'volume_final_l', 'volume_final_l') : p.volume_final_l;
    return {
      id: p.id,
      produto: p.nome,
      estoque_kg: estoqueKg,
      estoque_minimo_kg: p.estoque_minimo_kg,
      tipo_embalagem: p.tipo_embalagem,
      peso_unitario_kg: p.peso_unitario_kg,
      volume_final_l: volumeFinalL,
      densidade: p.densidade,
      sistema: sistema?.nome,
      area: sistema?.area
    };
  });

  if (area) lista = lista.filter(i => i.area === area);
  lista.sort((a, b) => a.sistema.localeCompare(b.sistema) || a.produto.localeCompare(b.produto));

  return json(lista);
};

export const config = { path: '/api/estoque' };
