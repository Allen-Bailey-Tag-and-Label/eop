import { createHash } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { FREIGHT_CLASSES, type CarrierRate, type ShippingRequest } from '$lib/shipping/types';
import { ShippingError } from '$lib/shipping/validation';
import { decimalHundredths } from '$lib/shipping/markups';
import { freightDensity } from '$lib/shipping/density';

export function unishippersStatus() {
	let staging = false;
	try {
		staging = new URL(env.UNISHIPPERS_API_BASE_URL ?? '').hostname === 'speedship.staging-wwex.com';
	} catch {
		/* Not configured yet. */
	}
	return {
		configured: [
			'UNISHIPPERS_CLIENT_ID',
			'UNISHIPPERS_CLIENT_SECRET',
			'UNISHIPPERS_TOKEN_URL',
			'UNISHIPPERS_API_BASE_URL',
			'UNISHIPPERS_AUDIENCE'
		].every((key) => !!env[key]?.trim()),
		staging
	};
}

function configuration() {
	if (!unishippersStatus().configured)
		throw new ShippingError('Unishippers LTL is not configured on this server.', 503);
	const secureUrl = (value: string) => {
		try {
			const url = new URL(value);
			if (url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash)
				return url;
		} catch {
			/* Report a configuration error without exposing its value. */
		}
		throw new ShippingError('Unishippers requires valid HTTPS connection settings.', 503);
	};
	const tokenUrl = secureUrl(env.UNISHIPPERS_TOKEN_URL!);
	const apiUrl = secureUrl(env.UNISHIPPERS_API_BASE_URL!);
	const clientId = env.UNISHIPPERS_CLIENT_ID!,
		clientSecret = env.UNISHIPPERS_CLIENT_SECRET!,
		audience = env.UNISHIPPERS_AUDIENCE!;
	const key = createHash('sha256')
		.update(JSON.stringify([tokenUrl.href, clientId, clientSecret, audience]))
		.digest('hex');
	return {
		tokenUrl,
		apiUrl,
		clientId,
		clientSecret,
		audience,
		key,
		staging: apiUrl.hostname === 'speedship.staging-wwex.com'
	};
}
type Configuration = ReturnType<typeof configuration>;
let cached: { key: string; token: string; expiresAt: number } | undefined;
let pending: { key: string; promise: Promise<string> } | undefined;

async function accessToken(config: Configuration) {
	if (cached?.key === config.key && cached.expiresAt > Date.now()) return cached.token;
	if (pending?.key === config.key) return pending.promise;
	const promise = (async () => {
		try {
			const response = await fetch(config.tokenUrl, {
				method: 'POST',
				signal: AbortSignal.timeout(15_000),
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					grant_type: 'client_credentials',
					client_id: config.clientId,
					client_secret: config.clientSecret,
					audience: config.audience
				})
			});
			if (!response.ok)
				throw new ShippingError(
					'Unishippers authentication failed. Check the server credentials.',
					502
				);
			const body: { access_token?: unknown; expires_in?: unknown; token_type?: unknown } =
				await response.json();
			const seconds = Number(body.expires_in);
			if (
				typeof body.access_token !== 'string' ||
				!body.access_token ||
				!['number', 'string'].includes(typeof body.expires_in) ||
				!Number.isFinite(seconds) ||
				seconds <= 0 ||
				typeof body.token_type !== 'string' ||
				body.token_type.toLowerCase() !== 'bearer'
			)
				throw new ShippingError('Unishippers returned an invalid authentication response.', 502);
			cached = {
				key: config.key,
				token: body.access_token,
				expiresAt: Date.now() + Math.max(0, Math.min(seconds, 86400) * 1000 - 60_000)
			};
			return body.access_token;
		} catch (cause) {
			if (cause instanceof ShippingError) throw cause;
			throw new ShippingError('Unishippers authentication is unavailable. Please try again.', 502);
		}
	})();
	pending = { key: config.key, promise };
	try {
		return await promise;
	} finally {
		if (pending?.promise === promise) pending = undefined;
	}
}

export function unishippersRatePayload(request: ShippingRequest) {
	const address = (value: ShippingRequest['shipFrom'], limited: boolean) => ({
		address: {
			addressLineList: value.address ? [value.address] : [],
			locality: value.city,
			region: value.state,
			postalCode: value.zip,
			countryCode: 'US'
		},
		locationType: limited ? 'LIMITED_ACCESS' : null
	});
	const extra = request.accessorials;
	return {
		request: {
			productType: 'LTL',
			returnSelectedServiceOnly: false,
			preferredVendorList: [],
			shipment: {
				originAddress: address(request.shipFrom, extra.limitedAccessPickup),
				destinationAddress: address(request.shipTo, extra.limitedAccessDelivery),
				shipmentDate: request.shipDate + ' 11:00:00',
				handlingUnitList: request.freight.map((item) => {
					const classification = freightDensity(item);
					if (!classification)
						throw new ShippingError(
							'Enter valid LTL weights, dimensions, and quantities to calculate freight class.'
						);
					// The form stores per-unit weight; SpeedShip expects each group's total weight.
					const weight = { value: Number((item.weight * item.quantity).toFixed(3)), unit: 'LB' };
					return {
						packagingType: 'PLT',
						quantity: item.quantity,
						isStackable: item.stackable,
						isMixedClass: false,
						billedDimension: {
							length: { value: String(item.length), unit: 'in' },
							width: { value: String(item.width), unit: 'in' },
							height: { value: String(item.height), unit: 'in' },
							dimensionType: 'NET'
						},
						weight,
						shippedItemList: [
							{
								commodityClass: classification.freightClass,
								commodityDescription: item.description || 'Tags and labels',
								commodityType: 'BOX',
								NMFCNbr: item.nmfc,
								quantity: String(item.quantity),
								weight,
								isHazMat: false
							}
						]
					};
				}),
				totalHandlingUnitCount: request.freight.reduce((sum, item) => sum + item.quantity, 0),
				totalWeight: {
					value: Number(
						request.freight.reduce((sum, item) => sum + item.quantity * item.weight, 0).toFixed(3)
					),
					unit: 'LB'
				},
				handlingCharge: { value: '0', unit: 'AMOUNT' },
				insuranceRequestFlag: false,
				liftgatePickupFlag: extra.pickupLiftgate,
				liftgateDeliveryFlag: extra.deliveryLiftgate,
				insidePickupFlag: extra.insidePickup,
				insideDeliveryFlag: extra.insideDelivery,
				residentialPickupFlag: request.shipFrom.residential,
				residentialDeliveryFlag: request.shipTo.residential
			}
		}
	};
}

type Commodity = { commodityClass?: string; updatedCommodityClass?: string };
type Offer = {
	offerId?: string;
	primaryVendor?: { preferredName?: string; scac?: string };
	totalOfferPrice?: { value?: unknown; unit?: string };
	offeredProductList?: {
		shopRQShipment?: {
			handlingUnitList?: { shippedItemList?: Commodity[] }[];
			timeInTransit?: {
				transitDays?: number;
				estimatedDeliveryDate?: string;
				serviceLevel?: string;
			};
		};
	}[];
};
export function normalizeUnishippersRates(
	value: unknown,
	staging: boolean,
	freightClasses: string[]
): CarrierRate[] {
	const freightClass = [...new Set(freightClasses)].join(', ');
	const body = value as {
		clientStatus?: { success?: boolean };
		response?: { offerList?: Offer[] };
	} | null;
	if (body?.clientStatus?.success !== true || !Array.isArray(body.response?.offerList))
		throw new ShippingError(
			'Unishippers could not rate this shipment. Check the addresses, freight details, and services.',
			502
		);
	if (!body.response.offerList.length)
		throw new ShippingError('Unishippers returned no LTL offers for this shipment.');
	return body.response.offerList.map((offer) => {
		const amount = offer?.totalOfferPrice;
		if (
			amount?.unit !== 'USD' ||
			(typeof amount.value !== 'number' && typeof amount.value !== 'string') ||
			typeof offer.primaryVendor?.scac !== 'string' ||
			!offer.primaryVendor.scac ||
			typeof offer.primaryVendor.preferredName !== 'string' ||
			!offer.primaryVendor.preferredName ||
			typeof offer.offerId !== 'string' ||
			!offer.offerId
		)
			throw new ShippingError('Unishippers returned an incomplete or unsupported LTL offer.', 502);
		const products = Array.isArray(offer.offeredProductList) ? offer.offeredProductList : [];
		const transit = products[0]?.shopRQShipment?.timeInTransit;
		const changedClasses = [
			...new Set(
				products.flatMap((product) => {
					const units = product?.shopRQShipment?.handlingUnitList;
					return Array.isArray(units)
						? units.flatMap((unit, index) =>
								Array.isArray(unit?.shippedItemList)
									? unit.shippedItemList.flatMap((item) =>
											item?.updatedCommodityClass &&
											item.updatedCommodityClass !==
												(item.commodityClass ?? freightClasses[index]) &&
											FREIGHT_CLASSES.includes(item.updatedCommodityClass)
												? [item.updatedCommodityClass]
												: []
										)
									: []
							)
						: [];
				})
			)
		];
		return {
			service: 'LTL',
			provider: 'Unishippers',
			carrier: offer.primaryVendor.preferredName,
			code: offer.primaryVendor.scac,
			description:
				typeof transit?.serviceLevel === 'string' && transit.serviceLevel
					? `LTL ${transit.serviceLevel.toLowerCase()}`
					: 'LTL freight',
			currency: 'USD',
			costCents: decimalHundredths(String(amount.value), 'Unishippers offer total'),
			rateBasis: 'negotiated',
			providerReference: offer.offerId,
			staging,
			freightClass,
			...(Number.isSafeInteger(transit?.transitDays) && transit!.transitDays! >= 0
				? { transitDays: transit!.transitDays }
				: {}),
			...(typeof transit?.estimatedDeliveryDate === 'string' &&
			/^\d{4}-\d{2}-\d{2}$/.test(transit.estimatedDeliveryDate)
				? { estimatedDeliveryDate: transit.estimatedDeliveryDate }
				: {}),
			...(changedClasses.length
				? {
						classificationWarning: `Requested class ${freightClass}; Unishippers returned calculated class ${changedClasses.join(', ')}. Verify classification before using live prices.`
					}
				: {})
		};
	});
}

export async function getUnishippersShippingRates(
	request: ShippingRequest
): Promise<CarrierRate[]> {
	const config = configuration();
	const payload = unishippersRatePayload(request);
	const freightClasses = payload.request.shipment.handlingUnitList.map(
		(unit) => unit.shippedItemList[0].commodityClass
	);
	const signal = AbortSignal.timeout(60_000);
	try {
		for (let attempt = 0; attempt < 2; attempt++) {
			const token = await accessToken(config);
			const response = await fetch(config.apiUrl.href.replace(/\/$/, '') + '/shopFlow', {
				method: 'POST',
				signal,
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
				body: JSON.stringify(payload)
			});
			if (response.status === 401 && attempt === 0) {
				if (cached?.token === token) cached = undefined;
				continue;
			}
			if (!response.ok)
				throw new ShippingError(
					response.status === 401 || response.status === 403
						? 'Unishippers denied access. Check the server connection and LTL account permissions.'
						: 'Unishippers could not rate this shipment. Check the shipment details and try again.',
					502
				);
			return normalizeUnishippersRates(await response.json(), config.staging, freightClasses);
		}
		throw new ShippingError('Unishippers authentication failed. Please try again.', 502);
	} catch (cause) {
		if (cause instanceof ShippingError) throw cause;
		throw new ShippingError(
			signal.aborted
				? 'Unishippers timed out. Please try again.'
				: 'Unishippers rates are temporarily unavailable. Please try again.',
			502
		);
	}
}
