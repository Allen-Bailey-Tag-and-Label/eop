import sanitizeColumn from './sanitizeColumn';

export default (columns) => {
  columns = columns.map(sanitizeColumn);
  const columnsSanitized = true;

  return [columns, columnsSanitized];
};
