import { loadDb, saveDb, json } from './_data.js';

export default async (req) => {
  const db = await loadDb();
  const url = new URL(req.url);

  if (req.method === 'GET') {
    if (url.searchParams.get('modelos') === '1') {
      // Lista de produtos únicos (por nome) já cadastrados, para reaproveitar como modelo
      const vistos = new Map();
      db.produtos.forEach(p => {
        if (!vistos.has(p.nome)) {
          vistos.set(p.nome, {
            nome: p.nome,
            finalidade: p.finalidade,
            tipo_embalagem: p.tipo_embalagem,
            peso_unitario_kg: p.peso_unitario_kg,
            densidade: p.densidade
          });
        }
      });
      return json(Array.from(vistos.values()));
    }

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
      volume_final_l: 0,
      dosagem_alvo: null,
      consumo_contratado_mensal_kg: null,
      estoque_bau_kg: 0,
      estoque_minimo_bau_kg: 0,
      preco_unitario: body.preco_unitario ? Number(body.preco_unitario) : null
    };
    db.produtos.push(novo);
    await saveDb(db);
    return json({ id: novo.id }, 201);
  }

  if (req.method === 'PUT') {
    const produtoId = Number(url.searchParams.get('produto_id'));
    const produto = db.produtos.find(p => p.id === produtoId);
    if (!produto) return json({ erro: 'Produto não encontrado' }, 404);

    const body = await req.json();
    const campos = [
      'nome', 'finalidade', 'tipo_embalagem', 'peso_unitario_kg',
      'densidade', 'estoque_minimo_kg', 'estoque_kg', 'sistema_id', 'preco_unitario'
    ];
    campos.forEach(campo => {
      if (body[campo] !== undefined && body[campo] !== '') {
        const numericos = ['peso_unitario_kg', 'densidade', 'estoque_minimo_kg', 'estoque_kg', 'sistema_id', 'preco_unitario'];
        produto[campo] = numericos.includes(campo) ? Number(body[campo]) : body[campo];
      }
    });

    await saveDb(db);
    return json({ ok: true, produto });
  }

  if (req.method === 'DELETE') {
    const produtoId = Number(url.searchParams.get('produto_id'));
    const index = db.produtos.findIndex(p => p.id === produtoId);
    if (index === -1) return json({ erro: 'Produto não encontrado' }, 404);

    db.produtos.splice(index, 1);
    // Remove também o histórico de lançamentos e FDS associados, para não deixar "órfãos"
    db.lancamentos = db.lancamentos.filter(l => l.produto_id !== produtoId);
    db.fichasSeguranca = db.fichasSeguranca.filter(f => f.produto_id !== produtoId);

    await saveDb(db);
    return json({ ok: true });
  }

  return json({ erro: 'Método não suportado' }, 405);
};

export const config = { path: '/api/produtos' };
