<script lang="ts">
	import { Div, Input } from '$lib/components';

	let flattenFactor = $state('2');
	let steepness = $state('-0.675');
	let translate = $state('.025');
	const sCurve = (n: number, customSteepness?: string, customTranslate?: string) => {
		const x0 = 5; // midpoint
		return (
			1 / (1 + Math.exp(-Number(customSteepness ?? steepness) * (n - x0))) +
			Number(customTranslate ?? translate)
		);
	};
	const colors = $derived.by(() =>
		[
			{ name: 'primary', c: 0.25, h: 293.796 },
			{ name: 'secondary', c: 0.25, h: 236.62 },
			{ name: 'gray', c: 0.16, h: 293.796 }
		].map(({ name, c, h }) => {
			const shades = [
				50,
				...Array(9)
					.fill(0)
					.map((_, index) => (index + 1) * 100),
				950
			];
			return shades.map((shade, shadeIndex) => {
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
			});
		})
	);
</script>

<Div class="flex flex-col items-start space-y-6 p-4">
	<Div class="flex gap-4">
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
		<Div class="flex flex-col">
			{#each colors as color}
				{#each color as { variable, oklch }}
					<Div>{variable}: oklch{oklch};</Div>
				{/each}
				<Div>&nbsp;</Div>
			{/each}
		</Div>
		<Div class="flex flex-col gap-4">
			{#each [[0, 10], [10, 0]] as [bgIndex, textIndex]}
				<Div
					class="flex flex-col space-y-6 p-4"
					style="background-color:oklch{colors[2][bgIndex].oklch}; color:oklch{colors[2][textIndex]
						.oklch}"
				>
					{#each colors as color}
						<Div class="grid grid-cols-11">
							{#each color as { oklch }}
								<Div class="aspect-square h-10" style="background-color:oklch{oklch};"></Div>
							{/each}
						</Div>
					{/each}
				</Div>
			{/each}
		</Div>
	</Div>
</Div>
