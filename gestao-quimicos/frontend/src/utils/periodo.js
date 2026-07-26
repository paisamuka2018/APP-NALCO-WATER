export function mesAtualISO() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
}

export function nomeMes(mesISO) {
  const [ano, mes] = mesISO.split('-').map(Number);
  const nomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${nomes[mes - 1]}/${ano}`;
}

export async function buscarSemanas(mesISO) {
  const res = await fetch(`/api/semanas?mes=${mesISO}`);
  return res.json();
}

export function semanaAtual(semanas) {
  const hojeStr = new Date().toISOString().slice(0, 10);
  return semanas.find(s => hojeStr >= s.inicio && hojeStr <= s.fim) || semanas[0];
}
