import { downloadBlob } from '$lib/downloadBlob';

export const exportFunctions: Map<
	string,
	({ data, headers }: { data: any[][]; headers: string[] }) => Promise<void>
> = new Map([
	[
		'clipboard',
		async ({ data, headers }) => {
			const tsv = [headers.join('\t'), ...data.map((r) => r.join('\t'))].join('\n');
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(tsv);
				return;
			}
			// fallback
			const ta = document.createElement('textarea');
			ta.value = tsv;
			ta.style.position = 'fixed';
			ta.style.opacity = '0';
			document.body.appendChild(ta);
			ta.select();
			document.execCommand('copy');
			document.body.removeChild(ta);
		}
	],
	[
		'csv',
		async ({ data, headers }) => {
			const escape = (val: any) => {
				const string = String(val ?? '');
				if (/[",\n]/.test(string)) return `"${string.replace(/"/g, '""')}"`;
				return string;
			};
			const lines = [
				headers.map(escape).join(','),
				...data.map((row) => row.map(escape).join(','))
			];
			const csv = '\uFEFF' + lines.join('\n');

			const blob = new Blob([csv], { type: 'mime' });
			downloadBlob({ blob, filename: `datatable${new Date().getTime()}.csv` });
		}
	],
	[
		'xlsx',
		async ({ data, headers }) => {
			const XLSX = await import('xlsx');
			const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, 'Data');
			const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
			const blob = new Blob([wbout], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			});
			downloadBlob({ blob, filename: `datatable${new Date().getTime()}.xlsx` });
		}
	]
]);
