<script lang="ts">
	import {
		Button,
		Checkbox,
		Div,
		Form,
		H1,
		H2,
		Input,
		Modal,
		MongooseTable,
		MultiSelect,
		P,
		RangeInput,
		Select,
		SubmitButton,
		Td
	} from '$lib/components';
	import type {
		ColumnOverrides,
		ColumnSanitized,
		TdSnippet
	} from '$lib/components/MongooseTable/types.js';
	import { percent } from '$lib/formats/percent.js';
	import { slide } from 'svelte/transition';

	let { data } = $props();
	let columnOverrides: ColumnOverrides = {
		_branchIds: { isSortable: false },
		_roleIds: { isSortable: false },
		_settingsId: { isSortable: false },
		passwordHash: {
			isProtected: true
		}
	};
	let columnsSanitized: ColumnSanitized[] = $state([]);
	let createModalData = $state({
		formData: {
			profile: {
				ennisId: '0',
				email: '',
				firstName: '',
				hireDate: new Date().toISOString().split('T')[0],
				lastName: '',
				phone: '0'
			},
			settings: {
				magnification: '16'
			},
			user: {
				_branchIds: [],
				_defaultBranchId: '',
				_profileId: '',
				_roleIds: [],
				_settingsId: '',
				isActive: false,
				password: 'ABTL1234$',
				username: ''
			}
		},
		isOpen: false,
		steps: ['Profile', 'Settings', 'User'],
		stepIndex: 0
	});
	let isCreateModalOpen = $state(false);
	let isLoading = $state(false);
	let resetModal = $state({
		code: '',
		isLoading: false,
		isOpen: false
	});
	let virtualColumns = $state([
		{
			isExportable: false,
			isSortable: false,
			isFilterable: false,
			key: 'buttons',
			label: 'Reset Password',
			snippet: resetPassword
		}
	]);
</script>

<MongooseTable
	bind:columnsSanitized
	bind:isCreateModalOpen
	{columnOverrides}
	{createModal}
	{data}
	modelName={'User'}
	{virtualColumns}
/>

<Modal bind:isOpen={resetModal.isOpen} class="space-y-6">
	<Div class="flex flex-col items-center space-y-4">
		{#if resetModal.code === ''}
			<H1>******</H1>
			<P>Please wait while we get a one time reset code...</P>
		{:else}
			<H1>{resetModal.code}</H1>
			<P>Please provide the code to the user.</P>
		{/if}
	</Div>
	<Div class="flex justify-end space-x-2">
		<Button
			onclick={() => {
				resetModal.isOpen = false;
			}}
			variants={['ghost']}>Cancel</Button
		>
	</Div>
</Modal>

{#snippet createModal()}
	<Modal bind:isOpen={isCreateModalOpen} class="p-0">
		<Div class="max-w-[25rem] overflow-hidden">
			<Div class="flex items-center justify-between px-6 pt-6">
				<Button
					class={createModalData.stepIndex === 0 ? 'pointer-events-none opacity-0' : undefined}
					onclick={() => createModalData.stepIndex--}
				>
					Back
				</Button>
				<H2>{createModalData.steps[createModalData.stepIndex]}</H2>
				<Button
					class={createModalData.stepIndex === createModalData.steps.length - 1
						? 'pointer-events-none opacity-0'
						: undefined}
					onclick={() => createModalData.stepIndex++}
				>
					Skip
				</Button>
			</Div>
			<Div class="grid w-[300%] grid-cols-3">
				<Div
					class="flex flex-col p-6"
					style="transform:translateX({(0 - createModalData.stepIndex) * 100}%)"
				>
					<Form
						action="?/create-profile"
						class="flex flex-grow flex-col"
						submitFunction={() => {
							isLoading = true;
							return async ({ result }) => {
								isLoading = false;
								if (result.type === 'success' && result.data) {
									createModalData.formData.user._profileId = result.data._profileId;
									createModalData.formData.user.username =
										`${createModalData.formData.profile.firstName[0]}${createModalData.formData.profile.lastName}`.toLowerCase();
									const profileIdColumnIndex =
										columnsSanitized?.findIndex((column) => column.key === '_profileId') ?? -1;
									if (profileIdColumnIndex > -1) {
										const label = `${createModalData.formData.profile.firstName} ${createModalData.formData.profile.lastName}`;
										const value = createModalData.formData.user._profileId;
										columnsSanitized[profileIdColumnIndex].options.push({ label, value });
										columnsSanitized[profileIdColumnIndex].options.sort((a, b) =>
											a.label.localeCompare(b.label)
										);
									}
									createModalData.stepIndex++;
								}
							};
						}}
					>
						<Div class="flex flex-grow flex-col space-y-4">
							<Input
								bind:value={createModalData.formData.profile.firstName}
								label="First Name"
								name="firstName"
								required={true}
							/>
							<Input
								bind:value={createModalData.formData.profile.lastName}
								label="Last Name"
								name="lastName"
								required={true}
							/>
							<Input
								bind:value={createModalData.formData.profile.hireDate}
								label="Hire Date"
								name="hireDate"
								type="date"
							/>
							<Input
								bind:value={createModalData.formData.profile.ennisId}
								class="text-right"
								label="Ennis ID"
								name="ennisId"
								required={true}
								type="number"
							/>
							<Input
								bind:value={createModalData.formData.profile.email}
								label="Email"
								name="email"
								type="email"
							/>
							<Input
								bind:value={createModalData.formData.profile.phone}
								class="text-right"
								label="Phone"
								name="phone"
								type="number"
							/>
						</Div>
						<Div class="flex justify-end space-x-2">
							{#if isLoading}
								<div transition:slide={{ axis: 'y' }}>
									<Button onclick={() => (isCreateModalOpen = false)} variants={['ghost']}
										>Cancel</Button
									>
								</div>
							{/if}
							<SubmitButton bind:isLoading>Create</SubmitButton>
						</Div>
					</Form>
				</Div>
				<Div
					class="flex flex-col p-6"
					style="transform:translateX({(0 - createModalData.stepIndex) * 100}%)"
				>
					<Form
						action="?/create-settings"
						class="flex flex-grow flex-col"
						submitFunction={() => {
							isLoading = true;
							return async ({ result }) => {
								isLoading = false;
								if (result.type === 'success' && result.data) {
									createModalData.formData.user._settingsId = result.data._settingsId;
									const settingsColumnsIndex =
										columnsSanitized?.findIndex((column) => column.key === '_settingsId') ?? -1;
									if (settingsColumnsIndex > -1) {
										const label = createModalData.formData.user._settingsId;
										const value = createModalData.formData.user._settingsId;
										columnsSanitized[settingsColumnsIndex].options.push({ label, value });
										columnsSanitized[settingsColumnsIndex].options.sort((a, b) =>
											a.label.localeCompare(b.label)
										);
									}
									createModalData.stepIndex++;
								}
							};
						}}
					>
						<Div class="flex flex-grow flex-col space-y-4">
							<RangeInput
								bind:value={
									() => {
										return createModalData.formData.settings.magnification.toString();
									},
									(string) => {
										createModalData.formData.settings.magnification = string;
									}
								}
								formatValue={(v: string | number) =>
									percent((typeof v === 'number' ? v : +v) / 16, {
										maximumFractionDigits: 0,
										minimumFractionDigits: 0
									})}
								label="Magnification"
								max={22}
								min={10}
								name="magnification"
							/>
						</Div>
						<Div class="flex justify-end space-x-2">
							{#if isLoading}
								<div transition:slide={{ axis: 'y' }}>
									<Button onclick={() => (isCreateModalOpen = false)} variants={['ghost']}
										>Cancel</Button
									>
								</div>
							{/if}
							<SubmitButton bind:isLoading>Create</SubmitButton>
						</Div>
					</Form>
				</Div>
				<Div
					class="flex flex-col p-6"
					style="transform:translateX({(0 - createModalData.stepIndex) * 100}%)"
				>
					<Form
						action="?/create-user"
						class="flex flex-grow flex-col"
						submitFunction={() => {
							isLoading = true;
							return async ({ update }) => {
								isLoading = false;
								await update();
								isCreateModalOpen = false;
							};
						}}
					>
						<Div class="flex flex-grow flex-col space-y-4">
							<MultiSelect
								bind:value={createModalData.formData.user._branchIds}
								label="Branchs"
								name="_branchIds"
								options={columnsSanitized?.find((column) => column.key === '_branchIds')?.options ??
									[]}
							/>
							<Select
								bind:value={createModalData.formData.user._defaultBranchId}
								label="Default Branch"
								name="_defaultBranchId"
								options={columnsSanitized?.find((column) => column.key === '_defaultBranchId')
									?.options ?? []}
								required={true}
							/>
							<Select
								bind:value={createModalData.formData.user._profileId}
								label="Profile"
								name="_profileId"
								options={columnsSanitized?.find((column) => column.key === '_profileId')?.options ??
									[]}
								required={true}
							/>
							<MultiSelect
								bind:value={createModalData.formData.user._roleIds}
								label="Roles"
								name="_roleIds"
								options={columnsSanitized?.find((column) => column.key === '_roleIds')?.options ??
									[]}
							/>
							<Select
								bind:value={createModalData.formData.user._settingsId}
								label="Settings"
								name="_settingsId"
								options={columnsSanitized?.find((column) => column.key === '_settingsId')
									?.options ?? []}
								required={true}
							/>
							<Checkbox
								bind:checked={createModalData.formData.user.isActive}
								label="Active?"
								name="isActive"
							/>
							<Input
								bind:value={createModalData.formData.user.password}
								label="Password"
								name="password"
								required={true}
							/>
							<Input
								bind:value={createModalData.formData.user.username}
								label="Username"
								name="username"
								required={true}
							/>
						</Div>
						<Div class="flex justify-end space-x-2">
							{#if isLoading}
								<div transition:slide={{ axis: 'y' }}>
									<Button onclick={() => (isCreateModalOpen = false)} variants={['ghost']}
										>Cancel</Button
									>
								</div>
							{/if}
							<SubmitButton bind:isLoading>Create</SubmitButton>
						</Div>
					</Form>
				</Div>
			</Div>
		</Div>
	</Modal>
{/snippet}

{#snippet resetPassword({ object }: TdSnippet)}
	<Td class="py-0">
		<Form
			action="?/reset-password"
			submitFunction={() => {
				resetModal.isLoading = true;
				resetModal.isOpen = true;
				return async ({ result }) => {
					resetModal.isLoading = false;
					if (result.type === 'success' && result.data) {
						resetModal.code = result.data.code;
					}
				};
			}}
		>
			<Input
				class="sr-only absolute h-0 w-0 opacity-0"
				name="username"
				type="hidden"
				value={object?.username}
			/>
			<Button variants={['small']}>Reset Password</Button>
		</Form>
	</Td>
{/snippet}
