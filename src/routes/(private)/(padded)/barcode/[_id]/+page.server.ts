import { connect } from '$lib/server/mongoose';
import { Barcode } from '$lib/server/mongoose/models';
export const load = async ({ params }) => {
	await connect();

	return {
		_id: params._id,
		barcode: new Promise(async (res) => {
			const barcode = await Barcode.findOne({ _id: params._id });
			res(JSON.parse(JSON.stringify(barcode)));
		})
	};
};
