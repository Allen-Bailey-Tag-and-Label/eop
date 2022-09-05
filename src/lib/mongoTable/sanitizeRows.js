import sanitizeRow from './sanitizeRow';

export default (rows) => {
  rows = rows.map(sanitizeRow);
  const rowsSanitized = true;

  return [rows, rowsSanitized];
};
