import sanitizeRow from './sanitizeRow';

export default (rows) => {
  rows = rows.map(sanitizeRow);

  return rows;
};
