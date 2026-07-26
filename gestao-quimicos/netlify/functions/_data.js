import { getStore } from '@netlify/blobs';

const STORE_NAME = 'gestao-quimicos';
const KEY = 'db';

// Dados reais extraídos da planilha "Gestão de Químicos" (Julho/2026)
function dadosIniciais() {
  const sistemasSeed = {
    CCN: {
      'ETA COMBUSTOL': { sub: 'TORRE COMBUSTOL COM e S/CONTATO', produtos: [
        { nome: 'MAGNAPRO 15.11', finalidade: 'Inibidor de corrosão (fosfato)', embalagem: 'BB', peso: 39, densidade: 1.58, estoque: 140, minimo: 60, volInicial: 140, volFinal: 140 },
        { nome: 'NALCO 7384.11', finalidade: 'Inibidor de corrosão (zinco)', embalagem: 'BB', peso: 45, densidade: 1.8, estoque: 30, minimo: 40, volInicial: 10, volFinal: 30 },
        { nome: '3DT 121.11', finalidade: 'Dispersante para metais', embalagem: 'BB', peso: 21, densidade: 1.2, estoque: 165, minimo: 70, volInicial: 175, volFinal: 165 }
      ]},
      MLC: { sub: 'TORRE COMBUSTOL C/CONTATO (SISTEMA DIRETO MLC)', produtos: [
        { nome: 'MAGNAPRO 15.61', finalidade: 'Inibidor de corrosão (fosfato)', embalagem: 'BB', peso: 39, densidade: 1.58, estoque: 0, minimo: 30, volInicial: 0, volFinal: 0 },
        { nome: 'NALCO 7384.11', finalidade: 'Inibidor de corrosão (zinco)', embalagem: 'BB', peso: 45, densidade: 1.8, estoque: 0, minimo: 20, volInicial: 0, volFinal: 0 }
      ]},
      'SISTEMA DE LAVAGEM DE GÁS DOS ALTOS FORNOS': { sub: null, produtos: [
        { nome: '71301', finalidade: 'Polímero (espessador)', embalagem: 'BB', peso: 19, densidade: 1.02, estoque: 50, minimo: 40, volInicial: 60, volFinal: 50 },
        { nome: 'MAGNAPRO 12.11', finalidade: 'Dispersante CaCO3', embalagem: 'BB', peso: 30, densidade: 1.26, estoque: 0, minimo: 50, volInicial: 20, volFinal: 0 }
      ]},
      ETAL: { sub: 'SIST.RESF.SEC_AF', produtos: [
        { nome: 'MAGNAPRO 15.11', finalidade: 'Inibidor de corrosão (fosfato)', embalagem: 'BB', peso: 39, densidade: 1.58, estoque: 48, minimo: 30, volInicial: 60, volFinal: 48 },
        { nome: 'NALCO 7384.11', finalidade: 'Inibidor de corrosão (zinco)', embalagem: 'BB', peso: 45, densidade: 1.8, estoque: 12, minimo: 15, volInicial: 10, volFinal: 12 }
      ]},
      ERA: { sub: null, produtos: [
        { nome: 'Ultrion 8187', finalidade: 'Coagulante', embalagem: 'IBC', peso: 1400, densidade: 1.4, estoque: 160, minimo: 200, volInicial: 980, volFinal: 160 },
        { nome: '7751.11', finalidade: 'Auxiliar de floculação', embalagem: 'BB', peso: 25, densidade: 1.19, estoque: 60, minimo: 40, volInicial: 55, volFinal: 60 }
      ]},
      ETA_LD: { sub: 'SIST. RESFR.ETA-LD PRIMÁRIO', produtos: [
        { nome: 'MAGNAPRO 15.11', finalidade: 'Inibidor de corrosão (fosfato)', embalagem: 'BB', peso: 39, densidade: 1.58, estoque: 37, minimo: 30, volInicial: 50, volFinal: 37 },
        { nome: 'NALCO 7384.11', finalidade: 'Inibidor de corrosão (zinco)', embalagem: 'BB', peso: 45, densidade: 1.8, estoque: 6, minimo: 10, volInicial: 6, volFinal: 6 }
      ]},
      ACIARIA: { sub: 'DESMI. FORNO PAMELA', produtos: [
        { nome: 'TRAC 109.11', finalidade: 'Inibidor de corrosão (nitrito)', embalagem: 'BB', peso: 25, densidade: 1.35, estoque: 55, minimo: 40, volInicial: 60, volFinal: 55 },
        { nome: 'NALCO 8315', finalidade: 'Dispersante', embalagem: 'BB', peso: 25, densidade: 1.15, estoque: 0, minimo: 20, volInicial: 0, volFinal: 0 }
      ]},
      'ETA MLC': { sub: 'SIST. RESFR. INDIRETO MLC', produtos: [
        { nome: 'MAGNAPRO 15.11', finalidade: 'Inibidor de corrosão (fosfato)', embalagem: 'BB', peso: 39, densidade: 1.58, estoque: 22, minimo: 30, volInicial: 52, volFinal: 22 },
        { nome: 'NALCO 7384.11', finalidade: 'Inibidor de corrosão (zinco)', embalagem: 'BB', peso: 45, densidade: 1.8, estoque: 21, minimo: 15, volInicial: 10, volFinal: 21 },
        { nome: '3DT 121.11', finalidade: 'Dispersante para metais', embalagem: 'BB', peso: 21, densidade: 1.2, estoque: 150, minimo: 100, volInicial: 140, volFinal: 150 }
      ]},
      'ETAL - DOSAGEM SATÉLITE LAVADOR DE GAS': { sub: null, produtos: [
        { nome: '7385.61', finalidade: 'Dispersante', embalagem: 'BB', peso: 35, densidade: 1.28, estoque: 200, minimo: 150, volInicial: 200, volFinal: 200 }
      ]},
      'SUMP ERA': { sub: null, produtos: [
        { nome: 'Ultrion 8187', finalidade: 'Coagulante', embalagem: 'IBC', peso: 1400, densidade: 1.4, estoque: 0, minimo: 50, volInicial: 0, volFinal: 0 },
        { nome: '7751.11', finalidade: 'Auxiliar de floculação', embalagem: 'IBC', peso: 1190, densidade: 1.19, estoque: 1200, minimo: 300, volInicial: 1200, volFinal: 1200 }
      ]}
    },
    CCS: {
      ETA_SUL: { sub: 'ETA TL 01/02 COM E SEM CONTATO', produtos: [
        { nome: 'MAGNAPRO 15.61', finalidade: 'Inibidor de corrosão (fosfato)', embalagem: 'IBC', peso: 1050, densidade: 1.58, estoque: 0, minimo: 100, volInicial: 500, volFinal: 0 },
        { nome: 'NALCO 7128.61L', finalidade: 'Polímero', embalagem: 'IBC', peso: 1005, densidade: 1.05, estoque: 750, minimo: 500, volInicial: 1050, volFinal: 750 }
      ]},
      'CENTRAL DE AR E SOPRADORES': { sub: null, produtos: [
        { nome: 'MAGNAPRO 15.11', finalidade: 'Inibidor de corrosão (fosfato)', embalagem: 'BB', peso: 39, densidade: 1.58, estoque: 20, minimo: 15, volInicial: 6, volFinal: 20 },
        { nome: 'NALCO 7384', finalidade: 'Inibidor de corrosão (zinco)', embalagem: 'BB', peso: 45, densidade: 1.8, estoque: 40, minimo: 20, volInicial: 5, volFinal: 40 }
      ]},
      'SOPRADOR B': { sub: null, produtos: [
        { nome: 'MAGNAPRO 15.11', finalidade: 'Inibidor de corrosão (fosfato)', embalagem: 'BB', peso: 39, densidade: 1.58, estoque: 10, minimo: 15, volInicial: 4, volFinal: 10 },
        { nome: '3DT 121.11', finalidade: 'Dispersante para metais', embalagem: 'BB', peso: 21, densidade: 1.2, estoque: 20, minimo: 15, volInicial: 7, volFinal: 20 }
      ]},
      CALDEIRAS: { sub: null, produtos: [
        { nome: 'NALCO 9546', finalidade: 'Dispersante', embalagem: 'BB', peso: 40, densidade: 0.89, estoque: 10, minimo: 30, volInicial: 20, volFinal: 10 },
        { nome: 'NALCO 19 PULV', finalidade: 'Sequestrante de oxigênio', embalagem: 'BB', peso: 55, densidade: 1.0, estoque: 35, minimo: 40, volInicial: 35, volFinal: 35 }
      ]},
      'ETA POTÁVEL': { sub: null, produtos: [
        { nome: 'NALCO 500274.11', finalidade: 'Coagulante', embalagem: 'BB', peso: 30, densidade: 1.54, estoque: 180, minimo: 100, volInicial: 180, volFinal: 180 }
      ]},
      'TL-02 (POÇO DE CAREPA)': { sub: null, produtos: [
        { nome: 'Ultrion 8187', finalidade: 'Coagulante', embalagem: 'IBC', peso: 1400, densidade: 1.4, estoque: 0, minimo: 200, volInicial: 0, volFinal: 0 },
        { nome: '7751.11', finalidade: 'Auxiliar de floculação', embalagem: 'IBC', peso: 1190, densidade: 1.19, estoque: 0, minimo: 100, volInicial: 0, volFinal: 0 }
      ]},
      'HALL DE EXPEDIÇÃO': { sub: null, produtos: [
        { nome: 'MAGNAPRO 15.11', finalidade: 'Inibidor de corrosão (fosfato)', embalagem: 'BB', peso: 39, densidade: 1.58, estoque: 9.5, minimo: 10, volInicial: 9, volFinal: 9.5 },
        { nome: '3DT 121.11', finalidade: 'Dispersante para metais', embalagem: 'BB', peso: 21, densidade: 1.2, estoque: 48, minimo: 20, volInicial: 25, volFinal: 48 }
      ]}
    }
  };

  let sistemaIdSeq = 1;
  let produtoIdSeq = 1;
  const sistemas = [];
  const produtos = [];

  for (const area of ['CCN', 'CCS']) {
    for (const [nomeSistema, info] of Object.entries(sistemasSeed[area])) {
      const sistemaId = sistemaIdSeq++;
      sistemas.push({ id: sistemaId, nome: nomeSistema, subsistema: info.sub, area });
      for (const p of info.produtos) {
        produtos.push({
          id: produtoIdSeq++,
          nome: p.nome,
          finalidade: p.finalidade,
          sistema_id: sistemaId,
          tipo_embalagem: p.embalagem,
          peso_unitario_kg: p.peso,
          densidade: p.densidade,
          estoque_kg: p.estoque,
          estoque_minimo_kg: p.minimo,
          volume_inicial_l: p.volInicial,
          volume_final_l: p.volFinal,
          dosagem_alvo: p.dosagem || null,
          consumo_contratado_mensal_kg: null,
          estoque_bau_kg: 0,
          estoque_minimo_bau_kg: 0
        });
      }
    }
  }

  return {
    sistemas,
    produtos,
    lancamentos: [],
    fichasSeguranca: [],
    configSemanas: {},
    nextIds: { sistema: sistemaIdSeq, produto: produtoIdSeq, lancamento: 1, fds: 1 }
  };
}

export async function loadDb() {
  const store = getStore(STORE_NAME);
  const data = await store.get(KEY, { type: 'json' });
  if (data) {
    // Compatibilidade com bancos salvos antes destas novas colunas/seções
    if (!data.configSemanas) data.configSemanas = {};
    data.produtos.forEach(p => {
      if (p.estoque_bau_kg === undefined) p.estoque_bau_kg = 0;
      if (p.estoque_minimo_bau_kg === undefined) p.estoque_minimo_bau_kg = 0;
    });
    return data;
  }
  const inicial = dadosIniciais();
  await store.setJSON(KEY, inicial);
  return inicial;
}

export async function saveDb(db) {
  const store = getStore(STORE_NAME);
  await store.setJSON(KEY, db);
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
