<script lang="ts">
	import { Card, Checkbox, Div, H2, Input, P, Slider } from '$lib/components';

	let autoplayTimestamps = $state({
		current: 0,
		duration: 0,
		start: 0
	});
	let isAutoplayable = $state(true);
	let isAutoplayPausable = $state(true);
	let isLoopable = $state(true);
	let isIndicatorsVisible = $state(true);
	let numberOfSlidesInViewport = $state('1');
	let numberOfSlidesToMove = $state('1');
	let users = $state([
		{
			email: 'elma.dix@example.com',
			first: 'Elma',
			last: 'Dix',
			src: 'https://randomuser.me/api/portraits/women/88.jpg'
		},
		{
			email: 'nelly.patiño@example.com',
			first: 'Nelly',
			last: 'Patiño',
			src: 'https://randomuser.me/api/portraits/men/13.jpg'
		},
		{
			email: 'thomas.mcguinness@example.com',
			first: 'Thomas',
			last: 'Mcguinness',
			src: 'https://randomuser.me/api/portraits/women/22.jpg'
		},
		{
			email: 'elma.dix@example.com',
			first: 'Elma',
			last: 'Dix',
			src: 'https://randomuser.me/api/portraits/women/88.jpg'
		},
		{
			email: 'nelly.patiño@example.com',
			first: 'Nelly',
			last: 'Patiño',
			src: 'https://randomuser.me/api/portraits/men/13.jpg'
		},
		{
			email: 'thomas.mcguinness@example.com',
			first: 'Thomas',
			last: 'Mcguinness',
			src: 'https://randomuser.me/api/portraits/women/22.jpg'
		},
		{
			email: 'elma.dix@example.com',
			first: 'Elma',
			last: 'Dix',
			src: 'https://randomuser.me/api/portraits/women/88.jpg'
		},
		{
			email: 'nelly.patiño@example.com',
			first: 'Nelly',
			last: 'Patiño',
			src: 'https://randomuser.me/api/portraits/men/13.jpg'
		},
		{
			email: 'thomas.mcguinness@example.com',
			first: 'Thomas',
			last: 'Mcguinness',
			src: 'https://randomuser.me/api/portraits/women/22.jpg'
		}
	]);
</script>

<Div class="flex flex-col space-y-6 p-4">
	<Div class="flex justify-start space-x-2">
		<Checkbox bind:checked={isAutoplayable} label="isAutoplayable" />
		<Checkbox bind:checked={isAutoplayPausable} label="isAutoplayPausable" />
		<Checkbox bind:checked={isLoopable} label="isLoopable" />
		<Checkbox bind:checked={isIndicatorsVisible} label="isIndicatorsVisible" />
		<Input
			bind:value={numberOfSlidesInViewport}
			class="text-right"
			label="Number of Slides in Viewport"
			type="number"
		/>
		<Input
			bind:value={numberOfSlidesToMove}
			class="text-right"
			label="Number of Slides To Move"
			type="number"
		/>
	</Div>
	<Slider
		bind:autoplayTimestamps
		bind:isAutoplayable
		bind:isAutoplayPausable
		bind:isLoopable
		bind:isIndicatorsVisible
		numberOfSlidesInViewport={+numberOfSlidesInViewport}
		numberOfSlidesToMove={+numberOfSlidesToMove}
		slidesClasses="gap-x-4"
	>
		{#each users as { email, first, last, src }}
			<Card class="items-center space-y-6">
				<img alt="{first} {last}" class="w-[10rem] rounded-full" {src} />
				<Div class="flex flex-col items-center space-y-0">
					<H2>{first} {last}</H2>
					<P>{email}</P>
				</Div>
			</Card>
		{/each}
	</Slider>
	<pre>{JSON.stringify(autoplayTimestamps, null, 2)}</pre>
</Div>
