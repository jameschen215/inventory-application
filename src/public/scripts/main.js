export function focusInput(inputEl, delay = 200) {
  if (!inputEl) return;

  setTimeout(() => {
    inputEl.focus({ preventScroll: true });

    // iOS Safari hack: show cursor
    try {
      const len = inputEl.value.length;
      inputEl.setSelectionRange(len, len);
    } catch (error) {
      console.log(error);
    }

    // Ensure it’s visible (not hidden by keyboard)
    inputEl.scrollIntoView({ block: 'center' });
  }, delay);
}
