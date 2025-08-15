import { serverLoad } from '$lib/server/mongoose';
import { UserSettings } from '$lib/server/mongoose/models/UserSettings.js';

export const load = serverLoad({
	model: UserSettings
});
