export type RatedShipment = {
	Service: Service;
	TransportationCharges: TransportationCharges;
};
export type Service =
	| { Code: '01'; Description: '' }
	| { Code: '02'; Description: '' }
	| { Code: '03'; Description: '' }
	| { Code: '12'; Description: '' }
	| { Code: '13'; Description: '' }
	| { Code: '14'; Description: '' }
	| { Code: '59'; Description: '' }
	| { Code: '75'; Description: '' };
export type TransportationCharges = {
	CurrencyCode: 'USD';
	MonetaryValue: string;
};
