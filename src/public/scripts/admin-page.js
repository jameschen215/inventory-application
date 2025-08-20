document.addEventListener('DOMContentLoaded', () => {
  const cancelBtn = document.querySelector('#admin-form-cancel-btn');

  if (cancelBtn) {
    document.addEventListener('keydown', (ev) => {
      ev.preventDefault();

      if (ev.key === 'Escape') {
        window.location.href = new URL(cancelBtn.href);
      }
    });
  }
});
