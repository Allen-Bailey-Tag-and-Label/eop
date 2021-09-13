<script>
  // _imports
  import moment from 'moment';

  // components
  import * as Buttons from '$components/Button';
  import Card from '$components/Card.svelte';
  import Container from '$components/Container.svelte';
  import Icon, { ChevronLeft, ChevronRight } from 'svelte-hero-icons';
  import Modal from '$components/Modal/Modal.svelte';

  // handlers
  const clickHandler = day => {
    const date = moment(firstDay).add(day,'days').format('MM.DD.YYYY')
    $store.changeHandler(date);
    store.setDate(date);
    store.hide();
  }

  // props ( internal )
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const classes = {
    default: 'outline-none py-[8px] text-center rounded-sm transition duration-200 ring ring-1 ring-primary ring-opacity-0 hover:ring-opacity-30 focus:ring-opacity-30',
    differentMonth: 'outline-none py-[8px] text-center opacity-50 rounded-sm transition duration-200 ring ring-1 ring-primary ring-opacity-0 hover:ring-opacity-30 focus:ring-opacity-30',
    selected: 'outline-none py-[8px] text-center rounded-sm transition duration-200 bg-primary text-gray-900',
    today: 'outline-none py-[8px] text-center rounded-sm transition duration-200 text-primary ring ring-1 ring-primary ring-opacity-30',
  }

  // props ( dynamic )
  $: firstDay = moment($store.dateView, 'MM.DD.YYYY').startOf('month').startOf('week');
  // $: lastDay = moment($store.dateView, 'MM.DD.YYYY').endOf('month').endOf('week');
  // $: totalDays = isNaN(lastDay.diff(firstDay, 'days') + 1) ? 0 : lastDay.diff(firstDay, 'days') + 1;
  $: calendarArray = Array.from(Array(42)).map((_,i)=>i)

  // stores
  import store from './store';
</script>

<Modal show={$store.show}>
  <Container class="flex justify-center pointer-events-none">
    <Card class="max-w-[375px] w-full transition duration-200 {$store.show?'opacity-100 pointer-events-auto':'opacity-0 pointer-events-none'}">
      <div class="flex flex-col items-center space-y-[16px]">
        <div class="flex justify-between w-full space-x-[16px] items-center">
          <Buttons.Icon on:click={store.prevMonth}><Icon src={ChevronLeft} class="w-[24px] h-[24px]" /></Buttons.Icon>
          <div class="font-bold">{moment($store.dateView, 'MM.DD.YYYY').format('MMMM YYYY')}</div>
          <Buttons.Icon on:click={store.nextMonth}><Icon src={ChevronRight} class="w-[24px] h-[24px]" /></Buttons.Icon>
        </div>
        <div class="grid grid-cols-7 w-full gap-[4px]">
          {#each daysOfWeek as dayOfWeek}
            <div class="text-center opacity-50 py-[8px] font-bold">{dayOfWeek}</div>
          {/each}
          {#each calendarArray as day}
            <a href="#" on:click|preventDefault={clickHandler(day)} class={firstDay.clone().add(day,'days').format('MM') !== moment($store.dateView, 'MM.DD.YYYY').format('MM')?classes.differentMonth:firstDay.clone().add(day,'days').format('MM.DD.YYYY') === moment($store.date, 'MM.DD.YYYY').format('MM.DD.YYYY')?classes.selected:firstDay.clone().add(day,'days').format('MM.DD.YYYY') === moment().format('MM.DD.YYYY')?classes.today:classes.default}>{firstDay.clone().add(day,'days').format('D')}</a>
          {/each}
        </div>
      </div>
    </Card>
  </Container>
</Modal>