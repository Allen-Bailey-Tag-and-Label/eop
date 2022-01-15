<script>
  // imports
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button, Field, Fieldset, Form, H1, Input, Route, Spinner } from '$components';
  import { token, socket } from '$stores';

  // utilities

  // handlers
  const submitHandler = async e => {
    e.preventDefault();

    // check if form already submitted
    if (!submitted) {
      // update submitted
      submitted = true;

      // reset error message
      errorMessage = '';

      // authenticate user
      try {
        const tokenString = await new Promise((resolve, reject) => {
          // generate body
          const body = Object.keys(fields).reduce((obj, key)=>{
            obj[key] = fields[key].value;
            return obj;
          }, {})

          // emit to socket
          $socket.emit('signin', body, ({error, token : tokenString}) => {
            if (error) reject(error)
            if (tokenString) resolve(tokenString)
          })
        })

        // update token
        $token = tokenString;

        // route to dashboard
        goto('/dashboard');
      } catch(error) {
        errorMessage = error;
      }

      // update submitted
      submitted = false;
    }
  }

  // props (internal)
  const fields = {
    username: {
      classes: '',
      label: 'Username',
      type: 'text',
      value: '',
    },
    password : {
      classes: '',
      label: 'Password',
      type: 'password',
      value: '',
    },
  }
  let errorMessage = '';
  let submitted = false;

  // props (external)

  // props (dynamic)

  // lifecycle
  const lifecycle = {
    destroy : () => {},
    mount : async () => {},
  }
  onMount(async() => {
    await lifecycle.mount();
    return () => {
      lifecycle.destroy();
    }
  })
</script>

<Route>
  <Form on:submit={submitHandler}>
    <H1 class="text-center">Sign In</H1>
    <Fieldset>
      {#each Object.values(fields) as {classes, label, type, value}}
        <Field {label}>
          <Input class={classes} bind:value {type} />
        </Field>
      {/each}
      <div class="min-h-[1.5rem] text-red-500">{errorMessage}</div>
    </Fieldset>
    <Button class="mt-[1rem] relative" type="submit">
      {#if submitted}
        <Spinner class='w-[1.5rem] h-[1.5rem]'/>
      {:else}
        Sign In
      {/if}
    </Button>
  </Form>
</Route>

<slot/>