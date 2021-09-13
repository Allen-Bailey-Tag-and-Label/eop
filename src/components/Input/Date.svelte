<script>
  // _imports
  import { imask } from '@imask/svelte';
  import { createEventDispatcher } from 'svelte';

  // components
  import { Buttons } from '$components';
  import Icon from 'svelte-hero-icons';
  import * as Icons from 'svelte-hero-icons'

  // handlers
  const toggleCalendar = () => {
    if ( $calendar.show ) {
      calendar.hide()
    } else {
      calendar.onChange(v=>{
        value = v;
        dispatch('change')
      })
      calendar.setDate(value);
      calendar.show();
    }
  }

  // props ( internal)
  const dispatch = createEventDispatcher();

  // props ( external )
  export let label           = '';
  export let name            = '';
  export let placeholder     = '';
  export let style           = '';
  export let type            = '';
  export let value           = '';

  // store
  import { modal } from '$stores';
  const { calendar } = modal;

</script>

<input on:change type="text" use:imask={{mask:'00.00.0000', lazy:false}} {name} bind:value class={$$props.class} {placeholder} {style}/>
<Buttons.Icon on:click={toggleCalendar} class="absolute bottom-0 right-0 mb-[5px] mr-[11px]">
  <div class="relative w-full h-full">
    <Icon src={Icons.Calendar} class="w-[24px] h-[24px]" />
  </div>
</Buttons.Icon>