import { theme } from 'sveltewind/stores';
import { sveltewind } from 'sveltewind/themes';

theme.set(sveltewind);

theme.set({
  form: 'space-y-8',
  inputGroup: 'space-y-4'
});
export { theme };
