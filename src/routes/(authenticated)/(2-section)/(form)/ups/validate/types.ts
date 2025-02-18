export type AddressClassification =
	| { Code: '0'; Description: 'Unknown' }
	| { Code: '1'; Description: 'Commercial' }
	| { Code: '2'; Description: 'Residential' };
export type AddressKeyFormat = {
	AddressLine: string;
	PoliticalDivision2: string;
	PoliticalDivision1: string;
	PostcodePrimaryLow: string;
	PostcodeExtendedLow: string;
	Region: string;
	CountryCode: string;
};
export type Candidate = {
	AddressClassification: AddressClassification;
	AddressKeyFormat: AddressKeyFormat;
};
export type FormData = {
	address: string;
	city: string;
	state: string;
	zip: string;
};
export type Indicator = 'ambiguousAddress' | 'noCandidates' | 'validAddress';
export type Result = {
	candidates: Candidate[];
	indicator: Indicator;
};
