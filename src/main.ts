import { mount } from 'svelte';
import './ui/theme/fonts.css';
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
