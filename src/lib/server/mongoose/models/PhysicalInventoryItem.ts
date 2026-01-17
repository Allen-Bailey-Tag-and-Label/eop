import { Types } from 'mongoose';
import { defineModel } from '../defineModel';

export const PhysicalInventoryItem = defineModel('PhysicalInventoryItem', {
	branchId: { type: Types.ObjectId, ref: 'Branch' },
	stockingType: { type: String },
	lineType: { type: String },
	itemNumber: { type: String },
	description: { type: String },
	description2: { type: String },
	searchText: { type: String },
	salesCode1: { type: String },
	salesCode2: { type: String },
	salesCode3: { type: String },
	salesCode4: { type: String },
	salesCode5: { type: String },
	purchCode1: { type: String },
	purchCode2: { type: String },
	purchCode3: { type: String },
	planFmly: { type: String },
	costRule: { type: String },
	buyerNumber: { type: String },
	plannerNumber: { type: String },
	supplierNumber: { type: String },
	itemFlashMessage: { type: String },
	thirdItemNumber: { type: String },
	shortItemNo: { type: String },
	itemClass: { type: String },
	groupWarehouseProcess1: { type: String },
	groupWarehouseProcess2: { type: String },
	groupWarehouseProcess3: { type: String },
	categoryCode8: { type: String },
	categoryCode10: { type: String }
});
