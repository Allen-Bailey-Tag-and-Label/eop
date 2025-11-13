import type { ServerLoad } from '@sveltejs/kit';
import { connect } from '$lib/server/mongoose';
import { Holiday, SchedulingModifier, SchedulingProductType } from '$lib/server/mongoose/models';

export const load: ServerLoad = async () => {
	await connect();

	return {
		holidays: JSON.parse(JSON.stringify(await Holiday.find())),
		modifiers: JSON.parse(JSON.stringify(await SchedulingModifier.find())),
		productTypes: JSON.parse(JSON.stringify(await SchedulingProductType.find()))
	};
};
