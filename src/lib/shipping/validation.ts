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
function address(value: unknown, label: string): ShippingAddress {
	const row = record(value);
	const state = text(row.state, `${label} state`, 2, true).toUpperCase();
	const zip = text(row.zip, `${label} ZIP`, 10, true);
	if (!/^[A-Z]{2}$/.test(state) || !/^\d{5}(-\d{4})?$/.test(zip))
		throw new ShippingError(`Enter a two-letter state and US ZIP for ${label}.`);
	return {
		address: text(row.address, `${label} address`, 160, true),
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
		const item: PackageGroup = {
			id: text(row.id, 'item ID', 64, true),
			quantity: positive(row.quantity, `${label} quantity`, freight ? 100 : 200, true),
			weight: positive(row.weight, `${label} weight`, freight ? 20000 : 150),
			length: positive(row.length, `${label} length`, freight ? 1200 : 108),
			width: positive(row.width, `${label} width`, freight ? 120 : 108),
			height: positive(row.height, `${label} height`, freight ? 144 : 108)
		};
		if (!freight) {
			const dimensions = [item.length, item.width, item.height].sort((a, b) => b - a);
			if (dimensions[0] + 2 * (dimensions[1] + dimensions[2]) > 165)
				throw new ShippingError(`${label} exceeds UPS length plus girth limits.`);
			return item;
		}
		if (!FREIGHT_CLASSES.includes(String(row.freightClass)))
			throw new ShippingError(`Select a freight class for ${label}.`);
		return {
			...item,
			description: text(row.description, `${label} description`, 200, true),
			freightClass: String(row.freightClass),
			nmfc: text(row.nmfc, 'NMFC code', 40),
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
		services: row.services,
		branchId,
		customer: text(row.customer, 'customer', 160),
		reference: text(row.reference, 'reference', 100),
		shipDate,
		shipFrom: address(row.shipFrom, 'origin'),
		shipTo: address(row.shipTo, 'destination'),
		packages: services.includes('UPS') ? items(row.packages, false) : [],
		freight: services.includes('LTL') ? (items(row.freight, true) as FreightItem[]) : [],
		accessorials
	};
}

export function shipmentFromForm(fields: FormData) {
	const value = (key: string) => fields.get(key) ?? '';
	const addressFields = (key: string) => ({
		address: value(`${key}.address`),
		city: value(`${key}.city`),
		state: value(`${key}.state`),
		zip: value(`${key}.zip`),
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
		services: value('services'),
		branchId: value('branchId'),
		customer: value('customer'),
		reference: value('reference'),
		shipDate: value('shipDate'),
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
