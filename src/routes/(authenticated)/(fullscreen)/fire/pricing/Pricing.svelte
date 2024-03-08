<script>
import { Card, Table, Tbody, Td, Th, Thead, Tr } from '$components';
import * as format from '$lib/format';
import { pricing } from './store';
</script>

<Card class="rounded-none p-0">
	<Table>
		<Thead>
			<Th class="min-w-[25rem] max-w-[25rem] text-wrap">Description</Th>
			<Th>Extended</Th>
		</Thead>
		<Tbody>
			{#each $pricing.productArray as { description, extended }}
				<Tr>
					<Td><div class="text-wrap">{description}</div></Td>
					<Td>{format.currency(extended)}</Td>
				</Tr>
			{/each}
			<Tr>
				<Td>Product Total</Td>
				<Td>{format.currency($pricing.productTotal)}</Td>
			</Tr>
		</Tbody>
	</Table>
</Card>
