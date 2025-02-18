export type Info = {
	classification: 'Commercial' | 'Residential' | 'Unknown';
	fromAddress: string;
	fromCity: string;
	fromState: string;
	fromZip: string;
	numberOfPackages: string;
	toAddress: string;
	toCity: string;
	toState: string;
	totalWeight: string;
	toZip: string;
};
export type RatedShipment =
	| {
			Service: {
				Code: string;
				Description: string;
			};
			RatedShipmentAlert: {
				Code: string;
				Description: string;
			}[];
			BillingWeight: {
				UnitOfMeasurement: {
					Code: string;
					Description: string;
				};
				Weight: string;
			};
			TransportationCharges: {
				CurrencyCode: string;
				MonetaryValue: string;
			};
			ServiceOptionsCharges: {
				CurrencyCode: string;
				MonetaryValue: string;
			};
			TotalCharges: {
				CurrencyCode: string;
				MonetaryValue: string;
			};
			GuaranteedDelivery: {
				BusinessDaysInTransit: string;
				DeliveryByTime: string;
			};
			RatedPackage: {
				TransportationCharges: {
					CurrencyCode: string;
					MonetaryValue: string;
				};
				ServiceOptionsCharges: {
					CurrencyCode: string;
					MonetaryValue: string;
				};
				TotalCharges: {
					CurrencyCode: string;
					MonetaryValue: string;
				};
				Weight: string;
				BillingWeight: {
					UnitOfMeasurement: {
						Code: string;
						Description: string;
					};
					Weight: string;
				};
			};
	  }
	| {
			Service: {
				Code: string;
				Description: string;
			};
			RatedShipmentAlert: {
				Code: string;
				Description: string;
			}[];
			BillingWeight: {
				UnitOfMeasurement: {
					Code: string;
					Description: string;
				};
				Weight: string;
			};
			TransportationCharges: {
				CurrencyCode: string;
				MonetaryValue: string;
			};
			ServiceOptionsCharges: {
				CurrencyCode: string;
				MonetaryValue: string;
			};
			TotalCharges: {
				CurrencyCode: string;
				MonetaryValue: string;
			};
			GuaranteedDelivery: {
				BusinessDaysInTransit: string;
				DeliveryByTime?: undefined;
			};
			RatedPackage: {
				TransportationCharges: {
					CurrencyCode: string;
					MonetaryValue: string;
				};
				ServiceOptionsCharges: {
					CurrencyCode: string;
					MonetaryValue: string;
				};
				TotalCharges: {
					CurrencyCode: string;
					MonetaryValue: string;
				};
				Weight: string;
				BillingWeight: {
					UnitOfMeasurement: {
						Code: string;
						Description: string;
					};
					Weight: string;
				};
			};
	  }
	| {
			Service: {
				Code: string;
				Description: string;
			};
			RatedShipmentAlert: {
				Code: string;
				Description: string;
			}[];
			BillingWeight: {
				UnitOfMeasurement: {
					Code: string;
					Description: string;
				};
				Weight: string;
			};
			TransportationCharges: {
				CurrencyCode: string;
				MonetaryValue: string;
			};
			ServiceOptionsCharges: {
				CurrencyCode: string;
				MonetaryValue: string;
			};
			TotalCharges: {
				CurrencyCode: string;
				MonetaryValue: string;
			};
			RatedPackage: {
				TransportationCharges: {
					CurrencyCode: string;
					MonetaryValue: string;
				};
				ServiceOptionsCharges: {
					CurrencyCode: string;
					MonetaryValue: string;
				};
				TotalCharges: {
					CurrencyCode: string;
					MonetaryValue: string;
				};
				Weight: string;
				BillingWeight: {
					UnitOfMeasurement: {
						Code: string;
						Description: string;
					};
					Weight: string;
				};
			};
			GuaranteedDelivery?: undefined;
	  };
export type Result = {
	RateResponse: {
		Response: {
			ResponseStatus: {
				Code: string;
				Description: string;
			};
			Alert: {
				Code: string;
				Description: string;
			}[];
			TransactionReference: {
				CustomerContext: string;
				TransactionIdentifier: string;
			};
		};
		RatedShipment: RatedShipment[];
	};
};
