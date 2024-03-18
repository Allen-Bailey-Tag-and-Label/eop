import { fail } from '@sveltejs/kit';
import * as CSV from 'csv-string';
import { DateTime } from 'luxon';
import pMap from 'p-map';
import { getFields, getModel } from '$lib/dbTable';
import { prisma } from '$lib/prisma';
import { convert } from '$utilities';

export const actions = {
	default: async ({ request }) => {
		try {
			const { csv } = <{ csv: string }>convert(await request.formData()).formData.to.Object();
			const [columns, ...rows] = CSV.parse(csv.trim());
			const columnMap = new Map([
				['Order Originator', 'orderOriginator'],
				['Order', 'order'],
				['Line Number', 'lineNumber'],
				['WO Number', 'woNumber'],
				['TY', 'orderType'],
				['Product', 'product'],
				['Product Description', 'productDescription'],
				['Hold Code', 'holdCode'],
				['Dealer #', 'accountNumber'],
				['Dealer Name', 'customerName'],
				['Customer PO', 'customerPO'],
				['Quantity', 'quantity'],
				['Quantity in Inventory', 'quantityInInventory'],
				['UM ', 'um'],
				['Unit Price', 'unitPrice'],
				['Ln Ty', 'lineType'],
				['Pricing UOM', 'pricingUm'],
				['Extended Price', 'extendedPrice'],
				['Order Date', 'orderDate'],
				['Proof Date', 'proofDate'],
				['Original Date', 'originalDate'],
				['Reschedule Date', 'rescheduleDate'],
				['Actual Ship', 'actualShipDate'],
				['Press Number', 'pressNumber'],
				['Status Code', 'statusCode'],
				['Status Description', 'statusDescription'],
				['Date Moved', 'dateMoved']
			]);
			const model = getModel('Order');
			const { fieldMap } = getFields(model);
			const input = rows.slice(0, -1).reduce((transactions, row) => {
				const data: { [key: string]: any } = {};
				row.forEach((string, index) => {
					const fieldName = columnMap.get(columns[index]);
					if (fieldName === undefined) return;
					const field = fieldMap.get(fieldName);
					if (field === undefined) return;
					const { name, type } = field;
					let value: any = string;
					if (type === 'DateTime')
						value = DateTime.fromFormat(string !== '' ? string : '1/1/1970', 'M/d/yyyy').toJSDate();
					if (type === 'Float') value = parseFloat(string.replace(/\$/g, ''));
					if (type === 'Int') value = +string;
					data[name] = value;
				});
				if (data.order !== undefined && data.lineNumber !== undefined) {
					data.orderAndLineNumber = `${data.order}-${data.lineNumber}`;
					transactions.push(
						prisma.order.upsert({
							where: {
								orderAndLineNumber: data.orderAndLineNumber
							},
							create: data,
							update: data
						})
					);
				}
				return transactions;
			}, []);
			const mapper = async (data) => {
				// console.log(data);
			};
			await pMap(input, mapper, { concurrency: 50 });
			return { success: true };
		} catch (error) {
			console.log(error);
			return fail(303, {});
		}
	}
};
