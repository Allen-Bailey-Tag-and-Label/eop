import type { Column } from './types';

export const columnKey = (column: Column) => (typeof column === 'string' ? column : column.key);
