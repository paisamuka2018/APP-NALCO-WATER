import { loadDb, json } from './_data.js';

export default async (req) => {
  const db = await loadDb();
  const url = new URL(req.url);
  const inicio = url.searchParams.get('inicio');
  const fim = url.searchParams.get('fim');
  const area = url.searchParams.get('area');

  if (!inicio || !fim) return json({ erro: 'Informe início e fim (YYYY-MM-DD)' }, 400);

  const inicioData = new Date(inicio + 'T00:00:00Z');
  const fimData = new Date(fim + 'T23:59:59Z');

  const linhas = [];
  for (const produto of db.produtos) {
    const sistema = db.sistemas.find(s => s.id === produto.sistema_id);
    if (area && sistema?.area !== area) continue;

    const lancamentosDoProduto = db.lancamentos
      .filter(l => l.produto_id === produto.id)
      .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));

    const lancamentosNaSemana = lancamentosDoProduto.filter(l => {
      const d = new Date(l.data_hora);
      return d >= inicioData && d <= fimData;
    });

    if (lancamentosNaSemana.length === 0) continue;

    let consumoTotal = 0;
    lancamentosNaSemana.forEach(l => {
      const idx = lancamentosDoProduto.findIndex(x => x.id === l.id);
      const anterior = idx > 0 ? lancamentosDoProduto[idx - 1] : null;
      if (anterior && anterior.volume_final_l != null && l.volume_inicial_l != null && produto.densidade) {
        const queda = Math.max(anterior.volume_final_l - l.volume_inicial_l, 0);
        consumoTotal += queda * produto.densidade;
      } else if (anterior && anterior.estoque_resultante_kg != null && l.estoque_resultante_kg != null) {
        consumoTotal += Math.max(anterior.estoque_resultante_kg + l.peso_calculado_kg - l.estoque_resultante_kg, 0);
      }
    });

    linhas.push({
      produto_id: produto.id,
      produto: produto.nome,
      sistema: sistema?.nome,
      area: sistema?.area,
      consumo_kg: Math.round(consumoTotal * 100) / 100,
      estoque_atual_kg: produto.estoque_kg,
      estoque_minimo_kg: produto.estoque_minimo_kg,
      abaixo_do_minimo: produto.estoque_kg < produto.estoque_minimo_kg,
      lancamentos_no_periodo: lancamentosNaSemana.length
    });
  }

  return json({ inicio, fim, linhas });
};

export const config = { path: '/api/relatorio-semanal' };
