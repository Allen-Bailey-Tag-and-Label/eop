export type Row = {
	classification: string;
	quote: number;
	address: string;
	city: string;
	state: string;
	zip: string;
	_createdById: string;
	createdAt: Date;
	updatedAt: Date;
};
export type RowPromise = {
	classification: string;
	quote: number;
	shipper: ShippingInfo;
	shipTo: ShippingInfo;
	_createdById: string;
	createdAt: Date;
	updatedAt: Date;
};
export type ShippingInfo = {
	AddressLine: string;
	City: string;
	StateProvinceCode: string;
	PostalCode: string;
};
