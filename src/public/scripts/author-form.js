// Character counter for biography

const bioTextarea = document.querySelector('#bio');
const bioCounter = document.querySelector('#bio-count');

if (bioTextarea && bioCounter) {
  function updateCounter() {
    const count = bioTextarea.value.length;
    bioCounter.textContent = count;

    // Change color when approaching limit
    const counterElement = bioCounter.parentElement;

    if (count > 900) {
      counterElement.classList.remove('text-zinc-400', 'text-yellow-500');
      counterElement.classList.add('text-red-500');
    } else if (count > 800) {
      counterElement.classList.add('text-yellow-500');
      counterElement.classList.remove('text-zinc-400', 'text-red-500');
    } else {
      counterElement.classList.remove('text-yellow-400', 'text-red-500');
      counterElement.classList.add('text-zinc-400');
    }
  }

  // Update counter on page load and input
  updateCounter();
  bioTextarea.addEventListener('input', updateCounter);
}
