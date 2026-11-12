import { randomUUID } from 'node:crypto';
import { error } from '@sveltejs/kit';
import { ShippingQuote } from '../mongoose/models/ShippingQuote';
import { collectRates, findShippingQuote } from './quotes';
import { validateShippingDestination } from './addresses';
import { getMarkupConfigs } from './markups';
import { ShippingError } from '$lib/shipping/validation';
import { selectedServices, type ProviderAttempt, type ShippingRequest } from '$lib/shipping/types';

// Each invocation owns validation or a parallel batch of rate requests. Polls only read progress.
export async function advanceShippingQuote(value: unknown) {
	if (
		!value ||
		typeof value !== 'object' ||
		!('quote' in value) ||
		typeof value.quote !== 'string' ||
		!/^(?:S-\d{6,16}|\d{1,16})$/.test(value.quote)
	)
		error(400, 'Invalid quote number.');
	const input = value as { quote: string; poll?: unknown; retry?: unknown };
	if (
		(input.poll !== undefined && typeof input.poll !== 'boolean') ||
		(input.retry !== undefined && typeof input.retry !== 'boolean')
	)
		error(400, 'Invalid progress request.');
	const number = input.quote.startsWith('S-') ? input.quote : String(Number(input.quote));
	const read = async () => {
		const quote = await findShippingQuote(number);
		if (!quote) error(404, 'Quote not found.');
		return quote;
	};
	if (input.poll) return read();
	const row = await ShippingQuote.findOne({ number }).lean();
	if (!row?.generation || row.generation.rates === 'complete') return read();
	const generation = row.generation;
	const validating = !['complete', 'skipped'].includes(generation.validation);
	if (validating && generation.validation === 'failed' && !input.retry) return read();
	const tasks = generation.tasks.map((task) =>
		input.retry && task.status === 'failed'
			? { ...task, status: 'pending' as const, message: '', attempt: undefined }
			: { ...task }
	);
	// Start both carriers together, with at most three quantity options per carrier per batch.
	const indices = selectedServices(row.request.services).flatMap((service) =>
		tasks
			.flatMap((task, index) =>
				task.service === service && ['pending', 'running'].includes(task.status) ? [index] : []
			)
			.slice(0, 3)
	);
	if (!validating && !indices.length && generation.rates !== 'running') return read();
	const stepKey = validating ? 'generation.validation' : 'generation.rates';
	const attemptId = randomUUID();
	const claimed = await ShippingQuote.findOneAndUpdate(
		{
			_id: row._id,
			[stepKey]: validating ? generation.validation : generation.rates,
			...(!validating
				? Object.fromEntries(
						indices.map((index) => [
							`generation.tasks.${index}.status`,
							generation.tasks[index].status
						])
					)
				: {}),
			$or: [
				{ 'generation.leaseUntil': { $exists: false } },
				{ 'generation.leaseUntil': { $lte: new Date() } }
			]
		},
		{
			$set: {
				...(validating ? { [stepKey]: 'running' } : {}),
				'generation.attemptId': attemptId,
				'generation.leaseUntil': new Date(Date.now() + 120_000),
				'generation.message': '',
				...(!validating
					? {
							'generation.rates': 'running',
							'generation.tasks': tasks.map((task, index) =>
								indices.includes(index) ? { ...task, status: 'running' } : task
							)
						}
					: {})
			}
		},
		{ new: true }
	).lean();
	if (!claimed) return read();
	let changes: Record<string, unknown>;
	let failedProgressWrite = false;
	try {
		// Pricing is loaded after navigation and persisted once before any carrier calls.
		const pricing = row.pricing?.length ? row.pricing : await getMarkupConfigs();
		if (!row.pricing?.length) {
			const saved = await ShippingQuote.updateOne(
				{ _id: row._id, 'generation.attemptId': attemptId },
				{ $set: { pricing } }
			);
			if (!saved.matchedCount) return read();
		}
		if (validating) {
			changes = {
				request: await validateShippingDestination(row.request),
				'generation.validation': 'complete',
				'generation.message': ''
			};
		} else {
			let rates = [...row.rates];
			let request = { ...row.request };
			for (const index of indices) tasks[index] = { ...tasks[index], status: 'running' };
			const snapshot = (running: boolean): Record<string, unknown> => {
				const attempts: ProviderAttempt[] = selectedServices(row.request.services).flatMap(
					(service) => {
						const group = tasks.filter((task) => task.service === service);
						if (group.some((task) => ['pending', 'running'].includes(task.status))) return [];
						return [
							{
								service,
								status: group.some((task) => task.attempt?.status === 'success')
									? 'success'
									: group.every((task) => task.attempt?.status === 'not-configured')
										? 'not-configured'
										: 'error',
								message: group
									.map((task) => task.message)
									.filter(Boolean)
									.join(' ')
							}
						];
					}
				);
				return {
					rates,
					attempts,
					request,
					'generation.tasks': [...tasks],
					'generation.message': '',
					'generation.rates': running
						? 'running'
						: tasks.some((task) => ['pending', 'running'].includes(task.status))
							? 'pending'
							: tasks.some((task) => task.status === 'failed')
								? 'failed'
								: 'complete'
				};
			};
			let writes = Promise.resolve();
			const results = await Promise.allSettled(
				indices.map(async (index) => {
					const task = tasks[index];
					try {
						const scoped: ShippingRequest = {
							...row.request,
							services: task.service,
							...(task.scenarioId
								? task.service === 'UPS'
									? {
											upsScenarios: row.request
												.upsScenarios!.filter((scenario) => scenario.id === task.scenarioId)
												.map((scenario) => ({ ...scenario, label: scenario.label || task.label }))
										}
									: {
											ltlScenarios: row.request
												.ltlScenarios!.filter((scenario) => scenario.id === task.scenarioId)
												.map((scenario) => ({ ...scenario, label: scenario.label || task.label }))
										}
								: {})
						};
						const result = await collectRates(scoped, pricing);
						const attempt = result.attempts[0];
						tasks[index] = {
							...task,
							status: attempt.status === 'success' ? 'complete' : 'failed',
							message: attempt.message,
							attempt
						};
						rates = [
							...rates.filter(
								(rate) => rate.service !== task.service || rate.scenarioId !== task.scenarioId
							),
							...result.rates
						];
						request = {
							...request,
							...(result.upsScenarios.length
								? {
										upsScenarios: request.upsScenarios!.map(
											(scenario) =>
												result.upsScenarios.find((updated) => updated.id === scenario.id) ??
												scenario
										)
									}
								: {}),
							...(result.ltlScenarios.length
								? {
										ltlScenarios: request.ltlScenarios!.map(
											(scenario) =>
												result.ltlScenarios.find((updated) => updated.id === scenario.id) ??
												scenario
										)
									}
								: {})
						};
					} catch (cause) {
						const message =
							cause instanceof ShippingError
								? cause.message
								: 'Rates could not be loaded. Retry to continue this quote.';
						tasks[index] = {
							...task,
							status: 'failed',
							message,
							attempt: { service: task.service, status: 'error', message }
						};
					}
					// Capture each completion and serialize writes so a slower snapshot cannot erase a newer one.
					const progress = snapshot(true);
					writes = writes.then(async () => {
						await ShippingQuote.updateOne(
							{ _id: row._id, 'generation.attemptId': attemptId },
							{ $set: progress }
						);
					});
					await writes;
				})
			);
			const failedWrite = results.find((result) => result.status === 'rejected');
			if (failedWrite?.status === 'rejected') {
				failedProgressWrite = true;
				throw failedWrite.reason;
			}
			changes = snapshot(false);
		}
	} catch (cause) {
		// Keep the durable running tasks recoverable if a progress write failed.
		if (failedProgressWrite) throw cause;
		const message =
			cause instanceof ShippingError
				? cause.message
				: 'Rates could not be loaded. Retry to continue this quote.';
		if (!validating)
			for (const index of indices)
				if (tasks[index].status === 'running')
					tasks[index] = { ...tasks[index], status: 'failed', message };
		changes = {
			[stepKey]: 'failed',
			'generation.message': message,
			...(!validating ? { 'generation.tasks': tasks } : {})
		};
	}
	// An expired request cannot overwrite the results of a newer owner.
	await ShippingQuote.updateOne(
		{ _id: row._id, 'generation.attemptId': attemptId },
		{
			$set: changes,
			$unset: { 'generation.attemptId': 1, 'generation.leaseUntil': 1 }
		}
	);
	return read();
}
