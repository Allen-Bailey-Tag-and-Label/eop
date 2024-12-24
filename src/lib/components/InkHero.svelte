<script lang="ts">
	import { onMount } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { Button, Div, Icon } from '$lib/components';
	import { ArrowPath } from 'sveltewind/icons';

	type Video = string | undefined;

	const updateVideo = () => {
		const randomVideoIndex = Math.floor(Math.random() * videos.length);
		video = videos[randomVideoIndex];
	};
	let video: Video = $state('');
	const videos = [
		'https://videos.pexels.com/video-files/11750982/11750982-sd_960_506_30fps.mp4',
		'https://videos.pexels.com/video-files/11750982/11750982-sd_960_506_30fps.mp4',
		'https://videos.pexels.com/video-files/5935903/5935903-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/5935903/5935903-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/15432027/15432027-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/15432027/15432027-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/10727624/10727624-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/10727624/10727624-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/4378289/4378289-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/4378289/4378289-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/9668307/9668307-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/9668307/9668307-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/11416146/11416146-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/11416146/11416146-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/11229632/11229632-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/11229632/11229632-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/10866367/10866367-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/10866367/10866367-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/10754251/10754251-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/10754251/10754251-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/5593571/5593571-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/5593571/5593571-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/3580088/3580088-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/3580088/3580088-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/7467283/7467283-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/7467283/7467283-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/4378291/4378291-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/4378291/4378291-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/7145060/7145060-sd_960_506_30fps.mp4',
		'https://videos.pexels.com/video-files/7145060/7145060-sd_960_506_30fps.mp4',
		'https://videos.pexels.com/video-files/15432220/15432220-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/15432220/15432220-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/6067531/6067531-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/6067531/6067531-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/4003943/4003943-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/4003943/4003943-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/3949490/3949490-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/3949490/3949490-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/4003945/4003945-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/4003945/4003945-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/5877395/5877395-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/5877395/5877395-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/3059865/3059865-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/3059865/3059865-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/4003944/4003944-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/4003944/4003944-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/11351135/11351135-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/11351135/11351135-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/3952931/3952931-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/3952931/3952931-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/7566040/7566040-sd_960_506_25fps.mp4',
		'https://videos.pexels.com/video-files/7566040/7566040-sd_960_506_25fps.mp4',
		'https://videos.pexels.com/video-files/5877402/5877402-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/5877402/5877402-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/6720978/6720978-sd_960_506_30fps.mp4',
		'https://videos.pexels.com/video-files/6720978/6720978-sd_960_506_30fps.mp4',
		'https://videos.pexels.com/video-files/18290251/18290251-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/18290251/18290251-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/3922710/3922710-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/3922710/3922710-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/9668303/9668303-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/9668303/9668303-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/15432177/15432177-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/15432177/15432177-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/5914710/5914710-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/5914710/5914710-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/15432039/15432039-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/15432039/15432039-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/5935843/5935843-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/5935843/5935843-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/15432176/15432176-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/15432176/15432176-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/15432175/15432175-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/15432175/15432175-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/10727625/10727625-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/10727625/10727625-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/5935837/5935837-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/5935837/5935837-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/15432037/15432037-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/15432037/15432037-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/7639542/7639542-sd_360_640_30fps.mp4',
		'https://videos.pexels.com/video-files/7639542/7639542-sd_360_640_30fps.mp4',
		'https://videos.pexels.com/video-files/10754252/10754252-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/10754252/10754252-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/3649610/3649610-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/3649610/3649610-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/3971200/3971200-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/3971200/3971200-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/3864183/3864183-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/3864183/3864183-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/15432095/15432095-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/15432095/15432095-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/10681369/10681369-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/10681369/10681369-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/6783972/6783972-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/6783972/6783972-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/11740379/11740379-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/11740379/11740379-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/3925678/3925678-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/3925678/3925678-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/11972698/11972698-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/11972698/11972698-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/11416144/11416144-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/11416144/11416144-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/10866368/10866368-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/10866368/10866368-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/4378920/4378920-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/4378920/4378920-sd_640_360_24fps.mp4',
		'https://videos.pexels.com/video-files/7566039/7566039-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/7566039/7566039-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/10754257/10754257-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/10754257/10754257-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/6071223/6071223-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/6071223/6071223-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/10754253/10754253-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/10754253/10754253-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/7507915/7507915-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/7507915/7507915-sd_640_360_30fps.mp4',
		'https://videos.pexels.com/video-files/4006561/4006561-sd_640_360_25fps.mp4',
		'https://videos.pexels.com/video-files/4006561/4006561-sd_640_360_25fps.mp4'
	];
	onMount(() => {
		updateVideo();
	});
</script>

<Div class="relative h-full w-full">
	<video
		autoplay
		class={twMerge('h-full w-full object-cover mix-blend-multiply grayscale invert dark:invert-0')}
		loop
		muted
		playsinline
		src={video || ''}
	>
	</video>
	<Button class="absolute bottom-4 right-4" onclick={updateVideo} variants={['default', 'icon']}>
		<Icon src={ArrowPath} />
	</Button>
</Div>
