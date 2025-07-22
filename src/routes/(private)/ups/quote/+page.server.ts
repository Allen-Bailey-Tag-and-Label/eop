import type { Actions } from "@sveltejs/kit";
import { deserialize } from "$app/forms";

export const actions: Actions = {
    nonValidated: async ({ request }) => {
        let { shipFromAddress, shipFromZIP, shipFromCity, shipFromState, shipToAddress, shipToZIP, shipToCity, shipToState, packageInfoTotalPackages, packageInfoTotalWeight } = <Record<string, string>>Object.fromEntries(await request.formData());

        return { success: true }
    },
    validated: async ({ fetch, request }) => {
        let { shipFromAddress, shipFromZIP, shipFromCity, shipFromState, shipToAddress, shipToZIP, shipToCity, shipToState, packageInfoTotalPackages, packageInfoTotalWeight } = <Record<string, string>>Object.fromEntries(await request.formData());

        try {
            const formData = new FormData();
            formData.append('address', shipToAddress);
            formData.append('city', shipToCity);
            formData.append('state', shipToState);
            formData.append('zip', shipToZIP);

            const response = await fetch('/ups/address-validation', {
                method: 'POST',
                body: formData
            });

            const result = deserialize(await response.text()) || { data: {} };

            if (result.type === 'success') {
                const { data: candidates } = result;

                if (candidates !== undefined && candidates.length === 1) {
                    const [candidate] = candidates;
                    const { AddressClassification, AddressKeyFormat: { AddressLine, PoliticalDivision2, PoliticalDivision1, PostcodePrimaryLow } } = candidate;
                    shipToAddress = AddressLine[0];
                    shipToCity = PoliticalDivision2;
                    shipToState = PoliticalDivision1;
                    shipToZIP = PostcodePrimaryLow
                }
            }

            const packageWeight = Math.ceil(+packageInfoTotalWeight / +packageInfoTotalPackages).toString()

            await getRates(fetch, shipFromAddress,
                shipFromCity,
                shipFromState,
                shipFromZIP,
                shipToAddress,
                shipToCity,
                shipToState,
                shipToZIP,
                packageWeight);

            return {}

        } catch (error) {
            console.log(error)
        }

    }
}

const getRates = async (fetch: any,
    shipFromAddress: string,
    shipFromCity: string,
    shipFromState: string,
    shipFromZIP: string,
    shipToAddress: string,
    shipToCity: string,
    shipToState: string,
    shipToZIP: string,
    packageWeight: string) => {
    const formData = new FormData();
    formData.append('shipFromAddress', shipFromAddress),
        formData.append('shipFromCity', shipFromCity),
        formData.append('shipFromState', shipFromState),
        formData.append('shipFromZIP', shipFromZIP),
        formData.append('shipToAddress', shipToAddress),
        formData.append('shipToCity', shipToCity),
        formData.append('shipToState', shipToState),
        formData.append('shipToZIP', shipToZIP),
        formData.append('packageWeight', packageWeight)

    const response = await fetch('/ups/get-rate', {
        method: 'POST',
        body: formData
    });

    const RatedShipment = deserialize(await response.text()) || { data: {} };

    console.log(JSON.stringify(RatedShipment, null, 2))
}