import { defineModel } from '../defineModel';

export const Push = defineModel('Push', {
	endpoint: { type: String, required: true },
	expirationTime: { type: Number, default: null },
	keys: {
		auth: { type: String, required: true },
		p256dh: { type: String, required: true }
	}
});
