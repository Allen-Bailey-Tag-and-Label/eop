<script>
  // props ( external )
  export let name;
  export let question = '';
  export let value;
</script>

<div class="flex flex-col space-y-[1rem]">
  <div class="flex space-x-[.5rem]">
    <div>{question}</div>
  </div>
  <div class="grid grid-cols-2 gap-[1rem]">
    <label class="focus-within:ring-opacity-10 ring ring-opacity-0 shadow-xl rounded cursor-pointer text-center p-[11px] relative transition duration-200 {value===true?'bg-primary text-gray-900 ring-primary-500 focus-within:ring-opacity-30' : 'ring-white ring-offset ring-offset-1 ring-offset-gray-400 hover:ring-offset-gray-200'}">
      <input {name} type="radio" bind:group={value} value={true} class="w-[0px] h-[0px] opacity-0 absolute top-0 left-0" />
      Yes
    </label>
    <label class="focus-within:ring-opacity-10 ring ring-opacity-0 shadow-xl rounded cursor-pointer text-center p-[11px] relative transition duration-200 {value===false?'bg-primary text-gray-900 ring-primary-500 focus-within:ring-opacity-30' : 'ring-white ring-offset ring-offset-1 ring-offset-gray-400 hover:ring-offset-gray-200'}">
      <input {name} type="radio" bind:group={value} value={false} class="w-[0px] h-[0px] opacity-0 absolute top-0 left-0" />
      No
    </label>
  </div>
</div>