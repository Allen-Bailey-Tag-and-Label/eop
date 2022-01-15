// imports
import Excel from 'exceljs';
import { saveAs } from 'file-saver';
import moment from 'moment';

const excel = async options => {
  // destructure options
  const {
    columns = [],
    filename = `export-${moment().format('x')}`,
    rows = [],
    sheetName = 'Sheet 1',
    type
  } = options;
  try {
    // initiate workbook
    const workbook = new Excel.Workbook();

    // initiate worksheet
    const worksheet = workbook.addWorksheet(sheetName);

    // add columns
    columns.forEach(({ key }, i) => {
      worksheet.getRow(1).getCell(i + 1).value = key;
    })

    // add rows
    rows.forEach((row, i) => {
      // loop over columns
      columns.forEach(({ key }, j) => {
        worksheet.getRow(i + 2).getCell(j + 1).value = row[key];
      })
    })

    // write file to buffer
    const buffer = await workbook[type].writeBuffer({ base64: true });

    // create blob for saving
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    // save file
    saveAs(blob, `${filename}.${type}`)
  } catch (error) {
    throw error;
  }
}

export default async options => {
  // destructure options
  const { type = 'xlsx' } = options
  try {
    // check if type is csv or xlsx
    if (type === 'csv' || type === 'xlsx') await excel(options);
  } catch (error) {
    throw error;
  }
}