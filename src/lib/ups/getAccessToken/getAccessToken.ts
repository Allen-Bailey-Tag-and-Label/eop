import { UPS_CLIENT_ID, UPS_CLIENT_SECRET } from '$env/static/private';
import { proxyFetch } from '$lib/proxyFetch';

export const getAccessToken = async () => {
	const creds = Buffer.from(`${UPS_CLIENT_ID}:${UPS_CLIENT_SECRET}`).toString('base64');

	const res = await proxyFetch('https://onlinetools.ups.com/security/v1/oauth/token', {
		method: 'POST',
		headers: {
			Authorization: `Basic ${creds}`,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: 'grant_type=client_credentials'
	});

	const data = await res.json();
	return data.access_token;
};
