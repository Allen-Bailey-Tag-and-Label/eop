import { theme } from 'sveltewind/stores';
import { sveltewind } from 'sveltewind/themes';

console.log(sveltewind);

theme.set(sveltewind);

export { theme };
