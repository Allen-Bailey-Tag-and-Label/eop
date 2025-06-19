import type { Attachment } from 'svelte/attachments';

export const attachmentFactory = (attachmentArray: Attachment[]) => {
	return (element: Element) => {
		for (let attachmentIndex = 0; attachmentIndex < attachmentArray.length; attachmentIndex++) {
			const attachment = attachmentArray[attachmentIndex];
			attachment(element);
		}
	};
};
