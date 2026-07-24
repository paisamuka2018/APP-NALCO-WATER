import ExcelJS from 'exceljs';
import { loadDb } from './_data.js';

export default async (req) => {
  const db = await loadDb();
  const url = new URL(req.url);
  const area = url.searchParams.get('area');

  let itens = db.produtos
    .map(p => {
      const sistema = db.sistemas.find(s => s.id === p.sistema_id);
      return { p, sistema };
    })
    .filter(({ p, sistema }) => p.estoque_kg < p.estoque_minimo_kg && (!area || sistema?.area === area))
    .map(({ p, sistema }) => {
      const sugeridoKg = Math.max(p.estoque_minimo_kg - p.estoque_kg, 0);
      return {
        area: sistema?.area,
        sistema: sistema?.nome,
        produto: p.nome,
        estoque_kg: p.estoque_kg,
        minimo_kg: p.estoque_minimo_kg,
        sugerido_kg: sugeridoKg,
        embalagem: p.tipo_embalagem,
        sugerido_unidades: Math.ceil(sugeridoKg / p.peso_unitario_kg)
      };
    });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Solicitação de Compra');

  sheet.columns = [
    { header: 'Área', key: 'area', width: 8 },
    { header: 'Sistema', key: 'sistema', width: 35 },
    { header: 'Produto', key: 'produto', width: 22 },
    { header: 'Estoque atual (kg)', key: 'estoque_kg', width: 18 },
    { header: 'Estoque mínimo (kg)', key: 'minimo_kg', width: 18 },
    { header: 'Sugerido (kg)', key: 'sugerido_kg', width: 14 },
    { header: 'Embalagem', key: 'embalagem', width: 12 },
    { header: 'Sugerido (unidades)', key: 'sugerido_unidades', width: 16 }
  ];
  sheet.getRow(1).font = { bold: true };
  itens.forEach(i => sheet.addRow(i));

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="solicitacao-compra-${area || 'geral'}.xlsx"`
    }
  });
};

export const config = { path: '/api/relatorio-solicitacao-excel' };
