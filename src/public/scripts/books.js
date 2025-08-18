// In your common/shared JS file
(() => {
  // Cleanup draft when form is successfully submitted
  if (new URLSearchParams(window.location.search).get('submitted') === 'true') {
    this.sessionStorage.removeItem('bookFormDraft');
    console.log('Form submitted successfully!');

    // Optionally, remove the query param from the URL without reload:
    const url = new URL(this.window.location);
    url.searchParams.delete('submitted');
    this.window.history.replaceState({}, '', url);
  }
})();

// Enhanced keyboard navigation for table rows
function handleRowKeydown(event, row) {
  const key = event.key;
  const rows = Array.from(document.querySelectorAll('tbody tr[tabindex="0"]'));
  const currentIndex = rows.indexOf(row);

  switch (key) {
    case 'Enter':
    case ' ':
      event.preventDefault();
      navigateToBook(row);
      break;

    case 'ArrowDown':
      event.preventDefault();
      if (currentIndex < rows.length - 1) {
        rows[currentIndex + 1].focus();
      }
      break;

    case 'ArrowUp':
      event.preventDefault();
      if (currentIndex > 0) {
        rows[currentIndex - 1].focus();
      }
      break;

    case 'Home':
      event.preventDefault();
      if (rows.length > 0) {
        rows[0].focus();
      }
      break;

    case 'End':
      event.preventDefault();
      if (rows.length > 0) {
        rows[rows.length - 1].focus();
      }
      break;
  }
}

// Navigate to book details
function navigateToBook(row) {
  const href = row.getAttribute('data-href');

  if (href) {
    // Announce navigation to screen reader
    const liveRegion =
      document.querySelector('#live-region') || createLiveRegion();
    liveRegion.textContent = 'Navigating to book details';

    window.location.href = href;
  }
}

// Create live region if it doesn't exist
function createLiveRegion() {
  const liveRegion = document.createElement('div');
  liveRegion.id = 'live-region';
  liveRegion.className = 'sr-only';
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  document.body.appendChild(liveRegion);
  return liveRegion;
}

// Initialize table accessibility features
document.addEventListener('DOMContentLoaded', function () {
  // Add event listeners to book rows
  const bookRows = document.querySelectorAll('tr[data-book-row="true"]');
  bookRows.forEach((row) => {
    // Click handler
    row.addEventListener('click', function () {
      navigateToBook(this);
    });

    // Keyboard handler
    row.addEventListener('keydown', function (event) {
      handleRowKeydown(event, this);
    });
  });
});
