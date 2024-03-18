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
				['Oper Seq#', 'sequence'],
				['Business Unit', 'workCenter'],
				['Description ', 'description'],
				['Op St', 'operationStatus'],
				['Request Date', 'dateRequested'],
				['Quantity Ordered', 'quantity'],
				['Standard Labor', 'standardHours'],
				['Actual Labor', 'actualHours'],
				['Remaining Labor', 'remainingHours'],
				['Order Date', 'dateEntered'],
				['WO Number', 'workOrder'],
				['Sales Order Number', 'salesOrder'],
				['Product Type/Item Number', 'itemNumber'],
				['Work Order Status', 'workOrderStatus'],
				['Product Description', 'productDescription'],
				['Account Number', 'accountNumber'],
				['Customer Name', 'customerName'],
				['Date Moved', 'dateMoved'],
				['Current Loc', 'currentLocation']
			]);
			const model = getModel('WorkOrderRouting');
			const { fieldMap } = getFields(model);
			const input = rows.reduce((transactions, row) => {
				const data: { [key: string]: any } = {};
				row.forEach((string, index) => {
					const fieldName = columnMap.get(columns[index]);
					if (fieldName === undefined) return;
					const field = fieldMap.get(fieldName);
					if (field === undefined) return;
					const { name, type } = field;
					let value: any = string;
					if (type === 'DateTime') value = DateTime.fromFormat(string, 'M/d/yyyy').toJSDate();
					if (type === 'Float') value = parseFloat(string);
					if (type === 'Int') value = +string;
					data[name] = value;
				});
				if (data.sequence !== undefined && data.workOrder !== undefined) {
					data.workOrderAndSequence = `${data.workOrder}-${data.sequence}`;
					transactions.push(
						prisma.workOrderRouting.upsert({
							where: {
								workOrderAndSequence: data.workOrderAndSequence
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
