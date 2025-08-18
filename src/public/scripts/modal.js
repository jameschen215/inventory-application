const DEBOUNCE_TIME = 300;
const RESULT_ICON = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-text-search-icon lucide-text-search w-full h-full"><path d="M21 6H3"/><path d="M10 12H3"/><path d="M10 18H3"/><circle cx="17" cy="15" r="3"/><path d="m21 19-1.9-1.9"/></svg>
`;
const ARROW_ICON = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right-icon lucide-chevron-right w-full h-full"><path d="m9 18 6-6-6-6"/></svg>
`;

document.addEventListener('DOMContentLoaded', () => {
  const searchButton = document.querySelector('header #search-btn');
  const modal = document.querySelector('#modal');
  const searchInput = modal.querySelector('form #search');
  const cancelButton = modal.querySelector('#cancel-btn');
  const resultsContainer = modal.querySelector('#results');

  // Modal controls
  function showModal() {
    document.querySelector('aside').setAttribute('inert', '');
    document.querySelector('main').setAttribute('inert', '');

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    requestAnimationFrame(() => searchInput.focus());

    document.addEventListener('keydown', handleKeyboardInput);
  }

  function hideModal() {
    document.querySelector('aside').removeAttribute('inert');
    document.querySelector('main').removeAttribute('inert');

    modal.classList.remove('flex');
    modal.classList.add('hidden');

    document.removeEventListener('keydown', handleKeyboardInput);
  }

  function handleKeyboardInput(event) {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        hideModal();
        break;
      case 'Enter':
      case ' ':
        // Only prevent Enter if user is typing in the search input
        if (event.target.matches('#search')) {
          if (event.key === 'Enter') {
            event.preventDefault();
          }
        } else {
          // Handle Enter/Space on search result items
          event.preventDefault();
          event.target.click(); // This will trigger the link or button
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        navigateResults(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        navigateResults(-1);
      default:
        break;
    }
  }

  // Event binding
  // Show modal and focus in search input
  if (searchButton && modal) {
    searchButton.addEventListener('click', showModal);
  }

  // Hide modal by clicking button
  if (cancelButton) {
    cancelButton.addEventListener('click', hideModal);
  }

  // Hide modal by clicking on backdrop
  if (modal) {
    modal.addEventListener('click', function (event) {
      if (event.target === this) {
        hideModal();
      }
    });
  }

  // Handle input
  if (searchInput) {
    resultsContainer.innerHTML = `<p class="text-zinc-400 mt-10 font-light">No searches</p>`;

    searchInput.addEventListener(
      'input',
      debounce(getResultsAndRender, DEBOUNCE_TIME),
    );
  }

  // Helpers
  function debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function highlightMatch(text, query) {
    const re = new RegExp(`${query}`, 'gi');
    return text.replace(
      re,
      (match) =>
        `<mark class="group-hover:!text-zinc-50 group-focus:!text-zinc-50 bg-transparent text-blue-500 underline underline-offset-1 transition-colors">${match}</mark>`,
    );
  }

  async function getResultsAndRender(event) {
    const query = event.target.value.trim();

    if (!query) {
      resultsContainer.innerHTML = `<p class="text-zinc-400 mt-10 font-light">No searches</p>`;
      return;
    }

    try {
      const res = await fetch(`/search?q=${encodeURIComponent(query)}`);
      const results = await res.json();

      renderResults(query, results);
    } catch (error) {
      console.log(error);
    }

    function renderResults(query, results) {
      // Empty results container at every typing
      resultsContainer.innerHTML = '';

      // No results
      if (Object.keys(results).length === 0) {
        resultsContainer.innerHTML = `<p class="text-zinc-400 mt-10 font-light">No results for "<span class='text-zinc-600 font-bold'>${query}</span>"</p>`;
        return;
      }

      // Render results
      Object.entries(results).map(([type, items]) => {
        if (items.length === 0) return;

        // Group
        const groupId = `group-${type}`;
        const typeGroup = document.createElement('div');
        typeGroup.id = groupId;
        typeGroup.className = 'w-full';

        // Heading
        const heading = document.createElement('h3');
        heading.className = 'mb-4 capitalize text-base font-semibold';
        heading.textContent = type;
        typeGroup.appendChild(heading);

        // Items container
        const ul = document.createElement('ul');
        ul.setAttribute('aria-labeledBy', groupId);
        ul.className = 'w-full flex flex-col gap-2';

        // Items
        items.forEach((item) => {
          const li = document.createElement('li');
          const a = document.createElement('a');

          const href =
            type === 'author' || type === 'book'
              ? `/${type}s/${item.id}`
              : `/${type}s/${item.id}/books`;

          a.href = href;
          a.className =
            'group flex items-center gap-5 px-4 py-2 bg-zinc-100 rounded-sm text-zinc-800 hover:text-zinc-50 hover:bg-blue-500 focus:text-zinc-50 focus:bg-blue-500 transition-colors';

          // Content of a
          const firstIcon = document.createElement('span');
          firstIcon.className = 'size-6';
          firstIcon.ariaHidden = 'true';
          firstIcon.innerHTML = RESULT_ICON;

          const text = document.createElement('span');
          text.innerHTML = highlightMatch(item.name, query);

          const secondIcon = document.createElement('span');
          secondIcon.className = 'size-5 ml-auto';
          secondIcon.ariaHidden = 'true';
          secondIcon.innerHTML = ARROW_ICON;

          a.appendChild(firstIcon);
          a.appendChild(text);
          a.appendChild(secondIcon);

          li.appendChild(a);
          ul.appendChild(li);

          typeGroup.appendChild(ul);
          resultsContainer.appendChild(typeGroup);
        });
      });
    }
  }

  function navigateResults(direction) {
    const results = document.querySelectorAll('#results li a');

    if (results.length === 0) return;

    const currentFocus = document.activeElement;
    let nextIndex;

    if (currentFocus === searchInput) {
      if (direction === 1) {
        // Down from the search input - go to the first result
        nextIndex = 0;
      } else {
        // Up from the search input - go to the last result
        nextIndex = results.length - 1;
      }
    } else {
      const currentIndex = Array.from(results).indexOf(currentFocus);

      if (currentIndex === -1) {
        // Not on a result item, default to first
        nextIndex = 0;
      } else {
        nextIndex = currentIndex + direction;

        if (nextIndex < 0) {
          // Moving up from the first result - go back to the search input
          searchInput.focus();
          return;
        } else if (nextIndex >= results.length) {
          // Moving down from the last result - wrap to search input
          searchInput.focus();
          return;
        }
      }
    }

    // Focus on proper item
    results[nextIndex].focus();
  }
});
