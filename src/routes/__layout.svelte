<script>
	// imports
	import { onMount } from 'svelte';
	import { Main, Nav, Route, RouteGuarding, Sidebar, Spinner, Socketio, Title, Theme } from '$components';
	import { token } from '$stores'
	import '../app.css';

	// utilities

	// handlers

	// props (internal)
	let loaded = false;

	// props (external)

	// props (dynamic)

	// lifecycle
  const lifecycle = {
    destroy : () => {},
    mount : async () => {
			loaded = true;
		},
  }
  onMount(async() => {
    await lifecycle.mount();
    return () => {
      lifecycle.destroy();
    }
  })
</script>

<Title>
	<Socketio>
		<Theme>
			<RouteGuarding>
				<Main>
					{#if loaded}
						<slot />
						{#if $token !== ''}
							<Nav />
							<Sidebar/>
						{/if}
					{:else}
						<Route>
							<Spinner />
						</Route>
					{/if}
				</Main>
			</RouteGuarding>
		</Theme>
	</Socketio>
</Title>
