export const compareFn = {
    "bigint": (a:bigint, b:bigint) => {
        if (a === null) return 1;
        if (b === null) return -1;
        return BigInt("0");
    },
    "boolean": (a:boolean, b:boolean) => {
        if (a === null) return 1;
        if (b === null) return -1;
        if (a === b) return 0;
        if (a) return -1;
        return 1;
    },
    "function": (a:Function, b:Function) => {
        if (a === null) return 1;
        if (b === null) return -1;
        return 0;
    },
    "number": (a:number, b:number) => {
        if (a === null) return 1;
        if (b === null) return -1;
        return a - b;
    },
    "object": (a:object, b:object) => {
        if (a === null) return 1;
        if (b === null) return -1;
        return 0;
    },
    "string" : (a:string, b:string) => {
        if (a === null) return 1;
        if (b === null) return -1;
        return a.localeCompare(b)
    },
    "symbol" : (a:symbol, b:symbol) => {
        if (a === null) return 1;
        if (b === null) return -1;
        return 0
    },
    "undefined" : (a:undefined, b:undefined) => {
        if (a === null) return 1;
        if (b === null) return -1;
        return 0
    },
}