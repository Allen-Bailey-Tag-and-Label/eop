<script lang="ts">
import { DBTable } from '$components';

// handlers
const updateHandler = async (id: string, key: string, type: string, value: any) => {
	const formData = new FormData();
	formData.append('id', id);
	formData.append('key', key);
	if (data.dbTable.model) formData.append('model', data.dbTable.model);
	formData.append('type', type);
	formData.append('value', JSON.stringify(value));
	await fetch('?/update', {
		method: 'POST',
		body: formData
	});
};
// props (external)
export let data;
$: console.log(data.dbTable.rows);
</script>

<div class="flex max-h-full flex-grow flex-col space-y-6 overflow-visible">
	<div>Test</div>
	<DBTable
		{...data.dbTable}
		isCreateable={false}
		isDeleteable={false}
		isUploadable={false}
		updateHandler={updateHandler}
	/>
</div>
