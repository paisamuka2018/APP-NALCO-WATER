import { loadDb, saveDb, json } from './_data.js';

export default async (req) => {
  const db = await loadDb();
  const url = new URL(req.url);
  const produtoId = Number(url.searchParams.get('produto_id'));

  if (req.method === 'GET') {
    const produto = db.produtos.find(p => p.id === produtoId);
    if (!produto) return json({ erro: 'Produto não encontrado' }, 404);

    const inicioFiltro = url.searchParams.get('inicio');
    const fimFiltro = url.searchParams.get('fim');

    let lancamentosOrdenados = db.lancamentos
      .filter(l => l.produto_id === produtoId)
      .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));

    if (inicioFiltro && fimFiltro) {
      const ini = new Date(inicioFiltro + 'T00:00:00Z');
      const fim = new Date(fimFiltro + 'T23:59:59Z');
      lancamentosOrdenados = lancamentosOrdenados.filter(l => {
        const d = new Date(l.data_hora);
        return d >= ini && d <= fim;
      });
    } else {
      lancamentosOrdenados = lancamentosOrdenados.slice(-12);
    }

    const historico = lancamentosOrdenados.map((l, i) => {
      const anterior = i > 0 ? lancamentosOrdenados[i - 1] : null;
      let consumo_kg = null;

      if (anterior) {
        const volAnteriorFinal = anterior.volume_final_l;
        const volAtualInicial = l.volume_inicial_l;
        if (volAnteriorFinal != null && volAtualInicial != null && produto.densidade) {
          // Consumo = queda de volume no tanque entre o fim do lançamento anterior
          // e o início deste, convertida para kg pela densidade do produto.
          const quedaVolumeL = volAnteriorFinal - volAtualInicial;
          consumo_kg = Math.round(Math.max(quedaVolumeL, 0) * produto.densidade * 100) / 100;
        } else if (anterior.estoque_resultante_kg != null && l.estoque_resultante_kg != null) {
          // Respaldo: sem volume/densidade disponíveis, usa o cálculo por estoque medido.
          consumo_kg = Math.round((anterior.estoque_resultante_kg + l.peso_calculado_kg - l.estoque_resultante_kg) * 100) / 100;
        }
      }

      return {
        data: l.data_hora,
        estoque_kg: l.estoque_resultante_kg ?? null,
        peso_calculado_kg: l.peso_calculado_kg,
        volume_inicial_l: l.volume_inicial_l,
        volume_final_l: l.volume_final_l,
        consumo_kg
      };
    });

    const fds = db.fichasSeguranca
      .filter(f => f.produto_id === produtoId)
      .sort((a, b) => new Date(b.data_upload) - new Date(a.data_upload));

    return json({ produto, historico, fds });
  }

  if (req.method === 'POST') {
    const body = await req.json();
    const produto = db.produtos.find(p => p.id === produtoId);
    if (!produto) return json({ erro: 'Produto não encontrado' }, 404);
    if (body.dosagem_alvo !== undefined) produto.dosagem_alvo = body.dosagem_alvo;
    if (body.consumo_contratado_mensal_kg !== undefined) {
      produto.consumo_contratado_mensal_kg = body.consumo_contratado_mensal_kg
        ? Number(body.consumo_contratado_mensal_kg)
        : null;
    }
    await saveDb(db);
    return json({ ok: true, produto });
  }

  return json({ erro: 'Método não suportado' }, 405);
};

export const config = { path: '/api/produto-detalhe' };
