<script lang="ts">
	import { dateTime } from '$lib/formats';
	import { mdToTokens } from '$lib/marked';
	import { Div, H1, MarkdownToken } from '..';

	type Props = { date: Date; firstName: string; lastName: string; md: string; title: string };
	let {
		date,
		firstName = $bindable(''),
		lastName = $bindable(''),
		md = $bindable(''),
		title = $bindable('')
	}: Props = $props();

	// $derives
	const tokens = $derived.by(() => mdToTokens(md));
</script>

<Div class="flex flex-col space-y-6">
	<H1 class="lg:text-6xl">{title}</H1>
	<Div class="flex space-x-2 opacity-50">
		<Div>By - {firstName} {lastName}</Div>
		<Div>{dateTime(date)}</Div>
	</Div>
	<MarkdownToken {tokens} />
</Div>
