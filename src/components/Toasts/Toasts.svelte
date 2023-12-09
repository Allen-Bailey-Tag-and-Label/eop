<script lang="ts">
  import { Toast } from '$components';
  import { subscribeToast } from '$stores';

  // props (internal)
  const maxVisible = 4;
  const {
    scales,
    translateYs
  }: {
    scales: { [key: string | number]: number };
    translateYs: { [key: string | number]: number };
  } = [...Array(maxVisible)].reduce(
    (obj, _, i) => {
      obj.scales[i] = Math.pow(0.9, i);
      obj.translateYs[i] = i * (100 / maxVisible);
      return obj;
    },
    { scales: { rest: 0 }, translateYs: { rest: 100 } }
  );
  let toasts: string[] = [];

  subscribeToast((state) => (toasts = state));
</script>

<div
  class="fixed z-[100] top-0 left-0 w-[100svw] lg:w-[100lvw] h-[100svh] lg:h-[100lvh] overflow-hidden pointer-events-none"
>
  {#each toasts as text, i}
    {@const reverseIndex = toasts.length - i}
    {@const scale = reverseIndex > maxVisible ? scales.rest : scales[reverseIndex - 1]}
    {@const translateY =
      reverseIndex > maxVisible ? translateYs.rest : translateYs[reverseIndex - 1]}
    <Toast {scale} {translateY}>
      {text}
    </Toast>
  {/each}
</div>
