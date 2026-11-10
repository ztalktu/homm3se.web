import { mount } from 'svelte';
import '@fontsource/cinzel/500.css';
// Cinzel has no Cyrillic; Forum covers the Russian headings in a similar classical style.
import '@fontsource/forum/cyrillic-400.css';
import './ui/theme/tokens.css';
import './ui/theme/base.css';
import App from './App.svelte';

const target = document.getElementById('app');
if (!target) {
  throw new Error('Root element #app is missing');
}
// index.html ships a static description for search engines; the app takes its place.
target.replaceChildren();

export default mount(App, { target });
