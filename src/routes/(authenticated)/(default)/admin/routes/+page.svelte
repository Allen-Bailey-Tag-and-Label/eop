<script lang="ts">
import { DBTable } from '$components';

// props (external)
export let data;

// props (internal)
const columns = [
	{ label: 'HREF', key: 'href' },
	{ label: 'Label', key: 'label' }
];
</script>

<DBTable columns={columns} model="Route" rows={data.routes} />
