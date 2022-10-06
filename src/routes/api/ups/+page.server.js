import 'dotenv/config';

export const actions = {
  rates: async ({ request }) => {
    // get body
    const body = Object.fromEntries(await request.formData());
    body.RateRequest = JSON.parse(body.RateRequest);

    const response = await fetch(process.env.UPS_RATING_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        AccessLicenseNumber: process.env.UPS_ACCESSLICENSE_NUMBER,
        Username: process.env.UPS_USERNAME,
        Password: process.env.UPS_PASSWORD,
        transId: process.env.UPS_TRANSID,
        transactionSrc: process.env.UPS_TRANSACTIONSRC,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(body)
    });

    const { RateResponse } = await response.json();

    return { RateResponse: JSON.parse(JSON.stringify(RateResponse)), success: true };
  },
  'validate-address': async ({ request }) => {
    // get body
    const body = Object.fromEntries(await request.formData());
    body.XAVRequest = JSON.parse(body.XAVRequest);

    const response = await fetch(process.env.UPS_VALIDATION_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        AccessLicenseNumber: process.env.UPS_ACCESSLICENSE_NUMBER,
        Username: process.env.UPS_USERNAME,
        Password: process.env.UPS_PASSWORD,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(body)
    });

    const { XAVResponse } = await response.json();

    return { XAVResponse: JSON.parse(JSON.stringify(XAVResponse)), success: true };
  }
};
