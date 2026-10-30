<script lang="ts">
	import { Button, Checkbox, Div, Input, P, Select } from '$lib/components';
	import type { SlideElement, SlideVisibility, VisibilityRule, RuleOperator } from './types';
	let { value = $bindable(), elements }: { value?: SlideVisibility; elements: SlideElement[] } =
		$props();
	const sources = $derived(
		elements.filter(
			(element) => element.dataReference || (element.type === 'list' && element.dataSource)
		)
	);
	const kinds = [
		{ value: 'date', label: 'Calendar date' },
		{ value: 'weekdays', label: 'Weekdays' },
		{ value: 'time', label: 'Time window' },
		{ value: 'dataCount', label: 'Data row count' },
		{ value: 'dataValue', label: 'Any data row field' }
	];
	const operators = [
		{ value: 'eq', label: 'Equals' },
		{ value: 'neq', label: 'Does not equal' },
		{ value: 'gt', label: 'Greater than' },
		{ value: 'gte', label: 'At least' },
		{ value: 'lt', label: 'Less than' },
		{ value: 'lte', label: 'At most' },
		{ value: 'contains', label: 'Contains text' }
	];
	function newRule(kind = 'date'): VisibilityRule {
		if (kind === 'weekdays') return { kind, days: [1, 2, 3, 4, 5] };
		if (kind === 'time') return { kind, start: '08:00', end: '17:00' };
		if (kind === 'dataCount')
			return { kind, elementId: sources[0]?.id ?? '', operator: 'gt', value: '0' };
		if (kind === 'dataValue')
			return { kind, elementId: sources[0]?.id ?? '', field: 'label', operator: 'eq', value: '' };
		return { kind: 'date', operator: 'on-or-before', value: new Date().toISOString().slice(0, 10) };
	}
</script>

<Div class="space-y-3">
	<Checkbox
		label="Conditional visibility"
		aria-label="Conditional visibility"
		checked={!!value}
		onchange={(event) => {
			value = event.currentTarget.checked
				? { match: 'all', timeZone: 'America/New_York', rules: [newRule()] }
				: undefined;
		}}
	/>
	{#if value}
		<P class="text-sm"
			>The server checks published rules before playback. An ineligible slide is skipped; its draft
			and playlist entry remain.</P
		>
		<Select
			label="Show slide when"
			aria-label="Visibility match"
			bind:value={value.match}
			options={[
				{ value: 'all', label: 'All rules match' },
				{ value: 'any', label: 'Any rule matches' }
			]}
		/>
		<Input
			label="Time zone"
			aria-label="Visibility time zone"
			bind:value={value.timeZone}
			placeholder="America/New_York"
		/>
		{#each value.rules as rule, index (index)}
			<Div class="space-y-2 rounded-lg border border-slate-300 p-3 dark:border-gray-700">
				<Select
					label={`Rule ${index + 1}`}
					aria-label={`Visibility rule ${index + 1} type`}
					value={rule.kind}
					options={kinds}
					onchange={(event: Event & { currentTarget: HTMLSelectElement }) => {
						if (value) value.rules[index] = newRule(event.currentTarget.value);
					}}
				/>
				{#if rule.kind === 'date'}
					<Select
						aria-label={`Rule ${index + 1} date comparison`}
						bind:value={rule.operator}
						options={[
							{ value: 'before', label: 'Before' },
							{ value: 'on-or-before', label: 'On or before (inclusive)' },
							{ value: 'after', label: 'After' },
							{ value: 'on-or-after', label: 'On or after (inclusive)' }
						]}
					/>
					<Input
						label="Date"
						aria-label={`Rule ${index + 1} date`}
						type="date"
						bind:value={rule.value}
					/>
				{:else if rule.kind === 'weekdays'}
					<Div class="flex flex-wrap gap-3"
						>{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day, dayIndex (day)}<Checkbox
								label={day}
								aria-label={`Rule ${index + 1} ${day}`}
								checked={rule.days.includes(dayIndex)}
								onchange={(event) => {
									if (rule.kind === 'weekdays')
										rule.days = event.currentTarget.checked
											? [...rule.days, dayIndex]
											: rule.days.filter((day) => day !== dayIndex);
								}}
							/>{/each}</Div
					>
				{:else if rule.kind === 'time'}
					<Div class="grid grid-cols-2 gap-3"
						><Input
							label="From (inclusive)"
							aria-label={`Rule ${index + 1} start time`}
							type="time"
							bind:value={rule.start}
						/><Input
							label="Until (exclusive)"
							aria-label={`Rule ${index + 1} end time`}
							type="time"
							bind:value={rule.end}
						/></Div
					>
					<P class="text-xs opacity-60"
						>Windows can cross midnight. Equal start/end times mean all day.</P
					>
				{:else}
					<Select
						label="Data link"
						aria-label={`Rule ${index + 1} data link`}
						bind:value={rule.elementId}
						options={[
							{ value: '', label: 'Choose a data element' },
							...sources.map((element) => ({
								value: element.id,
								label: `${element.text || element.id} (${element.dataSource?.model})`
							}))
						]}
					/>
					{#if rule.kind === 'dataValue'}<Input
							label="Field (label, detail, or row.field)"
							aria-label={`Rule ${index + 1} field`}
							bind:value={rule.field}
						/>{/if}
					<Select
						aria-label={`Rule ${index + 1} data comparison`}
						value={rule.operator}
						options={operators.filter(
							(operator) => rule.kind === 'dataValue' || operator.value !== 'contains'
						)}
						onchange={(event: Event & { currentTarget: HTMLSelectElement }) => {
							rule.operator = event.currentTarget.value as RuleOperator;
						}}
					/>
					<Input
						label="Compare with"
						aria-label={`Rule ${index + 1} comparison value`}
						bind:value={rule.value}
					/>
					<P class="text-xs opacity-60"
						>Uses the existing model query, including its filters and limit. Field rules match any
						returned row. Query errors do not match.</P
					>
				{/if}
				<Button
					variants={['small', 'error']}
					onclick={() => {
						if (!value) return;
						value.rules.splice(index, 1);
						if (!value.rules.length) value = undefined;
					}}>Remove rule {index + 1}</Button
				>
			</Div>
		{/each}
		<Button disabled={value.rules.length >= 20} onclick={() => value?.rules.push(newRule())}
			>Add visibility rule</Button
		>
	{/if}
</Div>
