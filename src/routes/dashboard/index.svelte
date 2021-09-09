<script>
  // components
  import { Section } from '$components';
  import DailyCovidQuestionnaire from './_components/DailyCovidQuestionnaire.svelte';
</script>

<Section>
  <div class="text-[40px] font-bold">Dashboard</div>
  <div class="grid grid-cols-1 gap-[10px] mt-[20px] lg:grid-cols-4">
    <DailyCovidQuestionnaire />
  </div>
</Section>