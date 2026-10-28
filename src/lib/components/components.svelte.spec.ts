import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { twMerge } from 'tailwind-merge';
import { theme } from '$lib/theme';
import { defaultTheme } from '$lib/theme/themes';
import { A, Card, H1, H2, H3, Header, Label, P, Table, Tbody, Td, Th, Thead, Tr } from './index';
import Bindings from './fixtures/Bindings.svelte';
import Adapters from './fixtures/Adapters.svelte';
import { Button, Em, Form, Hr, Li, Ol, Option, Spinner, Strong, Ul } from './index';
import { enhance } from '$app/forms';

vi.mock('$app/forms', () => ({ enhance: vi.fn(() => ({ destroy: vi.fn() })) }));
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
