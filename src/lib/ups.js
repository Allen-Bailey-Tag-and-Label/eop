import { serverFetch } from '$lib/_helpers';

export const addressValidation = async ({ address, city, state, zip }) => {
  try {
    // initiate body
    const body = {
      XAVRequest: {
        AddressKeyFormat: {
          AddressLine: [address],
          PoliticalDivision2: city,
          PoliticalDivision1: state,
          PostcodePrimaryLow: zip,
          CountryCode: 'US',
        },
      },
    };

    const result = await serverFetch({
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'AccessLicenseNumber': import.meta.env.VITE_UPS_ACCESSLICENSENUMBER,
        'Username': import.meta.env.VITE_UPS_USERNAME,
        'Password': import.meta.env.VITE_UPS_PASSWORD,
      },
      href: `https://bobthered-cors-anywhere.herokuapp.com/${
        import.meta.env.VITE_UPS_URL_ADDRESSVALIDATION
        }`,
      body,
    });

    // check if address did not validate
    if (result?.XAVResponse?.Candidate?.AddressClassification === undefined) throw 'Address could not be validated.'

    // destructure result
    const {
      XAVResponse: {
        Candidate: { AddressClassification, AddressKeyFormat },
      },
    } = result;

    // determine if residential
    const residential = AddressClassification.Code === "1" ? false : true;

    // destructure AddressKeyFormat
    ({ AddressLine: address, PoliticalDivision2: city, PoliticalDivision1: state, PostcodePrimaryLow: zip } = AddressKeyFormat);

    return { address, city, residential, state, zip };

  } catch (error) {
    throw error;
  }
};

export const rates = async ({ shipFrom, shipTo, weight: Weight }) => {
  const ShipTo = {
    Address: {
      AddressLine: shipTo.address,
      City: shipTo.city,
      StateProvinceCode: shipTo.state,
      PostalCode: shipTo.zip,
      CountryCode: 'US',
    },
  };
  let Shipper = {
    Address: {
      AddressLine: '3177 LEHIGH ST',
      City: 'CALEDONIA',
      StateProvinceCode: 'NY',
      PostalCode: '14423',
      CountryCode: 'US',
    },
  };

  if (shipFrom !== undefined)
    Shipper.Address = {
      AddressLine: shipFrom.address,
      City: shipFrom.city,
      StateProvinceCode: shipFrom.state,
      PostalCode: shipFrom.zip,
      CountryCode: 'US',
    };

  const body = {
    RateRequest: {
      Shipment: {
        Shipper,
        ShipTo,
        Package: {
          PackagingType: {
            Code: '02',
          },
          PackageWeight: {
            UnitOfMeasurement: {
              Code: 'LBS',
            },
            Weight: Weight.toString(),
          },
        },
      },
    },
  };

  try {
    const result = await serverFetch({
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'AccessLicenseNumber': import.meta.env.VITE_UPS_ACCESSLICENSENUMBER,
        'Username': import.meta.env.VITE_UPS_USERNAME,
        'Password': import.meta.env.VITE_UPS_PASSWORD,
        'transId': 'Tran123',
        'transactionSrc': 'XOLT',
      },
      href: `https://bobthered-cors-anywhere.herokuapp.com/${
        import.meta.env.VITE_UPS_URL_RATES
        }`,
      body,
    });

    const rates = result.RateResponse.RatedShipment.reduce((obj, { Service, TotalCharges }) => {
      obj[Service.Code] = +TotalCharges.MonetaryValue;
      return obj;
    }, {})

    return rates;

  } catch (error) {
    throw error;
  }
};

export const serviceCodes = {
  '03': 'Ground',
  '12': '3 Day Select',
  '02': '2nd Day Air',
  '59': '2nd Day Air A.M.',
  '13': 'Next Dai Air Saver',
  '01': 'Next Day Air',
  '14': 'Next Day Air Early',
}