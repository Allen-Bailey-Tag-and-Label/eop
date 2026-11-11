import {
	FREIGHT_CLASSES,
	selectedServices,
	type ShippingRequest,
	type ShippingAddress,
	type PackageGroup,
	type FreightItem
} from './types';

export class ShippingError extends Error {
	constructor(
		message: string,
		public status = 400
	) {
		super(message);
	}
}
export function record(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new ShippingError('Invalid shipment information.');
	return value as Record<string, unknown>;
}
export function text(value: unknown, label: string, max = 160, required = false) {
	if (typeof value !== 'string' || value.length > max || (required && !value.trim()))
		throw new ShippingError(`Enter a valid ${label}.`);
	return value.trim();
}
function flag(value: unknown): boolean {
	if (typeof value !== 'boolean') throw new ShippingError('Invalid shipment option.');
	return value;
}
function address(value: unknown, label: string, required = true): ShippingAddress {
	const row = record(value);
	const state = text(row.state, `${label} state`, 2, true).toUpperCase();
	const zip = text(row.zip, `${label} ZIP`, 10, true);
	if (!/^[A-Z]{2}$/.test(state) || !/^\d{5}(-\d{4})?$/.test(zip))
		throw new ShippingError(`Enter a two-letter state and US ZIP for ${label}.`);
	return {
		address: text(row.address, `${label} address`, 160, required),
		city: text(row.city, `${label} city`, 80, true),
		state,
		zip,
		residential: flag(row.residential)
	};
}
function positive(value: unknown, label: string, max: number, integer = false): number {
	if (
		typeof value !== 'number' ||
		!Number.isFinite(value) ||
		value <= 0 ||
		value > max ||
		(integer && !Number.isInteger(value))
	)
		throw new ShippingError(`Enter a valid ${label} (maximum ${max}).`);
	return value;
}
function items(value: unknown, freight: boolean): (PackageGroup | FreightItem)[] {
	if (!Array.isArray(value) || !value.length || value.length > 50)
		throw new ShippingError(`Enter 1–50 ${freight ? 'freight items' : 'package groups'}.`);
	const result = value.map((entry, index) => {
		const row = record(entry),
			label = `${freight ? 'freight item' : 'package group'} ${index + 1}`;
		const dimensions =
			freight || ['length', 'width', 'height'].some((key) => row[key] !== undefined)
				? {
						length: positive(row.length, `${label} length`, freight ? 1200 : 108),
						width: positive(row.width, `${label} width`, freight ? 120 : 108),
						height: positive(row.height, `${label} height`, freight ? 144 : 108)
					}
				: undefined;
		const item: PackageGroup = {
			id: text(row.id, 'item ID', 64, true),
			quantity: positive(row.quantity, `${label} quantity`, freight ? 100 : 200, true),
			weight: positive(row.weight, `${label} weight`, freight ? 20000 : 150),
			...dimensions
		};
		if (!freight) {
			const sides = dimensions
				? [dimensions.length, dimensions.width, dimensions.height].sort((a, b) => b - a)
				: null;
			if (sides && sides[0] + 2 * (sides[1] + sides[2]) > 165)
				throw new ShippingError(`${label} exceeds UPS length plus girth limits.`);
			return item;
		}
		if (row.freightClass && !FREIGHT_CLASSES.includes(String(row.freightClass)))
			throw new ShippingError(`Select a freight class for ${label}.`);
		return {
			...item,
			description: text(row.description ?? '', `${label} description`, 200),
			freightClass: text(row.freightClass ?? '', 'freight class', 10),
			nmfc: text(row.nmfc, 'NMFC code', 40, true),
			stackable: flag(row.stackable)
		};
	});
	if (new Set(result.map((item) => item.id)).size !== result.length)
		throw new ShippingError('Each shipment item must have a unique ID.');
	if (!freight && result.reduce((total, item) => total + item.quantity, 0) > 200)
		throw new ShippingError('A UPS quote supports at most 200 packages.');
	return result;
}
export function parseShipment(value: unknown): ShippingRequest {
	const row = record(value);
	if (row.validateAddresses !== undefined && typeof row.validateAddresses !== 'boolean')
		throw new ShippingError('Select whether to validate the address.');
	if (row.services !== 'UPS' && row.services !== 'LTL' && row.services !== 'Both')
		throw new ShippingError('Select UPS, LTL, or Both.');
	const branchId = text(row.branchId, 'branch', 24, true);
	if (!/^[a-f\d]{24}$/i.test(branchId)) throw new ShippingError('Select a branch.');
	const shipDate = text(row.shipDate, 'ship date', 10, true);
	if (
		!/^\d{4}-\d{2}-\d{2}$/.test(shipDate) ||
		!Number.isFinite(Date.parse(shipDate)) ||
		new Date(shipDate).toISOString().slice(0, 10) !== shipDate
	)
		throw new ShippingError('Enter a valid ship date.');
	const services = selectedServices(row.services);
	const extras = services.includes('LTL') ? record(row.accessorials) : {};
	const accessorials = Object.fromEntries(
		[
			'pickupLiftgate',
			'deliveryLiftgate',
			'insidePickup',
			'insideDelivery',
			'limitedAccessPickup',
			'limitedAccessDelivery'
		].map((key) => [key, services.includes('LTL') ? flag(extras[key]) : false])
	) as ShippingRequest['accessorials'];
	return {
		...(row.validateAddresses !== undefined
			? { validateAddresses: row.validateAddresses as boolean }
			: {}),
		services: row.services,
		branchId,
		customer: text(row.customer, 'customer', 160),
		reference: text(row.reference, 'reference', 100),
		shipDate,
		shipFrom: address(row.shipFrom, 'origin', row.validateAddresses !== false),
		shipTo: address(row.shipTo, 'destination', row.validateAddresses !== false),
		packages: services.includes('UPS') ? items(row.packages, false) : [],
		freight: services.includes('LTL') ? (items(row.freight, true) as FreightItem[]) : [],
		accessorials
	};
}

export function shipmentFromForm(fields: FormData) {
	const value = (key: string) => fields.get(key) ?? '';
	if (fields.has('isValidated') && !['true', 'false'].includes(String(value('isValidated'))))
		throw new ShippingError('Select whether to validate the address.');
	const addressValue = (key: string, field: string, suffix: string) =>
		fields.get(`${key}.${field}`) ?? value(`${key}${suffix}`);
	const addressFields = (key: string) => ({
		address: addressValue(key, 'address', 'Address'),
		city: addressValue(key, 'city', 'City'),
		state: addressValue(key, 'state', 'State'),
		zip: /^\d{1,5}$/.test(String(addressValue(key, 'zip', 'ZIP')))
			? String(addressValue(key, 'zip', 'ZIP')).padStart(5, '0')
			: addressValue(key, 'zip', 'ZIP'),
		residential: value(`${key}.residential`) === 'on'
	});
	const groups = (prefix: string) =>
		fields.getAll(`${prefix}Id`).map((id) => ({
			id,
			...Object.fromEntries(
				['quantity', 'weight', 'length', 'width', 'height'].map((key) => [
					key,
					Number(value(`${prefix}.${id}.${key}`))
				])
			),
			...(prefix === 'freight'
				? {
						description: value(`${prefix}.${id}.description`),
						freightClass: value(`${prefix}.${id}.freightClass`),
						nmfc: value(`${prefix}.${id}.nmfc`),
						stackable: value(`${prefix}.${id}.stackable`) === 'on'
					}
				: {})
		}));
	return {
		...(fields.has('isValidated') ? { validateAddresses: value('isValidated') === 'true' } : {}),
		services: value('services'),
		branchId: fields.get('branchId') ?? value('_branchId'),
		customer: value('customer'),
		reference: value('reference'),
		shipDate:
			fields.get('shipDate') ??
			new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date()),
		shipFrom: addressFields('shipFrom'),
		shipTo: addressFields('shipTo'),
		packages: groups('package'),
		freight: groups('freight'),
		accessorials: Object.fromEntries(
			[
				'pickupLiftgate',
				'deliveryLiftgate',
				'insidePickup',
				'insideDelivery',
				'limitedAccessPickup',
				'limitedAccessDelivery'
			].map((key) => [key, value(key) === 'on'])
		)
	};
}
