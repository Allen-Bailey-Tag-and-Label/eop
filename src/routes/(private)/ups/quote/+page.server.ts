import type { Actions } from "@sveltejs/kit";
import { UPS_ACCESSLICENSE_NUMBER, UPS_CLIENT_ID, UPS_PASSWORD, UPS_USERNAME } from "$env/static/private";

export const actions: Actions = {
    nonValidated: async ({ request }) => {
        const data = <Record<string, string>>Object.fromEntries(await request.formData());
        console.log(data);
        return { success: true }
    },
    validated: async ({ request }) => {
        // await getToken();
        const { shipFromAddress, shipFromZIP, shipFromCity, shipFromState, shipToAddress, shipToZIP, shipToCity, shipToState, packageInfoTotalPackages, packageInfoTotalWeight } = <Record<string, string>>Object.fromEntries(await request.formData());

        try {
            const response = await fetch('https://onlinetools.ups.com/addressvalidation/v1/3', {
                method: 'POST',
                headers: {
                    AccessLicenseNumber: UPS_ACCESSLICENSE_NUMBER,
                    Password: UPS_PASSWORD,
                    Username: UPS_USERNAME
                },
                body: JSON.stringify({
                    XAVRequest: {
                        AddressKeyFormat: {
                            AddressLine: shipToAddress,
                            PoliticalDivision2: shipToCity,
                            PoliticalDivision1: shipToState,
                            PostcodePrimaryLow: shipToZIP,
                            CountryCode: 'US'
                        }
                    }
                })
            });

            const result = await response.json();

            console.log(result)
            return { result, success: true }

        } catch (error) {
            console.log(error)
        }

    }
}

const getToken = async () => {
    const formData = {
        grant_type: 'client_credentials'
    };

    const resp = await fetch(
        `https://wwwcie.ups.com/security/v1/oauth/token`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'x-merchant-id': 'string',
                Authorization: 'Basic ' + btoa(`${UPS_USERNAME}:${UPS_PASSWORD}`)
            },
            body: new URLSearchParams(formData).toString()
        }
    );

    const data = await resp.text();
    console.log(data);
}