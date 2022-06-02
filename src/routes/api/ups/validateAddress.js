import 'dotenv/config';

export async function post({ body }) {
  const response = await fetch(
    'https://onlinetools.ups.com/addressvalidation/v1/3',
    {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'AccessLicenseNumber': process.env['UPS_ACCESSLICENSE_NUMBER'],
        'Username': process.env['UPS_USERNAME'],
        'Password': process.env['UPS_PASSWORD'],
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify(body),
    },
  );

  const data = await response.json();

  return { status: 200, body: data };
}
