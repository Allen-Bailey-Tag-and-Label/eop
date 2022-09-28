import { DBCellButton, DBCellCheckbox, DBCellDate, DBCellSelect, DBCellString } from '$components';

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

  // common column components
  if (column?.component === undefined) {
    column.component =
      column.type === 'button'
        ? DBCellButton
        : column.type === 'checkbox'
        ? DBCellCheckbox
        : column.type === 'date'
        ? DBCellDate
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
