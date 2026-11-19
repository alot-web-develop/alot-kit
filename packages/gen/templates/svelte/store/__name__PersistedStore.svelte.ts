import { onMount } from 'svelte';

class __Name__Store {
  #isOpen = $state(false);
  get isOpen() { return this.#isOpen; }
  set isOpen(value: boolean) { this.#isOpen = value; this.#persist(); }
  #key: string;
  #ready = false;

  constructor(key = '__name-kebab__') {
    this.#key = key;
    onMount(() => {
      try {
        const saved: unknown = JSON.parse(localStorage.getItem(this.#key) ?? 'null');
        if (typeof saved === 'object' && saved !== null && 'isOpen' in saved && typeof saved.isOpen === 'boolean') this.#isOpen = saved.isOpen;
      } catch {}
      this.#ready = true;
    });
  }

  open() { this.isOpen = true; }
  close() { this.isOpen = false; }
  #persist() {
    if (!this.#ready) return;
    try { localStorage.setItem(this.#key, JSON.stringify({ isOpen: this.isOpen })); } catch {}
  }
}

export { __Name__Store };
