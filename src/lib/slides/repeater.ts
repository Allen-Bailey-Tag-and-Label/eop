import {
	blankSlide,
	newElement,
	type DataRow,
	type DataBinding,
	type RepeaterDefinition,
	type SlideDefinition,
	type SlideElement
} from './types';

export function defaultRepeater(): RepeaterDefinition {
	const background = newElement('rectangle', 'background');
	Object.assign(background, {
		x: 0,
		y: 0,
		width: 600,
		height: 180,
		horizontalAnchor: 'stretch',
		verticalAnchor: 'stretch',
		borderRadius: 12,
		color: { light: '#f3f4f6', dark: '#1f2937' }
	});
	const label = newElement('text', 'label');
	Object.assign(label, {
		x: 20,
		y: 20,
		width: 560,
		height: 70,
		fontSize: 40,
		fontWeight: 700,
		horizontalAnchor: 'stretch',
		verticalAnchor: 'top',
		text: 'Label',
		binding: { field: 'label', format: 'text', fallback: '' }
	});
	const detail = newElement('text', 'detail');
	Object.assign(detail, {
		x: 20,
		y: 100,
		width: 560,
		height: 60,
		fontSize: 28,
		horizontalAnchor: 'stretch',
		verticalAnchor: 'bottom',
		text: 'Detail',
		binding: { field: 'detail', format: 'text', fallback: '' }
	});
	return {
		columns: 2,
		minItemWidth: 360,
		itemHeight: 180,
		columnGap: 20,
		rowGap: 20,
		align: 'start',
		overflow: 'paginate',
		pageDurationMs: 5000,
		template: { width: 600, height: 180, elements: [background, label, detail] }
	};
}

export function templateSlide(repeater: RepeaterDefinition, durationMs: number): SlideDefinition {
	return {
		...blankSlide(),
		...repeater.template,
		background: 'transparent',
		durationMs,
		transitionIn: { type: 'none', durationMs: 0 },
		transitionOut: { type: 'none', durationMs: 0 }
	};
}

// Use the full row index when scrolling so virtualization cannot restart animations.
// Each page's items animate on their first appearance and hold their final pose on later cycles.
export function repeaterItemTime(
	settings: RepeaterDefinition,
	timeMs: number,
	index: number,
	start: number,
	page = 0
) {
	const stagger = settings.staggerMs ?? 0;
	if (!stagger) return Math.max(0, timeMs);
	const clock = settings.overflow === 'paginate' ? timeMs - page * settings.pageDurationMs : timeMs;
	return clock - (settings.overflow === 'scroll' ? start + index : index) * stagger;
}

export function boundText(
	binding: DataBinding,
	row: DataRow | undefined,
	index: number,
	timeZone: string
): string {
	if (!row) return binding.fallback;
	const value =
		binding.field === '$index'
			? index + 1
			: binding.field === 'label'
				? row.label
				: binding.field === 'detail'
					? row.detail
					: row.fields && Object.hasOwn(row.fields, binding.field.replace(/^row\./, ''))
						? row.fields[binding.field.replace(/^row\./, '')]
						: undefined;
	if (value == null || value === '') return binding.fallback;
	if (binding.format === 'date') {
		const date = new Date(String(value));
		try {
			return Number.isFinite(date.getTime())
				? new Intl.DateTimeFormat('en-US', { timeZone, dateStyle: 'medium' }).format(date)
				: binding.fallback;
		} catch {
			return binding.fallback;
		}
	}
	if (binding.format === 'number')
		return typeof value === 'number' && Number.isFinite(value)
			? new Intl.NumberFormat('en-US').format(value)
			: binding.fallback;
	return String(value);
}

export function gridLayout(
	settings: RepeaterDefinition,
	width: number,
	height: number,
	count: number,
	timeMs: number,
	unit = 1
) {
	unit = Math.max(0.001, unit);
	const gapX = settings.columnGap * unit;
	const gapY = settings.rowGap * unit;
	const columns =
		settings.columns ||
		Math.max(1, Math.floor((width + gapX) / (settings.minItemWidth * unit + gapX)));
	const itemWidth = Math.max(1, (width - gapX * (columns - 1)) / columns);
	const itemHeight =
		settings.itemHeight > 0
			? settings.itemHeight * unit
			: (itemWidth * settings.template.height) / settings.template.width;
	const rows = Math.max(1, Math.floor((height + gapY) / (itemHeight + gapY)));
	const capacity = rows * columns;
	const pages = Math.max(1, Math.ceil(count / capacity));
	const page =
		settings.overflow === 'paginate'
			? Math.floor(Math.max(0, timeMs) / settings.pageDurationMs) % pages
			: 0;
	let start = page * capacity;
	let visibleCount =
		settings.overflow === 'scroll' ? count : Math.min(capacity, Math.max(0, count - start));
	const totalRows = Math.ceil(visibleCount / columns);
	const contentHeight = totalRows * itemHeight + Math.max(0, totalRows - 1) * gapY;
	const phase = (Math.max(0, timeMs) / settings.pageDurationMs) % 2;
	const scroll =
		settings.overflow === 'scroll'
			? Math.max(0, contentHeight - height) * (phase <= 1 ? phase : 2 - phase)
			: 0;
	let offsetY =
		Math.max(0, height - contentHeight) *
			(settings.align === 'center' ? 0.5 : settings.align === 'end' ? 1 : 0) -
		scroll;
	if (settings.overflow === 'scroll') {
		const firstRow = Math.floor(scroll / (itemHeight + gapY));
		start = firstRow * columns;
		visibleCount = Math.min(Math.max(0, count - start), (rows + 2) * columns);
		offsetY += firstRow * (itemHeight + gapY);
	}
	return {
		columns,
		gapX,
		gapY,
		itemWidth,
		itemHeight,
		capacity,
		pages,
		page,
		start,
		visibleCount,
		offsetY
	};
}

export function allElements(definition: Pick<SlideDefinition, 'elements'>): SlideElement[] {
	return definition.elements.flatMap((element) => [
		element,
		...allElements({ elements: element.frame?.elements ?? [] }),
		...allElements({ elements: element.repeater?.template.elements ?? [] })
	]);
}
