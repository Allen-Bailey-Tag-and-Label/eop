export class Base64Url {
	base64UrlString: string;

	constructor(base64UrlString: string) {
		this.base64UrlString = base64UrlString;
	}

	get to() {
		const self = this;
		return {
			uInt8Array(): Uint8Array {
				const padding = '='.repeat((4 - (self.base64UrlString.length % 4)) % 4);
				const base64 = (self.base64UrlString + padding).replace(/-/g, '+').replace(/_/g, '/');
				const rawData = atob(base64);
				const outputArray = new Uint8Array(rawData.length);
				for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
				return outputArray;
			}
		};
	}
}

export const base64Url = (base64UrlString: string) => new Base64Url(base64UrlString);
