import { Schema } from 'mongoose';
import { defineModel } from '../defineModel';

export const DataTableRow = defineModel('DataTableRow', {
	tableId: {
		type: Schema.Types.ObjectId,
		ref: 'DataTableDefinition',
		required: true,
		index: true
	},
	data: {
		type: Schema.Types.Mixed,
		default: {}
	}
});
