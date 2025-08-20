const COVER_PREVIEW_TIMEOUT = 1000; // Wait 1 second after user stops typing
const AUTO_SAVE_TIMEOUT = 2000; // Save draft 2 seconds after user stops typing
const SHOW_INDICATOR_TIMEOUT = 3000;

document.addEventListener('DOMContentLoaded', function () {
  const form = document.querySelector('#book-form');
  if (!form) return;

  // Load draft on page load
  loadDraft();

  const clearDraftButton = document.querySelector('#clear-draft-btn');
  if (clearDraftButton) {
    clearDraftButton.addEventListener('click', function () {
      clearDraft(this);
    });
  }

  // Focus the first input
  const titleInput = form.querySelector('#title');
  if (titleInput) {
    titleInput.focus();
  }

  // Server-side validation
  validateSchema();

  // Real-time client-side validation for all fields
  const allFields = form.querySelectorAll('input, textarea');
  allFields.forEach((field) => {
    field.addEventListener('blur', function () {
      validateField(this);
    });

    field.addEventListener('input', function () {
      // Clear error styling when user starts typing
      this.classList.remove(
        'border-red-500',
        'bg-red-50',
        'focus:ring-red-200',
      );

      this.classList.add(
        'border-zinc-300',
        'focus:border-blue-500',
        'focus:ring-blue-200',
      );

      // Remove error message if it exists
      const existingErrorMsg = this.parentNode.querySelector('[id$=-error]');
      const helpInfoElement = this.parentNode.querySelector('[id$=-help]');

      if (existingErrorMsg && this.value.trim()) {
        existingErrorMsg.style.display = 'none';

        if (helpInfoElement) {
          helpInfoElement.style.display = 'block';
        }
      }
    });
  });

  // Form submission handling
  form.addEventListener('submit', function (ev) {
    let isValid = true;

    allFields.forEach((field) => {
      if (!validateField(field)) {
        isValid = false;
      }
    });

    if (!isValid) {
      ev.preventDefault();

      const firstError = form.querySelector('.border-red-500');

      if (firstError) {
        firstError.focus();
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Show error summary
      showErrorSummary();
    }
  });

  // Cover URL preview
  const coverUrlInput = document.querySelector('#cover_url');

  if (coverUrlInput) {
    let previewTimeout;

    coverUrlInput.addEventListener('input', function () {
      clearTimeout(previewTimeout);

      previewTimeout = setTimeout(() => {
        showCoverPreview(this.value);
      }, COVER_PREVIEW_TIMEOUT);
    });
  }

  // Auto-save draft functionality (optional - stores in sessionStorage)
  let autoSaveTimeout;
  const formInputs = form.querySelectorAll('input, textarea');

  formInputs.forEach((input) => {
    input.addEventListener('input', function () {
      clearTimeout(autoSaveTimeout);

      autoSaveTimeout = setTimeout(() => {
        saveDraft();
      }, AUTO_SAVE_TIMEOUT);
    });
  });

  // Handle cancel
  form.querySelector('#cancel-btn').addEventListener('click', handleCancel);
});

// Handle keyboard input
document.addEventListener('keydown', (ev) => {
  const bookForm = document.querySelector('#book-form');
  if (!bookForm) return;

  if (ev.key === 'Escape') {
    ev.preventDefault();

    handleCancel();
  }
});

/**
 * ------------------ Functions ------------------
 */

function handleCancel() {
  const hasChanges = checkForChanges();

  // if (hasChanges) {
  //   const message =
  //     'You have unsaved changes. Are you sure you want to leave without saving?';

  //   if (!confirm(message)) return;
  // }

  // Navigate to cancel path
  const cancelPathElement = document.querySelector('#cancel-path');
  const cancelPath = cancelPathElement
    ? JSON.parse(cancelPathElement.textContent)
    : {};

  window.location.href = `/admin?redirect=${encodeURIComponent(cancelPath)}`;
}

function checkForChanges() {
  const form = document.querySelector('#book-form');
  const formData = new FormData(form);
  const originalDataElement = document.querySelector('#original-data');
  const originalData = originalDataElement
    ? JSON.parse(originalDataElement.textContent)
    : {};

  for (let [key, value] of formData.entries()) {
    if (key === 'genres') continue;

    if (
      originalData[key] !== value &&
      !(originalData[key] === undefined && value === '')
    ) {
      return true;
    }
  }

  return false;
}

function showErrorMessage(field, isValid, errorMessage) {
  if (field.name === 'genres') {
    // Remove previous error styling
    field.parentNode.parentNode.classList.remove('border-red-500', 'bg-red-50');

    // Remove any existing error message
    const existingError =
      field.parentNode.parentNode.querySelector('[id$=-error]');
    if (existingError) {
      existingError.remove();
    }

    // Apply error styling and message if invalid
    if (!isValid) {
      field.parentNode.parentNode.classList.remove(
        'border-zinc-300',
        'focus:border-blue-500',
        'focus:ring-blue-200',
      );
      field.parentNode.parentNode.classList.add(
        'border-red-500',
        'bg-red-50',
        'focus:ring-red-200',
      );

      // Show error message and hide help info if error message exists
      if (errorMessage) {
        const errorElement = document.createElement('p');
        errorElement.id = `${field.name}-error`;
        errorElement.className = 'text-sm text-red-600 mt-1 flex items-center';
        errorElement.innerHTML = errorMessage;

        field.parentNode.parentNode.appendChild(errorElement);
      }
    } else {
      field.parentNode.parentNode.classList.remove(
        'border-red-500',
        'border-zinc-300',
        'bg-red-50',
        'bg-green-50',
        'border-green-500',
        'focus:ring-red-200',
      );

      const checkboxes = document.getElementsByName('genres');
      const checkedValues = [];
      Array.from(checkboxes).forEach((cb) => {
        if (cb.checked) {
          checkedValues.push(cb.value.trim());
        }
      });

      if (checkedValues.length > 0) {
        field.parentNode.parentNode.classList.add(
          'border-green-500',
          'bg-green-50',
        );
      } else {
        field.parentNode.parentNode.classList.add('border-zinc-300');
      }
    }
    return;
  }

  // Remove previous error styling
  field.classList.remove('border-red-500', 'bg-red-50');

  // Remove any existing error message
  const existingError = field.parentNode.querySelector('[id$=-error]');
  if (existingError) {
    existingError.remove();
  }

  // Apply error styling and message if invalid
  if (!isValid) {
    field.classList.remove(
      'border-zinc-300',
      'focus:border-blue-500',
      'focus:ring-blue-200',
    );
    field.classList.add('border-red-500', 'bg-red-50', 'focus:ring-red-200');

    // Show error message and hide help info if error message exists
    if (errorMessage) {
      const helpInfoElement = field.parentNode.querySelector('[id$=-help]');

      if (helpInfoElement) {
        helpInfoElement.style.display = 'none';
      }

      const errorElement = document.createElement('p');
      errorElement.id = `${field.name}-error`;
      errorElement.className = 'text-sm text-red-600 mt-1 flex items-center';
      errorElement.innerHTML = errorMessage;

      field.parentNode.appendChild(errorElement);
    }
  } else {
    field.classList.remove(
      'border-red-500',
      'border-zinc-300',
      'bg-red-50',
      'focus:ring-red-200',
    );

    if (field.value.trim()) {
      field.classList.add('border-green-500', 'bg-green-50');
    } else {
      field.classList.add('border-zinc-300');
    }
  }
}

function validateSchema() {
  const serverErrorsElement = document.querySelector('#server-errors');
  const serverErrors = serverErrorsElement
    ? JSON.parse(serverErrorsElement.textContent)
    : {};

  if (Object.keys(serverErrors).length === 0) return;

  for (const [name, error] of Object.entries(serverErrors)) {
    const field = document.querySelector(`#${name}`);
    showErrorMessage(field, false, error.msg);
  }

  showErrorSummary();
}

function validateField(field) {
  const value = field.value.trim();
  let isValid = true;
  let errorMessage = '';

  switch (field.name) {
    case 'title':
      if (!value) {
        isValid = false;
        errorMessage = 'Title is required';
      } else if (value.length < 1 || value.length > 255) {
        isValid = false;
        errorMessage = 'Title must be between 1 and 255 characters';
      }
      break;

    case 'subtitle':
      if (value.length > 255) {
        isValid = false;
        errorMessage = 'Subtitle must not exceed 255 characters';
      }
      break;

    case 'stock':
      if (!value) {
        isValid = false;
        errorMessage = 'Stock is required';
      } else if (!Number.isInteger(Number(value)) || Number(value) < 1) {
        isValid = false;
        errorMessage = 'Stock must be a positive integer';
      }
      break;

    case 'price':
      if (!value) {
        isValid = false;
        errorMessage = 'Price is required';
      } else if (Number.isNaN(Number(value)) || Number(value) < 0) {
        isValid = false;
        errorMessage = 'Price must be a positive number';
      } else if (!/^\d+(\.\d{1,2})?$/i.test(value)) {
        isValid = false;
        errorMessage = 'Price must have up to two decimal places';
      }
      break;

    case 'authors':
      if (!value) {
        isValid = false;
        errorMessage = 'At least one author is required';
      } else {
        const authors = value.split(',');

        if (!authors.every((a) => /^[a-zA-Z\s\.]{2,100}$/.test(a))) {
          isValid = false;
          errorMessage = 'Each author must be a valid word (2-25 letters)';
        }
      }
      break;

    case 'genres':
      const checkboxes = document.getElementsByName('genres');
      const checkedValues = [];

      Array.from(checkboxes).forEach((cb) => {
        if (cb.checked) {
          checkedValues.push(cb.value);
        }
      });

      if (!checkedValues.every((g) => /^[a-zA-Z\s]{2,25}$/.test(g))) {
        isValid = false;
        errorMessage = 'Each genre must be a valid word (2-25 letters)';
      }
      break;

    case 'new_genres':
      if (value) {
        const newGenres = value.split(',');

        if (!newGenres.every((g) => /^[a-zA-Z\s]{2,25}$/.test(g))) {
          isValid = false;
          errorMessage = 'Each genre must be a valid word (2-25 letters)';
        }
      }
      break;

    case 'languages':
      if (value) {
        const languages = value.split(',');

        if (!languages.every((l) => /^[a-zA-Z\s]{2,25}$/.test(l))) {
          isValid = false;
          errorMessage = 'Each language must be a valid word (2-25 letters)';
        }
      }
      break;

    case 'published_at':
      if (value) {
        if (!isISO8601Date(value)) {
          isValid = false;
          errorMessage = 'Published date must be a valid date';
        }
      }
      break;

    case 'cover_url':
      if (value) {
        const isCorrectSource =
          /^(https:\/\/covers\.openlibrary\.org\/[\w\d\/-]+\.jpg|https:\/\/(?:www\.)?archive\.org\/.+\.(?:jpg|jpeg)$)/i.test(
            value,
          );
        if (!isCorrectSource) {
          isValid = false;
          errorMessage = 'Book cover URL must come from Open Library';
        }
      }
      break;
  }

  showErrorMessage(field, isValid, errorMessage);

  return isValid;
}

function getFieldDisplayName(field) {
  const label = document.querySelector(`label[for="${field.id}"]`);
  if (label) {
    return label.textContent.replace('*', '').trim();
  }

  // Fallback to field name with proper formatting
  return field.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function showErrorSummary() {
  // Remove existing error summary
  const existingSummary = document.querySelector('#error-summary');

  if (existingSummary) {
    existingSummary.remove();
  }

  const errorMessages = document.querySelectorAll(`[id$=-error]`);

  if (errorMessages.length === 0) return;

  // Create error summary
  const summary = document.createElement('div');
  summary.id = 'error-summary';
  summary.className = 'mb-4 p-4 bg-red-50 border border-red-200 rounded-md';
  summary.setAttribute('role', 'alert');
  summary.setAttribute('aria-live', 'polite');

  const title = document.createElement('h3');
  title.className = 'text-sm font-medium text-red-800 mb-2';
  title.textContent = `Please fix the following ${errorMessages.length} error${
    errorMessages.length === 1 ? '' : 's'
  }:`;

  const list = document.createElement('ul');
  list.className = 'text-sm text-red-700 list-disc list-inside space-y-1';

  errorMessages.forEach((msg) => {
    const listItem = document.createElement('li');
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'underline hover:no-underline';
    link.textContent = msg.textContent;
    link.onclick = () => {
      field.focus();
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    listItem.appendChild(link);
    list.appendChild(listItem);
  });

  summary.appendChild(title);
  summary.appendChild(list);

  // Insert at the top of the form
  const form = document.getElementById('book-form');
  form.insertBefore(summary, form.firstChild);

  // Scroll to error summary
  summary.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showCoverPreview(url) {
  // Remove existing preview
  const existingPreview = document.getElementById('cover-preview');
  if (existingPreview) {
    existingPreview.remove();
  }

  if (!url || !url.startsWith('http')) return;

  const coverInput = document.getElementById('cover_url');
  const container = coverInput.parentNode;

  // Create preview container
  const preview = document.createElement('div');
  preview.id = 'cover-preview';
  preview.className = 'mt-3 p-3 bg-gray-50 rounded-md';

  const title = document.createElement('p');
  title.className = 'text-sm font-medium text-zinc-700 mb-2';
  title.textContent = 'Cover Preview:';

  const img = document.createElement('img');
  img.src = url;
  img.alt = 'Book cover preview';
  img.className = 'max-w-32 max-h-48 object-cover rounded shadow-sm';
  // img.loading = 'lazy';

  // Handle image load errors
  img.onerror = function () {
    preview.innerHTML =
      '<p class="text-sm text-red-600">Unable to load image from this URL</p>';
  };

  img.onload = function () {
    // Image loaded successfully
    preview.appendChild(title);
    preview.appendChild(img);
  };

  container.appendChild(preview);
}

function saveDraft() {
  const form = document.getElementById('book-form');
  if (!form) return;

  const formData = new FormData(form);
  const draftData = {};

  // Convert FormData to regular object
  for (let [key, value] of formData.entries()) {
    if (draftData[key]) {
      // Handle multiple values (like checkboxes)
      if (Array.isArray(draftData[key])) {
        draftData[key].push(value);
      } else {
        draftData[key] = [draftData[key], value];
      }
    } else {
      draftData[key] = value;
    }
  }

  // Save to sessionStorage
  try {
    sessionStorage.setItem('bookFormDraft', JSON.stringify(draftData));
    showSaveIndicator();
  } catch (e) {
    console.warn('Unable to save draft:', e);
  }
}

function loadDraft() {
  try {
    const draftData = sessionStorage.getItem('bookFormDraft');
    if (!draftData) return;

    const data = JSON.parse(draftData);
    const form = document.getElementById('book-form');

    // Only load draft if form is empty (new entry)
    const formModeElement = document.querySelector('#form-mode');
    const isEditMode = formModeElement
      ? JSON.parse(formModeElement.textContent)
      : false;

    if (isEditMode) return;

    // Populate form fields
    Object.keys(data).forEach((key) => {
      const field = form.querySelector(`[name="${key}"]`);
      if (field) {
        if (field.type === 'checkbox') {
          const values = Array.isArray(data[key]) ? data[key] : [data[key]];
          const checkboxes = form.querySelectorAll(`[name="${key}"]`);
          checkboxes.forEach((cb) => {
            cb.checked = values.includes(cb.value);
          });
        } else {
          field.value = data[key];
        }
      }
    });

    // Show draft loaded indicator
    showDraftLoadedIndicator();
  } catch (e) {
    console.warn('Unable to load draft:', e);
  }
}

function showSaveIndicator() {
  // Remove existing indicator
  const existing = document.getElementById('save-indicator');
  if (existing) existing.remove();

  const indicator = document.createElement('div');
  indicator.id = 'save-indicator';
  indicator.className =
    'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded-md text-sm z-50';
  indicator.textContent = 'Draft saved automatically';

  document.body.appendChild(indicator);

  // Remove after 3 seconds
  setTimeout(() => {
    if (indicator.parentNode) {
      indicator.remove();
    }
  }, SHOW_INDICATOR_TIMEOUT);
}

function showDraftLoadedIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md';
  indicator.innerHTML = `
				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
						</svg>
						<span class="text-sm text-blue-500">Draft data has been restored from your previous session.</span>
					</div>
					<button id="clear-draft-btn" type="button" class="min-w-fit text-blue-500 hover:text-blue-600 text-sm underline cursor-pointer">
						Clear Draft
					</button>
				</div>
			`;

  const form = document.getElementById('book-form');
  form.insertBefore(indicator, form.firstChild);
}

function clearDraft(button) {
  sessionStorage.removeItem('bookFormDraft');
  button.parentNode.parentNode.remove();

  // Reset form
  document.getElementById('book-form').reset();
}

function isISO8601Date(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str));
}
