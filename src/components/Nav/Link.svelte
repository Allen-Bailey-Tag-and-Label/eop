<script>
  // _imports
  import { base } from '$app/paths';

  // props ( external )
  export let href;
  export let i;
  export let show;
  export let title;
  export let toggleMenu;

  // props ( internal )
  const transitionDelays = [
    'delay-300',
    'delay-400',
    'delay-500',
    'delay-600',
    'delay-700',
    'delay-800',
    'delay-900',
    'delay-1000',
    'delay-1100',
    'delay-1200',
    'delay-1300',
    'delay-1400',
    'delay-1500',
    'delay-1600',
    'delay-1700',
    'delay-1800',
    'delay-1900',
    'delay-2000',
  ]
  
  // props ( dynamic )
  $: classes         = {
    lineHeight       : 'leading-[25px]',
    opacity          : `${show?'opacity-100':'opacity-0'} lg:opacity-100`,
    padding          : 'py-[11px] lg:px-[15.5px] lg:px-[16px]',
    rounded          : 'rounded-full',
    textAlign        : 'text-center',
    textColor        : 'hover:text-primary-500',
    textSize         : 'lg:text-[13px]',
    transform        : `transform ${show?'translate-x-0':'translate-x-[-1rem]'} lg:translate-x-0`,
    transition       : `transition duration-200`,
    transitionDelay  : `${show?transitionDelays[i]:'delay-0'} lg:delay-0`,
    width            : 'w-full lg:w-auto',
  };
</script>

<a on:click={toggleMenu} {href} class={Object.values(classes).join(' ')}>{title}</a>