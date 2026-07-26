import express from 'express';
import cors from 'cors';
import { db } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

// ---- Áreas e sistemas ----

app.get('/api/areas', (req, res) => {
  res.json(db.prepare('SELECT * FROM area').all());
});

app.get('/api/sistemas', (req, res) => {
  const { area } = req.query;
  const rows = area
    ? db.prepare(`
        SELECT s.*, a.nome AS area_nome FROM sistema s
        JOIN area a ON a.id = s.area_id
        WHERE a.nome = ?
        ORDER BY s.nome
      `).all(area)
    : db.prepare(`
        SELECT s.*, a.nome AS area_nome FROM sistema s
        JOIN area a ON a.id = s.area_id
        ORDER BY s.nome
      `).all();
  res.json(rows);
});

app.post('/api/sistemas', (req, res) => {
  const { nome, subsistema, area_nome } = req.body;
  const area = db.prepare('SELECT id FROM area WHERE nome = ?').get(area_nome);
  if (!area) return res.status(400).json({ erro: 'Área inválida' });
  const info = db
    .prepare('INSERT INTO sistema (nome, subsistema, area_id) VALUES (?, ?, ?)')
    .run(nome, subsistema || null, area.id);
  res.status(201).json({ id: info.lastInsertRowid });
});

// ---- Produtos ----

app.get('/api/produtos', (req, res) => {
  const { sistema_id, area } = req.query;
  let sql = `
    SELECT p.*, s.nome AS sistema_nome, a.nome AS area_nome
    FROM produto_quimico p
    JOIN sistema s ON s.id = p.sistema_id
    JOIN area a ON a.id = s.area_id
  `;
  const params = [];
  const where = [];
  if (sistema_id) { where.push('p.sistema_id = ?'); params.push(sistema_id); }
  if (area) { where.push('a.nome = ?'); params.push(area); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY s.nome, p.nome';
  res.json(db.prepare(sql).all(...params));
});

app.post('/api/produtos', (req, res) => {
  const {
    nome, finalidade, sistema_id, tipo_embalagem,
    peso_unitario_kg, densidade, estoque_minimo_kg
  } = req.body;
  const info = db.prepare(`
    INSERT INTO produto_quimico
      (nome, finalidade, sistema_id, tipo_embalagem, peso_unitario_kg, densidade, estoque_kg, estoque_minimo_kg)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `).run(nome, finalidade || null, sistema_id, tipo_embalagem, peso_unitario_kg, densidade || null, estoque_minimo_kg || 0);
  res.status(201).json({ id: info.lastInsertRowid });
});

// ---- Lançamento de carregamento (com recálculo automático de estoque) ----

app.post('/api/lancamentos', (req, res) => {
  const {
    produto_id, unidades_carregadas, volume_inicial_l,
    volume_final_l, responsavel, origem
  } = req.body;

  const produto = db.prepare('SELECT * FROM produto_quimico WHERE id = ?').get(produto_id);
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });

  const pesoCalculado = Math.round(unidades_carregadas * produto.peso_unitario_kg * 100) / 100;

  const resultado = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO lancamento_carregamento
        (produto_id, unidades_carregadas, peso_calculado_kg, volume_inicial_l, volume_final_l, responsavel, origem, status_sincronizacao)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'sincronizado')
    `).run(produto_id, unidades_carregadas, pesoCalculado, volume_inicial_l ?? null, volume_final_l ?? null, responsavel || null, origem || 'online');

    const novoEstoque = Math.round((produto.estoque_kg + pesoCalculado) * 100) / 100;
    db.prepare(`
      UPDATE produto_quimico
      SET estoque_kg = ?, volume_inicial_l = ?, volume_final_l = ?
      WHERE id = ?
    `).run(novoEstoque, volume_inicial_l ?? produto.volume_inicial_l, volume_final_l ?? produto.volume_final_l, produto_id);

    return { lancamento_id: info.lastInsertRowid, novo_estoque_kg: novoEstoque };
  })();

  res.status(201).json(resultado);
});

app.get('/api/lancamentos', (req, res) => {
  const { produto_id } = req.query;
  const rows = produto_id
    ? db.prepare('SELECT * FROM lancamento_carregamento WHERE produto_id = ? ORDER BY data_hora DESC').all(produto_id)
    : db.prepare('SELECT * FROM lancamento_carregamento ORDER BY data_hora DESC LIMIT 100').all();
  res.json(rows);
});

// ---- Estoque consolidado e alertas ----

app.get('/api/estoque', (req, res) => {
  const { area } = req.query;
  let sql = `
    SELECT p.id, p.nome AS produto, p.estoque_kg, p.estoque_minimo_kg,
           p.tipo_embalagem, p.peso_unitario_kg,
           s.nome AS sistema, a.nome AS area
    FROM produto_quimico p
    JOIN sistema s ON s.id = p.sistema_id
    JOIN area a ON a.id = s.area_id
  `;
  const params = [];
  if (area) { sql += ' WHERE a.nome = ?'; params.push(area); }
  sql += ' ORDER BY s.nome, p.nome';
  res.json(db.prepare(sql).all(...params));
});

// ---- Solicitação de compra (itens abaixo do mínimo, sugestão em kg e unidades) ----

app.get('/api/solicitacao-compra', (req, res) => {
  const { area } = req.query;
  let sql = `
    SELECT p.id, p.nome AS produto, p.estoque_kg, p.estoque_minimo_kg,
           p.tipo_embalagem, p.peso_unitario_kg,
           s.nome AS sistema, a.nome AS area
    FROM produto_quimico p
    JOIN sistema s ON s.id = p.sistema_id
    JOIN area a ON a.id = s.area_id
    WHERE p.estoque_kg < p.estoque_minimo_kg
  `;
  const params = [];
  if (area) { sql += ' AND a.nome = ?'; params.push(area); }
  const itens = db.prepare(sql).all(...params).map(i => {
    const sugeridoKg = Math.max(i.estoque_minimo_kg - i.estoque_kg, 0);
    return {
      ...i,
      sugerido_kg: sugeridoKg,
      sugerido_unidades: Math.ceil(sugeridoKg / i.peso_unitario_kg)
    };
  });
  res.json(itens);
});

// ---- Ficha de segurança (FDS) ----

app.post('/api/produtos/:id/fds', (req, res) => {
  const { arquivo_nome, arquivo_url } = req.body;
  const info = db.prepare(`
    INSERT INTO ficha_seguranca (produto_id, arquivo_nome, arquivo_url)
    VALUES (?, ?, ?)
  `).run(req.params.id, arquivo_nome, arquivo_url || null);
  res.status(201).json({ id: info.lastInsertRowid });
});

app.get('/api/produtos/:id/fds', (req, res) => {
  res.json(
    db.prepare('SELECT * FROM ficha_seguranca WHERE produto_id = ? ORDER BY data_upload DESC').all(req.params.id)
  );
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
