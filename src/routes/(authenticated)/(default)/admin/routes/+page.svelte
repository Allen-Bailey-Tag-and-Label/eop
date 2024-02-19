<script lang="ts">
import { browser } from '$app/environment';
import { DBTable } from '$components';

// props (external)
export let data;

$: if (browser) console.log(data);
</script>

<DBTable {...data.dbTable} />
