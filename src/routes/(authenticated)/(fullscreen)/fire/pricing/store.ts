import { derived, writable } from 'svelte/store';
import * as format from '$lib/format';

type Product = {
	options: { [key: string]: any };
	quantity: string;
	orderType: '' | 'New' | 'Repeat w/Change' | 'Repeat';
	repeatNumber: string;
	type: '' | 'Collar' | 'Label' | 'Tag';
	uom: 'BX' | 'EA' | 'M' | 'RL';
};

const initialValue: Product[] = [];

const getQuantity = (product: Product) => {
	try {
		const quantityConversion = {
			Collar: {
				EA: (quantity: number) => quantity,
				M: (quantity: number) => quantity * 1000,
				RL: (quantity: number) => quantity * 100
			},
			Label: {
				EA: (quantity: number) => quantity,
				M: (quantity: number) => quantity * 1000,
				RL: (quantity: number) => quantity * 250
			},
			Tag: {
				BX: (quantity: number) => quantity * 1000,
				EA: (quantity: number) => quantity,
				M: (quantity: number) => quantity * 1000
			}
		};
		const totalQuantity = quantityConversion[product.type][product.uom](product.quantity);
		return format.int(totalQuantity);
	} catch (error) {
		return 0;
	}
};

export const products = writable(initialValue);

export const pricing = derived(products, ($products) => {
	const productArray = $products
		.filter((product) => {
			if (product.orderType === '') return false;
			if (
				(product.orderType === 'Repeat' || product.orderType === 'Repeat w/Change') &&
				product.repeatNumber === ''
			)
				return false;
			if (product.quantity === '') return false;
			if (product.type === 'Collar' && product.options?.color === '') return false;
			if (product.type === 'Label' && product.options?.size === '') return false;
			if (
				product.type === 'Tag' &&
				(product.options?.material === '' || product.options?.color === '')
			)
				return false;
			return true;
		})
		.map((product) => {
			let description;
			let extended = 1000;
			if (product.type === 'Collar') {
				description = `${getQuantity(product)} ${product.options?.size?.toLowerCase()} ${product.options?.color?.toLowerCase()} collars`;
			}
			if (product.type === 'Label') {
				description = `${getQuantity(product)} ${product.options?.size} labels`;
			}
			if (product.type === 'Tag') {
				description = `${getQuantity(product)} ${product.options?.color} ${product.options?.material?.toLowerCase()} tags`;
				if (product.options?.eyelet || product.options?.wire) {
					let extras: string[] = [];
					if (product.options?.eyelet) extras.push('1/4" metal zinc eyelets');
					if (product.options?.wire) extras.push('26g - 12" attached wires');
					description += ` with ${extras.join(' and ')}`;
				}
			}
			description += ` (${product.orderType === 'New' ? 'new' : `${product.orderType.toLowerCase()} of ${product.repeatNumber}`})`;
			return { description, extended };
		});
	const productTotal = productArray.reduce((total, { extended }) => (total += extended), 0);
	return { productArray, productTotal };
});
