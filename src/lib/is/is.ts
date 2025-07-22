import { date } from './date';
import { object } from './object';

class Is {
	get date() {
		return (value: unknown): boolean => date(value);
	}
	get object() {
		return (value: unknown): boolean => object(value);
	}
}

export const is = new Is();
