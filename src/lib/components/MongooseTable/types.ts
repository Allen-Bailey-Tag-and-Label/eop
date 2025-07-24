import { type Props as DatatableProps } from '../Datatable/types';
import * as models from '$lib/server/mongoose/models';

export * from '../Datatable/types';
export type Models = keyof typeof models;
export type Props = DatatableProps & { modelName: Models };
