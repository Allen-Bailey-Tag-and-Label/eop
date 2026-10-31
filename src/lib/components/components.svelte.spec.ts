import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { twMerge } from 'tailwind-merge';
import { theme } from '$lib/theme';
import { defaultTheme } from '$lib/theme/themes';
import {
	A,
	Card,
	Checkbox,
	H1,
	H2,
	H3,
	Header,
	Label,
	P,
	Table,
	Tbody,
	Td,
	Th,
	Thead,
	Tr,
	Tabs
} from './index';
import Bindings from './fixtures/Bindings.svelte';
import DialogStandards from './fixtures/DialogStandards.svelte';
import Adapters from './fixtures/Adapters.svelte';
import { Button, Em, Form, Hr, Input, Li, Modal, Ol, Option, Spinner, Strong, Ul } from './index';
import { subtleReveal } from 'sveltewind/transitions';
import { enhance } from '$app/forms';

vi.mock('$app/forms', () => ({ enhance: vi.fn(() => ({ destroy: vi.fn() })) }));
// Exercise visibility changes without requiring jsdom to implement Web Animations.
vi.mock('sveltewind/transitions', () => ({ subtleReveal: vi.fn(() => ({ duration: 0 })) }));
// jsdom has no Web Animations API; binding tests do not need the checkmark animation.
vi.mock('svelte/transition', async (importOriginal) => ({
	...(await importOriginal<typeof import('svelte/transition')>()),
	scale: () => ({ duration: 0 })
}));

beforeEach(() => {
	vi.clearAllMocks();
	theme.set.theme(structuredClone(defaultTheme));
});
afterEach(() => {
	cleanup();
	theme.set.theme(structuredClone(defaultTheme));
});

describe('Sveltewind compatibility adapters', () => {
	it('keeps hidden checkbox inputs outside text-field theme sizing and anchors their focus target', async () => {
		const view = render(Checkbox, { label: 'Clip frame contents', checked: true });
		const input = view.getByRole('checkbox', { name: 'Clip frame contents' });
		expect(input).toHaveClass('sr-only');
		expect(input.closest('label')).toHaveClass('relative');
		theme.set.component('Input', { default: 'h-96 p-24' });
		await tick();
		expect(input).not.toHaveClass('h-96', 'p-24');
		input.focus();
		expect(input).toHaveFocus();
		await fireEvent.click(input);
		expect(input).not.toBeChecked();
	});
	it('reveals shared modals on opening and removes their focus targets on closing', async () => {
		const view = render(Modal, {
			isOpen: false,
			role: 'dialog',
			'aria-label': 'Test modal',
			children: textSnippet('Modal content')
		});
		expect(view.queryByRole('dialog')).toBeNull();
		await view.rerender({ isOpen: true });
		expect(view.getByRole('dialog', { name: 'Test modal' })).toHaveTextContent('Modal content');
		expect(subtleReveal).toHaveBeenCalled();
		await view.rerender({ isOpen: false });
		await tick();
		expect(view.queryByRole('dialog')).toBeNull();
	});
	it('dismisses only the nested dialog using outside clicks, X, Escape or its footer', async () => {
		const view = render(DialogStandards);
		const open = () => fireEvent.click(view.getByRole('button', { name: 'Open confirmation' }));
		await open();
		let confirmation = view.getByRole('dialog', { name: 'Confirmation' });
		expect(within(confirmation).getByRole('button', { name: 'Cancel' }).parentElement).toBe(
			within(confirmation).getByRole('button', { name: 'Confirm' }).parentElement
		);
		await fireEvent.click(confirmation.parentElement!);
		expect(view.queryByRole('dialog', { name: 'Confirmation' })).toBeNull();
		expect(view.getByRole('dialog', { name: 'Parent dialog' })).toBeInTheDocument();
		await open();
		confirmation = view.getByRole('dialog', { name: 'Confirmation' });
		await fireEvent.click(within(confirmation).getByRole('button', { name: 'Close dialog' }));
		expect(view.queryByRole('dialog', { name: 'Confirmation' })).toBeNull();
		await open();
		await fireEvent.keyDown(view.getByRole('dialog', { name: 'Confirmation' }), { key: 'Escape' });
		expect(view.queryByRole('dialog', { name: 'Confirmation' })).toBeNull();
		await open();
		await fireEvent.click(view.getByRole('button', { name: 'Cancel' }));
		expect(view.queryByRole('dialog', { name: 'Confirmation' })).toBeNull();
		await fireEvent.click(view.getByRole('button', { name: 'Done' }));
		expect(view.queryByRole('dialog')).toBeNull();
	});

	it('keeps full-width color fields styled like standard inputs with a reactive swatch', async () => {
		const view = render(Input, { type: 'color', 'aria-label': 'Choose color', value: '#123456' });
		const input = view.getByLabelText('Choose color');
		expect(input).toHaveAttribute('type', 'color');
		expect(input).toHaveClass('h-12', 'w-full', 'rounded-lg', 'px-6', 'py-3');
		expect(input).toHaveValue('#123456');
		await fireEvent.input(input, { target: { value: '#abcdef' } });
		expect(input).toHaveValue('#abcdef');
		await view.rerender({ value: '#654321' });
		expect(input).toHaveValue('#654321');
	});
	it('defaults buttons to button and preserves disabled styles and overrides', async () => {
		const target = document.createElement('form');
		const submit = vi.fn((event: Event) => event.preventDefault());
		target.addEventListener('submit', submit);
		const { getByRole } = render(Button, { target, props: { children: textSnippet('Action') } });
		await fireEvent.click(getByRole('button'));
		expect(submit).not.toHaveBeenCalled();
		expect(getByRole('button')).toHaveAttribute('type', 'button');
		const disabled = render(Button, { disabled: true, variants: ['secondary'], class: 'px-2' });
		expect(disabled.container.querySelector('button')).toBeDisabled();
		expect(disabled.container.querySelector('button')).toHaveAttribute(
			'class',
			twMerge(
				defaultTheme.Button.default,
				defaultTheme.Button.secondary,
				defaultTheme.Button.disabled,
				'px-2'
			)
		);
		const explicit = render(Button, { type: 'submit' });
		expect(explicit.container.querySelector('button')).toHaveAttribute('type', 'submit');
	});

	it.each([
		['Em', Em, 'em'],
		['Hr', Hr, 'hr'],
		['Li', Li, 'li'],
		['Ol', Ol, 'ol'],
		['Strong', Strong, 'strong'],
		['Ul', Ul, 'ul']
	] as const)('%s forwards legacy attachments to the actual element', (name, Component, tag) => {
		const attach = vi.fn<(element: Element) => void>();
		const { container } = render(Component, {
			attachments: [attach],
			class: 'px-2',
			style: 'color: red'
		});
		const element = container.querySelector(tag);
		expect(attach).toHaveBeenCalledWith(element);
		expect(element).toHaveAttribute('class', twMerge(defaultTheme[name].default, 'px-2'));
		expect(element).toHaveStyle({ color: 'rgb(255, 0, 0)' });
	});

	it('preserves input, checkbox, radio, numeric select, textarea, and editor bindings', async () => {
		const { component, container, getByTestId } = render(Adapters);
		const input = container.querySelector('input[name="employee"]')!;
		expect(component.values().input).toBe(input);
		expect(component.values().button).toBe(container.querySelector('button'));
		expect(container.querySelector('label')?.textContent).toBe('Employee');
		await fireEvent.input(input, { target: { value: 'New employee' } });
		expect(component.values().text).toBe('New employee');
		await fireEvent.click(container.querySelector('input[type="checkbox"]')!);
		expect(component.values().checked).toBe(true);
		await fireEvent.click(container.querySelector('input[type="radio"][value="b"]')!);
		expect(component.values().group).toBe('b');
		const select = container.querySelector('select')!;
		select.selectedIndex = 1;
		await fireEvent.change(select);
		expect(component.values().selected).toBe(2);
		await fireEvent.input(container.querySelector('textarea')!, {
			target: { value: 'Updated notes' }
		});
		expect(component.values().notes).toBe('Updated notes');
		const editor = getByTestId('editor');
		expect(editor.innerHTML).toBe('<b>Initial</b>');
		editor.innerHTML = '<i>Edited</i>';
		await fireEvent.input(editor);
		expect(component.values().html).toBe('<i>Edited</i>');
	});

	it('preserves modal opening, cancel, and backdrop dismissal through the open prop', async () => {
		const prototype = HTMLDialogElement.prototype;
		const originalShow = Object.getOwnPropertyDescriptor(prototype, 'showModal');
		const originalClose = Object.getOwnPropertyDescriptor(prototype, 'close');
		const showModal = vi.fn(function (this: HTMLDialogElement) {
			this.setAttribute('open', '');
		});
		const close = vi.fn(function (this: HTMLDialogElement) {
			this.removeAttribute('open');
		});
		Object.defineProperties(prototype, {
			showModal: { configurable: true, value: showModal },
			close: { configurable: true, value: close }
		});
		try {
			const oncancel = vi.fn();
			const onclose = vi.fn();
			const { component, container } = render(Adapters, { oncancel, onclose });
			component.showDialog();
			await tick();
			expect(showModal).toHaveBeenCalled();
			expect(subtleReveal).toHaveBeenCalled();
			const dialog = container.querySelector('dialog')!;
			expect(dialog).toHaveAttribute('class', twMerge(defaultTheme.Dialog.default));
			expect(dialog.querySelector('.pointer-events-auto')).not.toBeNull();
			await fireEvent(dialog, new Event('close'));
			expect(onclose).toHaveBeenCalledOnce();
			expect(component.values().open).toBe(false);
			component.showDialog();
			await tick();
			await fireEvent(
				container.querySelector('dialog')!,
				new Event('cancel', { cancelable: true })
			);
			expect(oncancel).toHaveBeenCalledOnce();
			expect(component.values().open).toBe(false);
			component.showDialog();
			await tick();
			await fireEvent.click(container.querySelector('dialog')!);
			expect(component.values().open).toBe(false);
		} finally {
			cleanup();
			if (originalShow) Object.defineProperty(prototype, 'showModal', originalShow);
			else Reflect.deleteProperty(prototype, 'showModal');
			if (originalClose) Object.defineProperty(prototype, 'close', originalClose);
			else Reflect.deleteProperty(prototype, 'close');
		}
	});

	it('enhances POST forms on the native form and leaves GET forms unenhanced', () => {
		const submitFunction = vi.fn();
		const post = render(Form, {
			submitFunction,
			inputs: textSnippet('Inputs'),
			buttons: textSnippet('Buttons')
		});
		expect(enhance).toHaveBeenCalledWith(post.container.querySelector('form'), submitFunction);
		expect(post.container.querySelector('form')).toHaveAttribute('method', 'post');
		expect(post.container.textContent).toContain('Inputs');
		expect(post.container.textContent).toContain('Buttons');
		vi.mocked(enhance).mockClear();
		render(Form, { method: 'GET' });
		expect(enhance).not.toHaveBeenCalled();
	});

	it('preserves explicit option values and the existing empty default', () => {
		const explicit = render(Option, { value: 2, children: textSnippet('Two') });
		expect(explicit.container.querySelector('option')).toHaveValue('2');
		const implicit = render(Option, { children: textSnippet('Employee') });
		expect(implicit.container.querySelector('option')).toHaveValue('');
	});

	it('preserves custom spinner animation durations and caps', () => {
		const { container } = render(Spinner, { dur: ['3s', '4s'] });
		expect(container.querySelector('animate')).toHaveAttribute('dur', '3s');
		expect(container.querySelector('animateTransform')).toHaveAttribute('dur', '4s');
		expect(container.querySelector('circle')).toHaveAttribute('stroke-linecap', 'round');
		expect(container.querySelector('svg')).toHaveAttribute('class', defaultTheme.Spinner.default);
	});
});

function textSnippet(text: string) {
	return createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));
}

describe('migrated application primitives', () => {
	it('preserves Tabs container classes and native attributes', () => {
		const view = render(Tabs, {
			id: 'tabs',
			title: 'Editor sections',
			class: 'px-2 text-red-500'
		});
		const element = view.getByRole('tablist');
		expect(element.localName).toBe('div');
		expect(element).toHaveAttribute('id', 'tabs');
		expect(element).toHaveAttribute('title', 'Editor sections');
		expect(element).toHaveAttribute(
			'class',
			twMerge(defaultTheme.Tabs.default, 'px-2 text-red-500')
		);
	});

	it('uses application button styles and keyboard selection without submitting a form', async () => {
		const onValueChange = vi.fn();
		const view = render(Tabs, {
			'aria-label': 'Editor sections',
			value: 'edit',
			tabs: [
				{ title: 'Edit', value: 'edit' },
				{ title: 'Unavailable', value: 'disabled', disabled: true },
				{ title: 'View', value: 'view' }
			],
			onValueChange
		});
		const edit = view.getByRole('tab', { name: 'Edit' });
		const preview = view.getByRole('tab', { name: 'View' });
		expect(view.getByRole('tablist', { name: 'Editor sections' })).toBeInTheDocument();
		expect(edit).toHaveAttribute('type', 'button');
		expect(edit).toHaveAttribute('aria-selected', 'true');
		expect(edit).toHaveClass('text-white', 'bg-primary-500/90', 'dark:bg-primary-500/70');
		expect(preview).toHaveClass('text-current', 'bg-transparent', 'dark:bg-transparent');
		expect(preview).toHaveAttribute('tabindex', '-1');
		expect(view.getByRole('tab', { name: 'Unavailable' })).toBeDisabled();
		await fireEvent.keyDown(edit, { key: 'ArrowRight' });
		expect(preview).toHaveFocus();
		expect(preview).toHaveAttribute('aria-selected', 'true');
		expect(preview).toHaveClass('text-white');
		expect(onValueChange).toHaveBeenLastCalledWith('view');
		await fireEvent.keyDown(preview, { key: 'Home' });
		expect(edit).toHaveFocus();
		await fireEvent.keyDown(edit, { key: 'End' });
		expect(preview).toHaveFocus();
		await fireEvent.keyDown(preview, { key: 'ArrowRight' });
		expect(edit).toHaveFocus();
		await fireEvent.click(preview);
		expect(preview).toHaveAttribute('aria-selected', 'true');
	});

	const cases = [
		['A', A, 'a'],
		['Card', Card, 'div'],
		['H1', H1, 'h1'],
		['H2', H2, 'h2'],
		['H3', H3, 'h3'],
		['Header', Header, 'header'],
		['Label', Label, 'label'],
		['P', P, 'p'],
		['Table', Table, 'table'],
		['Tbody', Tbody, 'tbody'],
		['Td', Td, 'td'],
		['Th', Th, 'th'],
		['Thead', Thead, 'thead'],
		['Tr', Tr, 'tr']
	] as const;

	it.each(cases)(
		'%s preserves the HTML element and application classes',
		(name, Component, tag) => {
			const { container } = render(Component, {
				id: 'migrated',
				title: 'Preserved attribute',
				class: 'px-2 text-red-500'
			});
			const element = container.querySelector('#migrated');
			expect(element?.localName).toBe(tag);
			expect(element).toHaveAttribute('title', 'Preserved attribute');
			expect(element).toHaveAttribute(
				'class',
				twMerge(defaultTheme[name].default, 'px-2 text-red-500')
			);
		}
	);

	it('preserves link attributes, snippets, and event handlers', async () => {
		const onclick = vi.fn((event: MouseEvent) => event.preventDefault());
		const children = createRawSnippet(() => ({ render: () => '<span>Open portal</span>' }));
		const { getByRole } = render(A, {
			props: { href: '/portal', target: '_blank', children, onclick }
		});
		const link = getByRole('link', { name: 'Open portal' });
		expect(link).toHaveAttribute('href', '/portal');
		expect(link).toHaveAttribute('target', '_blank');
		await fireEvent.click(link);
		expect(onclick).toHaveBeenCalledOnce();
	});

	it('preserves label associations and table cell spans', () => {
		const label = render(Label, { for: 'employee' });
		expect(label.container.querySelector('label')).toHaveAttribute('for', 'employee');
		const cell = render(Td, { colspan: 3 });
		expect(cell.container.querySelector('td')).toHaveAttribute('colspan', '3');
	});

	it('keeps existing element bindings', () => {
		const { component, container } = render(Bindings);
		expect(component.elements().card).toBe(container.querySelector('#bound-card'));
		expect(component.elements().link).toBe(container.querySelector('#bound-link'));
	});

	it('does not inherit local Div styling in a Card', async () => {
		const { container } = render(Card);
		theme.set.component('Div', { default: 'p-24' });
		await tick();
		expect(container.querySelector('div')).toHaveAttribute('class', defaultTheme.Card.default);
	});

	it('reacts to application theme and variant changes without inheriting preset styles', async () => {
		const { container } = render(H1, { variants: ['accent'], class: 'px-2' });
		theme.set.component('H1', { default: 'px-6 text-sm', accent: 'text-blue-500' });
		await tick();
		expect(container.querySelector('h1')).toHaveAttribute('class', 'text-sm text-blue-500 px-2');
		theme.update.variant('H1', 'accent', 'text-green-500');
		await tick();
		expect(container.querySelector('h1')).toHaveAttribute('class', 'text-sm text-green-500 px-2');
	});
});
