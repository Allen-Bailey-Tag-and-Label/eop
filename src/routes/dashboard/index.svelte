<script>
  // components
  import { Section } from '$components';
  import DailyCovidQuestionnaire from './_components/DailyCovidQuestionnaire.svelte';
  // import Filler from './_components/Filler.svelte';
</script>

<Section>
  <div class="text-[40px] font-bold">Dashboard</div>
  <div class="grid grid-cols-1 gap-[10px] mt-[20px] lg:grid-cols-4">
    <DailyCovidQuestionnaire />
    <!-- <Filler /> -->
  </div>
</Section>