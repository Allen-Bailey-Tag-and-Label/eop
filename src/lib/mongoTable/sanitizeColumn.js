import { MongoCellCheckbox, MongoCellDate, MongoCellSelect, MongoCellString } from '$components';

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
      column.type === 'checkbox'
        ? MongoCellCheckbox
        : column.type === 'date'
        ? MongoCellDate
        : column.type === 'select'
        ? MongoCellSelect
        : MongoCellString;
  }

  // common column masks
  if (column?.mask === undefined) {
    column.mask = column.type;
  }

  return column;
};
