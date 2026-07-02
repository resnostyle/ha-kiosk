import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { entityStore } from './lib/ha/entities.svelte'

entityStore.ensureStarted()

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
