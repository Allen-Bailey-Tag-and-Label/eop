<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { attachmentFactory } from '$lib/attachments';
	import { theme } from '$lib/theme';
	import { Button, Div } from '..';

	type NavigationSnippet = Snippet<[{ goTo: (slideIndex: number) => void }]>;
	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'style'> & {
		attachments?: Attachment[];
		autoplay?: Snippet;
		autoplayDuration?: number;
		autoplayPercent?: number;
		autoplayTimestamps?: {
			current: number;
			duration: number;
			start: number;
		};
		children?: Snippet;
		class?: string;
		currentSlideIndex?: number;
		element?: HTMLDivElement | null;
		indicators?: NavigationSnippet;
		isAutoplayable?: boolean;
		isAutoplayPausable?: boolean;
		isHovering?: boolean;
		isIndicatorsVisible?: boolean;
		isLoopable?: boolean;
		nextButton?: NavigationSnippet;
		numberOfIndicators?: number;
		numberOfSlidesInViewport?: number;
		numberOfSlidesToMove?: number;
		previousButton?: NavigationSnippet;
		slideElements?: HTMLCollection;
		slidesClasses?: string;
		slidesElement?: HTMLDivElement | null;
		slidesStyle?: string;
		style?: string;
		variants?: string[];
		viewportElement?: HTMLDivElement | null;
	};
	let {
		attachments = $bindable([]),
		autoplay,
		autoplayDuration = $bindable(5000),
		autoplayPercent = $bindable(0),
		autoplayTimestamps = $bindable({
			current: 0,
			duration: 0,
			start: 0
		}),
		children,
		class: className,
		currentSlideIndex = $bindable(0),
		element = $bindable(null),
		indicators,
		isAutoplayable = $bindable(true),
		isAutoplayPausable = $bindable(true),
		isHovering = $bindable(false),
		isIndicatorsVisible = $bindable(true),
		isLoopable = $bindable(true),
		nextButton,
		numberOfIndicators = $bindable(0),
		numberOfSlidesInViewport = $bindable(1),
		numberOfSlidesToMove = $bindable(1),
		previousButton,
		slideElements = $bindable(),
		slidesClasses,
		slidesElement = $bindable(null),
		slidesStyle = $bindable(''),
		style,
		variants = [],
		viewportElement = $bindable(null),
		...restProps
	}: Props = $props();
	const goTo: (slideIndex: number) => void = (slideIndex: number) => {
		currentSlideIndex = slideIndex;
		const elapsed = autoplayTimestamps.duration;
		autoplayTimestamps.duration = 0;
		autoplayTimestamps.start += elapsed;
	};
	const updateAutoplay = (current: number) => {
		if (!isAutoplayable) return;
		const elapsed = current - autoplayTimestamps.current;
		autoplayTimestamps.current = current;
		if (isAutoplayPausable && isHovering) autoplayTimestamps.start += elapsed;
		autoplayTimestamps.duration = autoplayTimestamps.current - autoplayTimestamps.start;

		if (autoplayTimestamps.duration >= autoplayDuration) {
			goTo(currentSlideIndex + numberOfSlidesToMove);
		}

		requestAnimationFrame(updateAutoplay);
	};

	$effect(() => {
		if (!isAutoplayable) return;
		requestAnimationFrame(updateAutoplay);
	});
	$effect(() => {
		autoplayPercent = autoplayTimestamps.duration / autoplayDuration;
	});
	$effect(() => {
		if (!slideElements) return;
		numberOfIndicators = Math.max(1, Math.ceil(slideElements.length / numberOfSlidesInViewport));
	});
	$effect(() => {
		if (!slideElements) return;
		if (currentSlideIndex < 0) {
			if (isLoopable) currentSlideIndex = numberOfIndicators - 1;
			if (!isLoopable) currentSlideIndex = 0;
		}
		if (currentSlideIndex > numberOfIndicators - 1) {
			if (isLoopable) currentSlideIndex = 0;
			if (!isLoopable) currentSlideIndex = numberOfIndicators - 1;
		}
	});
	$effect(() => {
		if (slidesElement) slideElements = slidesElement.children;
	});
	$effect(() => {
		if (slideElements)
			slidesStyle = `grid-template-columns: repeat(${slideElements.length}, minmax(0, 1fr)); transform: translateX(-${(currentSlideIndex * 100) / slideElements.length}%); width: ${(slideElements.length * 100) / numberOfSlidesInViewport}%`;
	});
</script>

<Div
	{...restProps}
	{@attach attachmentFactory(attachments)}
	bind:element
	class={twMerge(
		$theme.Slider.default,
		...variants.map((variant: string) => $theme.Slider[variant]),
		className
	)}
	onkeydown={(e: KeyboardEvent) => {
		const preventKeys: { key: string; slideIndex: number }[] = [
			{ key: 'ArrowLeft', slideIndex: currentSlideIndex - numberOfSlidesToMove },
			{ key: 'ArrowRight', slideIndex: currentSlideIndex + numberOfSlidesToMove },
			{ key: 'End', slideIndex: numberOfIndicators - 1 },
			{ key: 'Home', slideIndex: 0 }
		];

		const { key, slideIndex } = preventKeys.find(({ key }) => key === e.key) ?? {};
		if (key && slideIndex) {
			e.preventDefault();
			goTo(slideIndex);
		}
	}}
	onmouseenter={() => (isHovering = true)}
	onmouseleave={() => (isHovering = false)}
	{style}
>
	<Div class="h-full w-full">
		<Div class="relative h-full w-full">
			<Div bind:element={viewportElement} class="h-full w-full overflow-hidden">
				<Div
					bind:element={slidesElement}
					class={twMerge('grid h-full grid-rows-1 transition duration-200', slidesClasses)}
					style={slidesStyle}
				>
					{#if children}
						{@render children()}
					{/if}
				</Div>
			</Div>
			{#if previousButton}
				{@render previousButton({ goTo })}
			{:else if isLoopable || currentSlideIndex > 0}
				<Button
					class="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2"
					onclick={() => goTo(currentSlideIndex - numberOfSlidesToMove)}
					variants={['icon']}
				>
					<ChevronLeft />
				</Button>
			{/if}
			{#if nextButton}
				{@render nextButton({ goTo })}
			{:else if isLoopable || currentSlideIndex < numberOfIndicators - 1}
				<Button
					class="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2"
					onclick={() => goTo(currentSlideIndex + numberOfSlidesToMove)}
					variants={['icon']}
				>
					<ChevronRight />
				</Button>
			{/if}
		</Div>
		{#if autoplay}
			{@render autoplay()}
		{:else}
			<Div class="bg-primary-500 h-2" style="width: {autoplayPercent * 100}%;" />
		{/if}
	</Div>
	{#if indicators}
		{@render indicators({ goTo })}
	{:else if slideElements && isIndicatorsVisible}
		<Div class="flex gap-2">
			{#each { length: numberOfIndicators } as _, slideIndex}
				<Button
					class={twMerge(
						'rounded-full p-2',
						slideIndex !== currentSlideIndex ? 'bg-gray-200 dark:bg-gray-700' : undefined
					)}
					onclick={() => goTo(slideIndex)}
				></Button>
			{/each}
		</Div>
	{/if}
</Div>
