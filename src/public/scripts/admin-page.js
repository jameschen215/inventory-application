document.addEventListener('DOMContentLoaded', () => {
  const cancelBtn = document.querySelector('#admin-form-cancel-btn');

  if (cancelBtn) {
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        window.location.href = cancelBtn.href;
      }
    });
  }
});
