-- Esquema inicial: Gestão de Químicos + Carregamento
-- Reflete o modelo validado no protótipo (áreas CCN/CCS, embalagem fixa por produto,
-- estoque calculado em tempo real, dosagem contratada, FDS, solicitação de compra)

CREATE TABLE IF NOT EXISTS area (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL UNIQUE CHECK (nome IN ('CCN', 'CCS'))
);

CREATE TABLE IF NOT EXISTS sistema (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  subsistema TEXT,
  area_id INTEGER NOT NULL REFERENCES area(id)
);

CREATE TABLE IF NOT EXISTS produto_quimico (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  finalidade TEXT,
  sistema_id INTEGER NOT NULL REFERENCES sistema(id),
  tipo_embalagem TEXT NOT NULL CHECK (tipo_embalagem IN ('IBC', 'BB')),
  peso_unitario_kg REAL NOT NULL,
  densidade REAL,
  estoque_kg REAL NOT NULL DEFAULT 0,
  estoque_minimo_kg REAL NOT NULL DEFAULT 0,
  volume_inicial_l REAL DEFAULT 0,
  volume_final_l REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS dosagem_contratada (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produto_id INTEGER NOT NULL REFERENCES produto_quimico(id),
  dosagem_alvo TEXT,
  consumo_contratado_mensal_kg REAL
);

CREATE TABLE IF NOT EXISTS ficha_seguranca (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produto_id INTEGER NOT NULL REFERENCES produto_quimico(id),
  arquivo_nome TEXT NOT NULL,
  arquivo_url TEXT,
  data_upload TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lancamento_carregamento (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produto_id INTEGER NOT NULL REFERENCES produto_quimico(id),
  data_hora TEXT NOT NULL DEFAULT (datetime('now')),
  unidades_carregadas REAL NOT NULL,
  peso_calculado_kg REAL NOT NULL,
  volume_inicial_l REAL,
  volume_final_l REAL,
  responsavel TEXT,
  origem TEXT NOT NULL DEFAULT 'online' CHECK (origem IN ('online', 'offline_sync')),
  status_sincronizacao TEXT NOT NULL DEFAULT 'sincronizado'
);

CREATE TABLE IF NOT EXISTS estoque_semanal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produto_id INTEGER NOT NULL REFERENCES produto_quimico(id),
  semana_referencia TEXT NOT NULL,
  estoque_kg REAL NOT NULL
);
