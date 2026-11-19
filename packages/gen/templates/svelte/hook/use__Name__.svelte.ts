const use__Name__ = () => {
  let isOpen = $state(false);
  return {
    get isOpen() { return isOpen; },
    open: () => { isOpen = true; },
    close: () => { isOpen = false; },
  };
};
export { use__Name__ };
