import { UPS_CLIENT_ID, UPS_CLIENT_SECRET } from '$env/static/private';

export const getAccessToken = async () => {
	const creds = Buffer.from(`${UPS_CLIENT_ID}:${UPS_CLIENT_SECRET}`).toString('base64');

	const body = new URLSearchParams({
		grant_type: 'client_credentials'
	});

	const res = await fetch('https://onlinetools.ups.com/security/v1/oauth/token', {
		method: 'POST',
		headers: {
			Authorization: `Basic ${creds}`,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body
	});

	const data = await res.json();

	if (!res.ok) {
		console.error(data);
		throw new Error(data?.response?.errors?.[0]?.message ?? 'UPS OAuth failed');
	}

	return data.access_token;
};
