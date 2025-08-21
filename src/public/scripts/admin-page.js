import { focusInput } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
  const passwordInput = document.querySelector('#password');
  const cancelBtn = document.querySelector('#admin-form-cancel-btn');

  if (passwordInput) {
    focusInput(passwordInput);
  }

  if (cancelBtn) {
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        window.location.href = cancelBtn.href;
      }
    });
  }
});
