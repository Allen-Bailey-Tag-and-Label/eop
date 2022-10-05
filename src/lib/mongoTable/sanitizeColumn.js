import {
  DBCellButton,
  DBCellCheckbox,
  DBCellDate,
  DBCellFormula,
  DBCellSelect,
  DBCellString
} from '$components';

export default (column) => {
  // initialize default column
  const defaultColumn = {
    type: 'string'
  };

  // check if column is string
  if (typeof column === 'string') {
    column = {
      innerHTML: column,
      key: column
    };
  }

  column = Object.assign(defaultColumn, column);

  // check if columns needs innerHTML
  if (column?.innerHTML === undefined) column.innerHTML = column.key;

  // common column components
  if (column?.component === undefined) {
    column.component =
      column.type === 'button'
        ? DBCellButton
        : column.type === 'checkbox'
        ? DBCellCheckbox
        : column.type === 'date'
        ? DBCellDate
        : column.type === 'formula'
        ? DBCellFormula
        : column.type === 'select'
        ? DBCellSelect
        : DBCellString;
  }

  // common column masks
  if (column?.mask === undefined) {
    column.mask = column.type;
  }

  return column;
};
