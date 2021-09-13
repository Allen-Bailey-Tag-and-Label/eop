<style>
  table tr:hover td {
    background-color: rgba(255,255,255,.05);
  }
</style>

<div class="overflow-auto w-full scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary-500 scrollbar-track-rounded-full">
  <table class="w-full">
    <slot name="thead">
      <thead></thead>
    </slot>
    <slot name="tbody">
      <tbody></tbody>
    </slot>
  </table>
</div>