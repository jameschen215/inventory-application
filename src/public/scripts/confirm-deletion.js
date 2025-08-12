// Get element helper
function getElementByText(tag, text) {
  const lowerText = text.toLowerCase();
  const tags = Array.from(document.querySelectorAll(tag)).filter((el) =>
    el.textContent.toLowerCase().includes(lowerText),
  );

  if (tags.length === 0) return null;

  return tags[0];
}

// Auto-focus on cancel button for better UX
document.addEventListener('DOMContentLoaded', () => {
  const cancelButton = getElementByText('a', 'Cancel');

  if (cancelButton) {
    cancelButton.focus();
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (ev) => {
  // Escape key cancels
  if (ev.key === 'Escape') {
    ev.preventDefault(); // stop browser from removing focus

    const cancelButton = getElementByText('a', 'Cancel');

    if (cancelButton) {
      window.location.href = cancelButton.href;
    }
  }
});
