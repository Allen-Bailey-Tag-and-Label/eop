export const camelCase = (string:string) => {
    return string.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, wordIndex) => {
        return wordIndex == 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
}