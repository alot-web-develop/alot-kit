class OrderStore {
  isOpen = $state(false);
  open() { this.isOpen = true; }
  close() { this.isOpen = false; }
}
export { OrderStore };
