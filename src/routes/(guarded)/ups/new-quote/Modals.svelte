<script>
  import ModalCandidate from './ModalCandidate.svelte';
  import ModalError from './ModalError.svelte';
  import ModalProgressRates from './ModalProgressRates.svelte';
  import ModalProgressSaveQuote from './ModalProgressSaveQuote.svelte';
  import ModalProgressValidation from './ModalProgressValidation.svelte';

  // props (external)
  export let modal;
</script>

<ModalCandidate bind:modal />
<ModalError bind:modal />
<ModalProgressRates bind:modal />
<ModalProgressSaveQuote bind:modal />
<ModalProgressValidation bind:modal />
