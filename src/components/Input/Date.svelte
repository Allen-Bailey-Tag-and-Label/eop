<script>
  // _imports
  import { imask } from '@imask/svelte';
  import { createEventDispatcher } from 'svelte';

  // components
  import * as Buttons from '../Button';
  import Icon from 'svelte-hero-icons';
  import * as Icons from 'svelte-hero-icons'

  // handlers
  const toggleCalendar = () => {
    if ( $calendar.show ) {
      calendar.hide()
    } else {
      calendar.onChange(v=>{
        value = v;
        dispatch('change', { value: v })
      })
      calendar.setDate(value);
      calendar.show();
    }
  }

  // props ( internal)
  const dispatch = createEventDispatcher();

  // props ( external )
  export let disabled        = false;
  export let name            = '';
  export let placeholder     = '';
  export let readonly        = false;
  export let style           = '';
  export let value           = '';

  // store
  import { modal } from '$stores';
  const { calendar } = modal;

</script>

<input {disabled} {readonly} on:change type="text" use:imask={{mask:'00.00.0000', lazy:false}} {name} bind:value class="text-right {$$props.class}" {placeholder} {style}/>
{#if !readonly}
  <Buttons.Icon on:click={toggleCalendar} class="absolute bottom-0 right-0 mb-[5px] mr-[11px]">
    <div class="relative w-full h-full">
      <Icon src={Icons.Calendar} class="w-[24px] h-[24px]" />
    </div>
  </Buttons.Icon>
{/if}