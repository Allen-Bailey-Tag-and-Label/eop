export type Row = {
	classification: string;
	quote: number;
	date: Date;
	address: string;
	city: string;
	state: string;
	zip: string;
};
export type RowPromise = {
	classification: string;
	quote: number;
	date: Date;
	shipper: ShippingInfo;
	shipTo: ShippingInfo;
};
export type ShippingInfo = {
	AddressLine: string;
	City: string;
	StateProvinceCode: string;
	PostalCode: string;
};
