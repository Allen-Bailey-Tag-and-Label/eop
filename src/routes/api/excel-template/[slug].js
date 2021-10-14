import Excel from 'exceljs';
import path from 'path';

export async function get({ params, query }) {
  // get collection (slug)
  const { slug: template } = params;

  // initiate wb
  const wb = new Excel.Workbook();

  // read the file
  const workbook = await wb.xlsx.readFile(path.resolve(`./src/excelTemplates/${template}.xlsx`))

  // convert to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  
  return {
    status: 200,
    body: JSON.stringify(buffer)
  }
}