export const componentData: Record<string, { children?: any; props?: Record<string, any> }> = {
	A: {
		children: 'Link',
		props: {
			href: '#'
		}
	},
	Button: {
		children: 'Button',
		props: {
			class: 'w-auto'
		}
	},
	Card: {
		children: 'Card component'
	},
	Checkbox: {},
	Datatable: {
		props: {
			columns: ['column1', 'column2', 'column3'],
			rows: [
				{ column1: 'Value 1', column2: 'Value 2', column3: 'Value 3' },
				{ column1: 'Value 1', column2: 'Value 2', column3: 'Value 3' },
				{ column1: 'Value 1', column2: 'Value 2', column3: 'Value 3' }
			]
		}
	},
	Div: {
		children: 'Here is a Div'
	},
	H1: { children: 'H1 Text' },
	H2: { children: 'H2 Text' },
	Header: { children: 'Test' },
	Input: { props: { value: 'Value' } },
	Label: { children: 'Label' },
	MultiSelect: {
		props: {
			options: [
				{ label: 'Option 1', value: 0 },
				{ label: 'Option 2', value: 1 },
				{ label: 'Option 3', value: 2 }
			],
			value: [0, 1]
		}
	},
	P: {
		children: 'This is a paragraph'
	},
	RangeInput: {
		props: {
			min: '0',
			max: '100',
			value: '50'
		}
	},
	Select: {
		props: {
			options: [
				{ label: 'Option 1', value: 0 },
				{ label: 'Option 2', value: 1 },
				{ label: 'Option 3', value: 2 }
			],
			value: 1
		}
	},
	Spinner: {}
};
