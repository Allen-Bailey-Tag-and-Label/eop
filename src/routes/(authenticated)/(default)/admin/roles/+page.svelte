<script lang="ts">
import { DBTable } from '$components';

// props (external)
export let data;
</script>

<DBTable {...data.dbTable} />
