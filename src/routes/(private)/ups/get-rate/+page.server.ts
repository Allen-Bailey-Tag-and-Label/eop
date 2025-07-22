import type { Actions } from "@sveltejs/kit";
import { UPS_ACCESSLICENSE_NUMBER, UPS_PASSWORD, UPS_TRANSACTIONSRC, UPS_TRANSID, UPS_USERNAME } from "$env/static/private";
import { proxyFetch } from '$lib/proxyFetch';
import { type RatedShipment } from './types'

export const actions: Actions = {
    default: async ({ request }) => {
        const {
            shipFromAddress,
            shipFromCity,
            shipFromState,
            shipFromZIP,
            shipToAddress,
            shipToCity,
            shipToState,
            shipToZIP,
            packageWeight
        } = <Record<string, string>>Object.fromEntries(await request.formData());

        const upsHeaders = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'AccessLicenseNumber': UPS_ACCESSLICENSE_NUMBER,
            'Password': UPS_PASSWORD,
            'transId': UPS_TRANSID,
            'transactionSrc': UPS_TRANSACTIONSRC,
            'Username': UPS_USERNAME
        };

        const upsBody = JSON.stringify({
            RateRequest: {
                Shipment: {
                    Shipper: {
                        Address: {
                            AddressLine: shipFromAddress,
                            City: shipFromCity,
                            StateProvinceCode: shipFromState,
                            PostalCode: shipFromZIP,
                            CountryCode: 'US'
                        }
                    },
                    ShipTo: {
                        Address: {
                            AddressLine: shipToAddress,
                            City: shipToCity,
                            StateProvinceCode: shipToState,
                            PostalCode: shipToZIP,
                            CountryCode: 'US'
                        }
                    },
                    Package: {
                        PackagingType: {
                            Code: '02'
                        },
                        PackageWeight: {
                            UnitOfMeasurement: {
                                Code: 'LBS'
                            },
                            Weight: packageWeight
                        }
                    }
                }
            }
        });

        const response = await proxyFetch('https://onlinetools.ups.com/ship/v1/rating/Shop', {
            method: 'POST',
            headers: upsHeaders,
            body: upsBody
        });

        const { RateResponse: { RatedShipment } }: { RateResponse: { RatedShipment: RatedShipment[] } } = await response.json();

        return RatedShipment;
    }
}