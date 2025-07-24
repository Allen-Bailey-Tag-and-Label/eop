import { type Props as DatatableProps } from '../Datatable';
import * as models from '$lib/server/mongoose/models';

export type Models = keyof typeof models;
export type Props = DatatableProps & { modelName: Models };
