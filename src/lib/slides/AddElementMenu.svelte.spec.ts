import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { subtleReveal } from 'sveltewind/transitions';
import AddElementMenu from './AddElementMenu.svelte';

vi.mock('sveltewind/transitions', () => ({ subtleReveal: vi.fn(() => ({ duration: 0 })) }));
const opened = new WeakSet<HTMLElement>();
beforeEach(() => {
	vi.clearAllMocks();
	vi.stubGlobal('CSS', { supports: () => false });
	vi.stubGlobal(
		'requestAnimationFrame',
		vi.fn(() => 1)
	);
	vi.stubGlobal('cancelAnimationFrame', vi.fn());
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
});
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
	Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
});

describe('Add element menu', () => {
	const tools = [
		{ type: 'text', label: 'Text' },
		{ type: 'image', label: 'Image / Graphic' },
		{ type: 'rectangle', label: 'Rectangle' }
	] as const;
	it('animates the popup itself, selects an element and restores focus to Add', async () => {
		const onAdd = vi.fn();
		const view = render(AddElementMenu, { tools, onAdd });
		const trigger = view.getByRole('button', { name: 'Add element' });
		expect(subtleReveal).not.toHaveBeenCalled();
		await fireEvent.click(trigger);
		const menu = view.getByRole('menu', { name: 'Add element' });
		expect(
			vi.mocked(subtleReveal).mock.calls.some(([element]) => element === menu.parentElement)
		).toBe(true);
		expect(view.getByRole('menuitem', { name: 'Text' })).toHaveFocus();
		await fireEvent.keyDown(menu, { key: 'ArrowDown' });
		const image = view.getByRole('menuitem', { name: 'Image / Graphic' });
		expect(image).toHaveFocus();
		await fireEvent.click(image);
		expect(onAdd).toHaveBeenCalledWith('image');
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		expect(trigger).toHaveFocus();
	});
	it('opens from the keyboard, supports typeahead and dismisses with Escape', async () => {
		const onAdd = vi.fn();
		const view = render(AddElementMenu, { tools, onAdd });
		const trigger = view.getByRole('button', { name: 'Add element' });
		await fireEvent.keyDown(trigger, { key: 'ArrowUp' });
		const menu = view.getByRole('menu');
		expect(view.getByRole('menuitem', { name: 'Rectangle' })).toHaveFocus();
		await fireEvent.keyDown(menu, { key: 't' });
		expect(view.getByRole('menuitem', { name: 'Text' })).toHaveFocus();
		await fireEvent.keyDown(menu, { key: 'Escape' });
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		expect(trigger).toHaveFocus();
		expect(onAdd).not.toHaveBeenCalled();
	});
});
