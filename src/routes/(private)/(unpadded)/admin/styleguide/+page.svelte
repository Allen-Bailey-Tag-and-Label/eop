<script lang="ts">
	import { colornames } from 'color-name-list';
	import { convert } from 'colorizr';
	import nearestColor from 'nearest-color';
	import { Div, Input } from '$lib/components';

	type Shade = {
		variable: string;
		oklch: string;
	};

	const colorNamesObject = colornames.reduce(
		(o: Record<string, string>, { name, hex }: { name: string; hex: string }) =>
			Object.assign(o, { [name]: hex }),
		{}
	);
	const nearestColorNames = nearestColor.from(colorNamesObject);

	let h = $state('290');
	let flattenFactor = $state('2');
	let steepness = $state('-0.757');
	let translate = $state('.075');
	const generateShade = ({
		c,
		h,
		name,
		shade,
		shadeIndex
	}: {
		c: number;
		h: number;
		name: string;
		shade: number;
		shadeIndex: number;
	}): Shade => {
		{
			const variable = `--color-${name}-${shade}`;
			let newC = sCurve(shadeIndex, '0.688', '0');
			if (newC > 0.5) newC = 1 - newC;
			newC *= Number(flattenFactor);
			newC += 1 - 0.5 * Number(flattenFactor);
			newC *= c;
			const oklch = `(${sCurve(shadeIndex + 1)} ${newC} ${h})`;
			return { variable, oklch };
		}
	};
	const sCurve = (n: number, customSteepness?: string, customTranslate?: string) => {
		const x0 = 5; // midpoint
		return (
			1 / (1 + Math.exp(-Number(customSteepness ?? steepness) * (n - x0))) +
			Number(customTranslate ?? translate)
		);
	};

	const colors = $derived.by(() =>
		[
			{ name: 'primary', c: 0.25, h: Number(h) },
			{ name: 'secondary', c: 0.25, h: Number(h) - 60 },
			{ name: 'gray', c: 0.03125, h: Number(h) }
		].map(({ name, c, h }) => {
			const shades = [
				50,
				...Array(9)
					.fill(0)
					.map((_, index) => (index + 1) * 100),
				950
			];
			return {
				name,
				c,
				h,
				shades: shades.map((shade, shadeIndex) => generateShade({ c, h, name, shade, shadeIndex }))
			};
		})
	);

	const themes = $derived.by(() =>
		Array(18)
			.fill(0)
			.map((_, hIndex) => {
				const h = (hIndex * 20 + 10) % 360;
				const theme = [
					{ name: 'primary', c: 0.25, h: Number(h) },
					{ name: 'secondary', c: 0.25, h: (Number(h) - 60) % 360 },
					{ name: 'gray', c: 0.03125, h: Number(h) }
				].map(({ name, c, h }) => {
					const shades = [
						50,
						...Array(9)
							.fill(0)
							.map((_, index) => (index + 1) * 100),
						950
					];
					return {
						name,
						c,
						h,
						shades: shades.map((shade, shadeIndex) =>
							generateShade({ c, h, name, shade, shadeIndex })
						)
					};
				});

				const hex = convert(`oklch${theme[0].shades[5].oklch}`, 'hex');
				const label = nearestColorNames(hex)?.name ?? '';
				const name = label.toLowerCase().replace(/\s/g, '-');

				return {
					name,
					label,
					theme
				};
			})
	);
</script>

<Div class="flex flex-col items-start space-y-6 p-4">
	<Div class="flex gap-4">
		<Input bind:value={h} class="text-right" label="H (Hue)" step={10} type="number" />
		<Input
			bind:value={flattenFactor}
			class="text-right"
			label="Flatten Factor"
			step={0.025}
			type="number"
		/>
		<Input bind:value={steepness} class="text-right" label="Steepness" step={0.025} type="number" />
		<Input bind:value={translate} class="text-right" label="Translate" step={0.025} type="number" />
	</Div>
	<Div class="flex items-start gap-4">
		<Div class="flex w-full flex-col">
			<Div>@import "tailwindcss";</Div>
			<Div>@theme {'{'}</Div>
			{#each colors as { shades }}
				{#each shades as { variable, oklch }}
					<Div>{variable}: oklch{oklch};</Div>
				{/each}
			{/each}
			<Div>{'}'}</Div>
			{#each themes as { name, theme }}
				<Div>[theme="{name}"] {'{'}</Div>
				{#each theme as { shades }}
					{#each shades as { variable, oklch }}
						<Div>{variable}: oklch{oklch};</Div>
					{/each}
				{/each}
				<Div>{'}'}</Div>
			{/each}
		</Div>
		<Div class="flex flex-col">
			<Div>const themeOptions = {'['}</Div>
			{#each themes as { label, name }}
				<Div>{`{ label: "${label}", value: "${name}"},`}</Div>
			{/each}
			<Div>{']'}</Div>
		</Div>
		<Div class="flex gap-4">
			{#each [[0, 10], [10, 0]] as [bgIndex, textIndex]}
				<Div
					class="flex flex-col space-y-6 p-4"
					style="background-color:oklch{colors[2].shades[bgIndex].oklch}; color:oklch{colors[2]
						.shades[textIndex].oklch}"
				>
					{#each colors as { name, shades }}
						{@render palette({ name, shades })}
					{/each}
					{#each themes as { name, theme }}
						{@render palette({ name, shades: theme[0].shades })}
					{/each}
				</Div>
			{/each}
		</Div>
	</Div>
</Div>

{#snippet palette({ name, shades }: { name: string; shades: Shade[] })}
	<Div class="grid grid-cols-[10rem_repeat(11,_2.5rem)]">
		<Div>{name}</Div>
		{#each shades as { oklch }}
			<Div class="aspect-square h-10" style="background-color:oklch{oklch};"></Div>
		{/each}
	</Div>
{/snippet}
