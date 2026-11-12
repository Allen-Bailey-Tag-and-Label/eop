import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor, within } from '@testing-library/svelte';
import Datatable from './Datatable.svelte';
import MongooseTable from '../MongooseTable/MongooseTable.svelte';
import MultiSelect from '../MultiSelect/MultiSelect.svelte';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy() {} }) }));
vi.mock('sveltewind/transitions', () => ({ subtleReveal: () => ({ duration: 0 }) }));

beforeEach(() => {
	const opened = new WeakSet<HTMLElement>();
	const matches = HTMLElement.prototype.matches;
	vi.spyOn(HTMLElement.prototype, 'matches').mockImplementation(function (
		this: HTMLElement,
		selector
	) {
		return selector === ':popover-open' ? opened.has(this) : matches.call(this, selector);
	});
	Object.defineProperties(HTMLElement.prototype, {
		showPopover: {
			configurable: true,
			value: function () {
				opened.add(this);
			}
		},
		hidePopover: {
			configurable: true,
			value: function () {
				opened.delete(this);
			}
		}
	});
	vi.stubGlobal('CSS', { supports: () => false });
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
});
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
	Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
});

const columns = () => [
	{
		key: 'roles',
		type: 'multiSelect' as const,
		label: 'Roles',
		options: [
			{ label: 'Employee', value: 'employee' },
			{ label: 'Manager', value: 'manager' }
		]
	}
];

describe('table inline multiselects', () => {
	it('renders Role.routes reference IDs as inline labels in existing MongooseTable rows', async () => {
		const dashboardId = 'a'.repeat(24),
			managementId = 'b'.repeat(24);
		const view = render(MongooseTable, {
			modelName: 'Role',
			isToolbarVisible: false,
			isSelectable: false,
			columnOverrides: { routes: { isSortable: false } },
			data: {
				columns: [
					{
						key: 'routes',
						type: 'multiSelect',
						options: [
							{ label: '/dashboard', value: dashboardId },
							{ label: '/admin/roles', value: managementId }
						]
					}
				],
				rows: Promise.resolve([{ _id: 'c'.repeat(24), routes: [dashboardId] }]),
				totalRows: Promise.resolve(1),
				settings: {
					_routeId: '/admin/roles',
					columnsOrder: [],
					currentPage: 0,
					filter: [],
					rowsPerPage: 10,
					sortDirection: 'asc',
					sortKey: '',
					isPaginateable: true
				}
			}
		});
		const input = await view.findByRole('combobox', { name: 'routes' });
		const selected = view.getByRole('group', { name: 'Selected options' });
		expect(input.parentElement).toContainElement(selected);
		expect(selected).toHaveTextContent('/dashboard');
		expect(selected).not.toHaveTextContent(dashboardId);
		await fireEvent.click(input);
		await fireEvent.click(view.getByRole('option', { name: '/admin/roles' }));
		expect(input.parentElement).toContainElement(
			view.getByRole('button', { name: 'Remove /admin/roles' })
		);
		await fireEvent.click(view.getByRole('button', { name: 'Remove /dashboard' }));
		expect(view.queryByRole('button', { name: 'Remove /dashboard' })).not.toBeInTheDocument();
		expect(view.getByRole('button', { name: 'Remove /admin/roles' })).toBeInTheDocument();
	});
	it('defaults the shared control to inline, preserves its value, and allows below placement explicitly', async () => {
		const view = render(MultiSelect, {
			label: 'Roles',
			value: ['employee'],
			options: columns()[0].options
		});
		const input = view.getByRole('combobox', { name: 'Roles' });
		expect(input.parentElement).toContainElement(
			view.getByRole('button', { name: 'Remove Employee' })
		);
		await view.rerender({ selectionPlacement: 'below' });
		expect(view.getByRole('combobox', { name: 'Roles' }).parentElement).not.toContainElement(
			view.getByRole('button', { name: 'Remove Employee' })
		);
	});
	it('shows selected values inline in read-only cells without allowing changes', async () => {
		const view = render(Datatable, {
			columns: columns(),
			rows: [{ roles: ['employee', 'manager'] }],
			isEditable: false,
			isToolbarVisible: false,
			isSelectable: false
		});
		const input = view.getByRole('combobox', { name: 'roles' });
		expect(input).toBeDisabled();
		for (const label of ['Employee', 'Manager']) {
			const remove = view.getByRole('button', { name: `Remove ${label}` });
			expect(input.parentElement).toContainElement(remove);
			expect(remove).toBeDisabled();
			await fireEvent.click(remove);
			expect(remove).toBeInTheDocument();
		}
	});
	it('keeps chips inside the editable cell input and updates the selection when adding or removing options', async () => {
		const view = render(Datatable, {
			columns: columns(),
			rows: [{ roles: ['employee'] }],
			isToolbarVisible: false,
			isSelectable: false
		});
		const input = view.getByRole('combobox', { name: 'roles' });
		expect(input.parentElement).toContainElement(
			view.getByRole('button', { name: 'Remove Employee' })
		);
		await fireEvent.click(input);
		await fireEvent.click(view.getByRole('option', { name: 'Manager' }));
		expect(input.parentElement).toContainElement(
			view.getByRole('button', { name: 'Remove Manager' })
		);
		await fireEvent.click(view.getByRole('button', { name: 'Remove Employee' }));
		expect(view.queryByRole('button', { name: 'Remove Employee' })).not.toBeInTheDocument();
		expect(view.getByRole('button', { name: 'Remove Manager' })).toBeInTheDocument();
	});
	it('uses inline chips when creating a Mongoose record and submits each selected value under the field name', async () => {
		const view = render(MongooseTable, {
			modelName: 'User',
			isCreateModalOpen: true,
			create: { roles: ['employee'] },
			data: {
				columns: columns(),
				rows: Promise.resolve([]),
				totalRows: Promise.resolve(0),
				settings: {
					_routeId: '/admin/users',
					columnsOrder: [],
					currentPage: 0,
					filter: [],
					rowsPerPage: 10,
					sortDirection: 'asc',
					sortKey: '',
					isPaginateable: true
				}
			}
		});
		await waitFor(() =>
			expect(view.getByRole('dialog', { name: 'Create record' })).toBeInTheDocument()
		);
		const dialog = within(view.getByRole('dialog', { name: 'Create record' }));
		const input = dialog.getByRole('combobox', { name: 'roles' });
		expect(input.parentElement).toContainElement(
			dialog.getByRole('button', { name: 'Remove Employee' })
		);
		await fireEvent.click(input);
		await fireEvent.click(view.getByRole('option', { name: 'Manager' }));
		const form = dialog.getByRole('button', { name: 'Add' }).closest('form')!;
		expect(new FormData(form).getAll('roles')).toEqual(['employee', 'manager']);
		await fireEvent.click(dialog.getByRole('button', { name: 'Remove Employee' }));
		expect(new FormData(form).getAll('roles')).toEqual(['manager']);
	});
});
