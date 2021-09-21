import { serverFetch } from '$lib/_helpers';

export const addressValidation = async body => {
  // destructure body
  const { address, city, state, zip } = body;

  body = {
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

  return result;
};

export const rates = async body => {
  // deconstruct body
  const { shipTo, weight: Weight } = body;

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

  if ('shipFrom' in body)
    Shipper.Address = {
      AddressLine: shipFrom.address,
      City: shipFrom.city,
      StateProvinceCode: shipFrom.state,
      PostalCode: shipFrom.zip,
      CountryCode: 'US',
    };

  body = {
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
            Weight : Weight.toString(),
          },
        },
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
      'transId': 'Tran123',
      'transactionSrc': 'XOLT',
    },
    href: `https://bobthered-cors-anywhere.herokuapp.com/${
      import.meta.env.VITE_UPS_URL_RATES
    }`,
    body,
  });

  const rates = result.RateResponse.RatedShipment.reduce((obj, {Service, TotalCharges}) => {
    obj[Service.Code] = +TotalCharges.MonetaryValue;
    return obj;
  }, {})

  return rates;
};

export const serviceCodes = {
  '03' : 'Ground',
  '12' : '3 Day Select',
  '02' : '2nd Day Air',
  '59' : '2nd Day Air A.M.',
  '13' : 'Next Dai Air Saver',
  '01' : 'Next Day Air',
  '14' : 'Next Day Air Early',
}