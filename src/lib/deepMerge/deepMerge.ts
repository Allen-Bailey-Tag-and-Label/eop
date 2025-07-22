import { is } from '$lib/is';

export const deepMerge = <T extends object, U extends object>(target: T, source: U) => {
    const result = structuredClone(target);

    for (const key in source) {
        if (is.object(source[key])) {
            if (key in result) (result as any)[key] = deepMerge((result as any)[key], (source as any)[key]);
            if (!(key in result)) (result as any)[key] = source[key];
        } else {
            (result as any)[key] = source[key];
        }
    }

    return result;
}