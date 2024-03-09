<script lang="ts">
import { DBTable } from '$components';

// props (external)
export let data;
</script>

<DBTable
	{...data.dbTable}
	isCreatable={false}
	isDeleteable={false}
	isEditable={false}
	isUploadable={false}
/>
