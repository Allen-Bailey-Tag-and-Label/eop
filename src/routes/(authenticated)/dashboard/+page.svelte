<script lang="ts">
  // props (external)
  export let data;
</script>

{#each [...Array(100)] as _, i}
  <div>{i}</div>
{/each}
