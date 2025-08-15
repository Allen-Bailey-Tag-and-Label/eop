import { serverLoad } from '$lib/server/mongoose';
import { UserProfile } from '$lib/server/mongoose/models/UserProfile.js';

export const load = serverLoad({
	model: UserProfile
});
