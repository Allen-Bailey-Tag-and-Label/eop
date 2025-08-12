import { Types } from 'mongoose';

export const coerceByType = (val: any, type?: string) => {
	if (val === '' || val === undefined || val === null) return val;

	switch (type) {
		case 'Number':
			return Number(val);
		case 'Boolean':
			return val === true || val === 'true' || val === 1 || val === '1';
		case 'Date': {
			const d = new Date(val);
			return isNaN(d.getTime()) ? val : d;
		}
		case 'ObjectID':
			return Types.ObjectId.isValid(String(val)) ? new Types.ObjectId(String(val)) : val;
		default:
			return val; // String, Mixed, Array: leave as-is (array handled below)
	}
};
