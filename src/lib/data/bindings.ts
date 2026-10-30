import { safeField } from '$lib/slides/data-link';
import type { DataBinding, DataRow, SlideData, SlideElement } from '$lib/slides/types';
import { boundText } from '$lib/slides/repeater';
import { dataRecord, readField, record } from './workflows';
import { DataWorkflowError, type SourceReference } from './types';

export const bindableProperties = [
	'text',
	'assetId',
	'color',
	'backgroundColor',
	'imageOpacity',
	'visible'
] as const;
export type BoundProperty = (typeof bindableProperties)[number];
export function validateReference(input: unknown): SourceReference {
	const value = record(input);
	if (
		typeof value.sourceId !== 'string' ||
		!/^[a-f0-9]{24}$/i.test(value.sourceId) ||
		typeof value.output !== 'string' ||
		!safeField(value.output)
	)
		throw new DataWorkflowError('Choose a published source and named output.');
	return {
		sourceId: value.sourceId.toLowerCase(),
		output: value.output,
		parameters: dataRecord(value.parameters ?? {})
	};
}
export function validateBindings(input: unknown): Partial<Record<BoundProperty, DataBinding>> {
	return Object.fromEntries(
		Object.entries(record(input)).map(([property, raw]) => {
			const binding = record(raw);
			const field = typeof binding.field === 'string' ? binding.field.replace(/^row\./, '') : '';
			if (
				!bindableProperties.includes(property as BoundProperty) ||
				(!safeField(field) && field !== '$index') ||
				!['text', 'date', 'number'].includes(String(binding.format)) ||
				typeof binding.fallback !== 'string' ||
				binding.fallback.length > 500
			)
				throw new DataWorkflowError('Invalid element property binding.');
			return [
				property,
				{ field: binding.field, format: binding.format, fallback: binding.fallback }
			];
		})
	);
}
export function boundElement(
	element: SlideElement,
	row: DataRow | undefined,
	index: number,
	timeZone: string,
	data: SlideData
): SlideElement & { visible: boolean } {
	const active =
		element.dataReference || element.repeatItems?.mode === 'source'
			? data[element.id]?.items[0]
			: row;
	const result = { ...element, visible: true };
	for (const [name, binding] of Object.entries(element.bindings ?? {})) {
		if (!binding) continue;
		const raw = active?.fields
			? readField(active.fields, binding.field.replace(/^row\./, ''))
			: undefined;
		const value = boundText(binding, active, index, timeZone);
		if (name === 'visible')
			result.visible =
				raw !== false && raw !== 0 && raw !== null && raw !== undefined && raw !== '';
		if (name === 'imageOpacity' && typeof raw === 'number')
			result.imageOpacity = Math.max(0, Math.min(1, raw));
		if (name === 'text') {
			result.text = value;
			result.binding = undefined;
		}
		if (name === 'assetId' && /^[a-f0-9]{24}$/i.test(value)) result.assetId = value.toLowerCase();
		if (
			(name === 'color' || name === 'backgroundColor') &&
			/^(?:transparent|#[a-f0-9]{6}(?:[a-f0-9]{2})?)$/i.test(value)
		)
			result[name] = value;
	}
	return result;
}
