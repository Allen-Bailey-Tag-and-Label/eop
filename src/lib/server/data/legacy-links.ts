import { createHash } from 'node:crypto';
import { DataSource } from './models';
import { allElements, normalizeRepeaters } from '$lib/slides/repeater';
import { validateDataSource } from '$lib/slides/validation';
import type { SlideDefinition } from '$lib/slides/types';
import type { WorkflowDefinition } from '$lib/data/types';

// Only the editable copy is converted. Published legacy definitions remain readable.
// Stable IDs and $setOnInsert make reloads/concurrent opens safe and preserve link edits.
export async function extractLegacyLinks(
	definition: SlideDefinition,
	slideId: string,
	userId?: string
): Promise<SlideDefinition> {
	const next = normalizeRepeaters(definition);
	for (const element of allElements(next)) {
		if (
			element.type !== 'list' ||
			!element.dataSource ||
			element.dataReference ||
			element.repeatItems
		)
			continue;
		const query = validateDataSource(element.dataSource, !element.repeater);
		const id = createHash('sha256')
			.update(JSON.stringify(['legacy-slide-link-v1', slideId, element.id, query]))
			.digest('hex')
			.slice(0, 24);
		const fields = [
			...new Set(['_id', ...query.select.split(/\s+/).filter(Boolean), '_label', '_detail'])
		];
		const workflow: WorkflowDefinition = {
			schemaVersion: 1,
			parameters: {},
			refreshSeconds: 0,
			staleSeconds: 0,
			nodes: [{ id: 'records', type: 'database', inputs: [], config: { query } }],
			outputs: { rows: { nodeId: 'records', fields, idField: '_id' } }
		};
		const title = `${element.text || query.model} data`.slice(0, 160);
		const options = {
			upsert: true,
			runValidators: true,
			...(userId ? { _createdById: userId } : {})
		};
		try {
			await DataSource.updateOne(
				{ _id: id },
				{
					$setOnInsert: {
						title,
						scope: 'slide',
						slideId,
						version: 1,
						draft: workflow,
						published: workflow,
						publishedTitle: title,
						publishedAt: new Date()
					}
				},
				options
			);
		} catch (cause) {
			if (!(cause && typeof cause === 'object' && 'code' in cause && cause.code === 11000))
				throw cause;
		}
		const reference = { sourceId: id, output: 'rows', parameters: {} };
		if (element.repeater) {
			element.repeatItems = { mode: 'source', source: reference };
			element.type = 'repeater';
		} else element.dataReference = reference;
		element.dataTimeZone = query.timeZone;
		element.dataEmptyMessage = query.emptyMessage;
		delete element.dataSource;
	}
	return next;
}
