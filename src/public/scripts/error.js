document.addEventListener('DOMContentLoaded', () => {
  const backBtn = document.querySelector('#back-btn-on-error');

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      console.log('clicked');
      window.history.back();
    });
  }
});
