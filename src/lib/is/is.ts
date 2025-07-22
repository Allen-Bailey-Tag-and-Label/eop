import { object } from './object';

class Is {
    get object() {
        return (value: unknown): boolean => object(value)
    }
}

export const is = new Is();