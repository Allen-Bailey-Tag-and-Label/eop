import { MongoCellCheckbox, MongoCellSelect, MongoCellString } from '$components';

export default (column) => {
  // initialize default column
  const defaultColumn = {
    mask: 'string',
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

  // check if column types
  column.component =
    column.type === 'checkbox'
      ? MongoCellCheckbox
      : column.type === 'select'
      ? MongoCellSelect
      : MongoCellString;

  return column;
};
