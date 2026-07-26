import { loadDb, saveDb, json } from './_data.js';

// Gera semanas padrão (quarta a quarta) para um mês, caso o usuário não tenha configurado nada ainda.
function gerarSemanasPadrao(ano, mes) {
  const semanas = [];
  const primeiroDia = new Date(Date.UTC(ano, mes - 1, 1));
  const ultimoDia = new Date(Date.UTC(ano, mes, 0));

  // Acha a primeira quarta-feira (ou o próprio dia 1, se cair numa quarta)
  let cursor = new Date(primeiroDia);
  while (cursor.getUTCDay() !== 3) cursor.setUTCDate(cursor.getUTCDate() - 1); // volta até a quarta anterior/igual

  let numero = 1;
  while (cursor <= ultimoDia) {
    const inicio = new Date(cursor);
    const fim = new Date(cursor);
    fim.setUTCDate(fim.getUTCDate() + 6);
    semanas.push({
      semana: numero,
      inicio: inicio.toISOString().slice(0, 10),
      fim: fim.toISOString().slice(0, 10)
    });
    cursor.setUTCDate(cursor.getUTCDate() + 7);
    numero++;
  }
  return semanas;
}

export default async (req) => {
  const db = await loadDb();
  const url = new URL(req.url);
  const mes = url.searchParams.get('mes'); // formato "YYYY-MM"

  if (req.method === 'GET') {
    if (!mes) return json({ erro: 'Informe o mês (YYYY-MM)' }, 400);
    if (db.configSemanas[mes]) {
      return json({ mes, semanas: db.configSemanas[mes], personalizado: true });
    }
    const [ano, mesNum] = mes.split('-').map(Number);
    return json({ mes, semanas: gerarSemanasPadrao(ano, mesNum), personalizado: false });
  }

  if (req.method === 'POST') {
    const body = await req.json();
    if (!body.mes || !Array.isArray(body.semanas)) {
      return json({ erro: 'Informe mes e semanas' }, 400);
    }
    db.configSemanas[body.mes] = body.semanas;
    await saveDb(db);
    return json({ ok: true });
  }

  return json({ erro: 'Método não suportado' }, 405);
};

export const config = { path: '/api/semanas' };
