import type { Column } from './types';

export const columnToObject = (column: Column) =>
	typeof column === 'string' ? { key: column, label: column, type: 'string' } : column;
