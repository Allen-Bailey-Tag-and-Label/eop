<script lang="ts">
</script>

<div class="grid max-h-[100dvh] min-h-[100dvh] pwa:max-h-[100vh] pwa:min-h-[100vh] md:grid-cols-12">
	<div
		class="flex flex-col items-center justify-center space-y-6 p-6 md:col-span-8 lg:col-span-6 lg:space-y-12"
	>
		<slot />
	</div>
	<div
		class="bg-primary-500 relative hidden max-h-[100dvh] overflow-hidden md:col-span-4 md:flex lg:col-span-6"
	>
		<video
			autoplay
			class="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 object-cover mix-blend-screen grayscale"
			loop
			muted
		>
			<source media="(min-width: 1440px)" src="/videos/pexels-mart-production-7565884(1080p).mp4" />
			<source media="(min-width: 1080px)" src="/videos/pexels-mart-production-7565884(720p).mp4" />
			<source media="(min-width: 720px)" src="/videos/pexels-mart-production-7565884(540p).mp4" />
			<source src="/videos/pexels-mart-production-7565884(360p).mp4" />
			<track kind="captions" />
		</video>
		<div
			class="absolute left-0 top-0 h-full w-full bg-slate-50 mix-blend-soft-light dark:bg-slate-900"
		/>
	</div>
</div>
