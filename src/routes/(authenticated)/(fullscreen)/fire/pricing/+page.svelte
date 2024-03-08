<script>
import { Card } from '$components';
import Pricing from './Pricing.svelte';
import ProductTable from './ProductTable.svelte';
import Toolbar from './Toolbar.svelte';
</script>

<div class="grid flex-grow overflow-auto" style="grid-template-rows:min-content 1fr">
	<Toolbar />
	<Card class="grid grid-cols-[1fr_fit-content(0px)] overflow-auto rounded-none p-0">
		<ProductTable />
		<Pricing />
	</Card>
</div>
