const BUTTON_DISABLED_TIME = 5000;

document.addEventListener('DOMContentLoaded', () => {
	const form = document.querySelector('#genre-language-form');
	const nameInput = form.querySelector('#name');
	const submitBtn = form.querySelector('button[type="submit"]');

	if (!form || !nameInput || !submitBtn) return;

	nameInput.focus();

	validateSchema();

	nameInput.addEventListener('blur', () => {
		validateField();
	});

	nameInput.addEventListener('input', function () {
		// Clear error styling when user starts typing
		this.classList.remove('border-red-500', 'bg-red-50', 'focus:ring-red-200');
		this.classList.add(
			'border-zinc-300',
			'focus:border-blue-500',
			'focus:ring-blue-200'
		);

		// Remove error summary and message
		const existingSummary = form.parentNode.querySelector('#error-summary');
		const existingErrorEl = form.querySelector('#name-error');
		const helpInfoElement = form.querySelector('#name-help');

		if (existingSummary) {
			existingSummary.remove();
		}
		if (existingErrorEl) {
			existingErrorEl.remove();
		}

		helpInfoElement.style.display = 'block';
	});

	// Form submission handling
	form.addEventListener('submit', (ev) => {
		if (!validateField()) {
			ev.preventDefault();

			nameInput.focus();
		}
	});

	function validateField() {
		const name = nameInput.value.trim();
		let isValid = true;
		let message = '';

		if (!name) {
			isValid = false;
			message = 'Name is required';
		} else if (name.length < 2 || name.length > 25) {
			isValid = false;
			message = 'Name must be between 2 and 25 characters(inclusive)';
		}

		showErrorInfo(isValid, message);

		return isValid;
	}

	function validateSchema() {
		const serverErrorsElement = document.querySelector(
			'#server-errors-about-genre-and-language'
		);
		const serverErrors = serverErrorsElement
			? JSON.parse(serverErrorsElement.textContent)
			: {};

		if (Object.keys(serverErrors).length === 0) return;

		showErrorInfo(false, serverErrors.name?.msg);
	}

	function showErrorInfo(isValid, message) {
		// Remove previous error styling
		nameInput.classList.remove('border-red-500', 'bg-red-50');

		// Remove existing error message
		const existingErrorEl = form.querySelector('#name-error');
		if (existingErrorEl) {
			existingErrorEl.remove();
		}

		// Remove existing error summary
		const existingSummary = document.querySelector('#error-summary');
		if (existingSummary) {
			existingSummary.remove();
		}

		// Apply error styling
		if (!isValid) {
			nameInput.classList.remove(
				'border-zinc-300',
				'focus:border-blue-500',
				'focus:ring-blue-200'
			);
			nameInput.classList.add(
				'border-red-500',
				'bg-red-50',
				'focus:ring-red-200'
			);

			const summary = document.createElement('div');
			summary.id = 'error-summary';
			summary.className = 'mb-4 p-4 bg-red-50 border border-red-200 rounded-md';
			summary.setAttribute('role', 'alert');
			summary.setAttribute('aria-live', 'polite');
			summary.innerHTML = `
      <div class="flex">
        <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
        </svg>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Please correct the following errors:</h3>
        </div>
      </div>
    `;
			form.parentNode.insertBefore(summary, form);

			// Hide name help info
			const helpInfoElement = form.querySelector('#name-help');
			helpInfoElement.style.display = 'none';

			// Show error message
			const errorEl = document.createElement('p');
			errorEl.id = 'name-error';
			errorEl.className = 'text-sm text-red-500 flex items-center mt-1';
			errorEl.setAttribute('role', 'alert');
			errorEl.setAttribute('aria-live', 'polite');
			errorEl.textContent = message;
			nameInput.parentNode.appendChild(errorEl);
		} else {
			nameInput.classList.remove(
				'border-red-500',
				'border-zinc-300',
				'bg-red-50',
				'focus:ring-red-200'
			);
			nameInput.classList.add('border-zinc-300');
		}
	}

	// Keyboard shortcuts
	document.addEventListener('keydown', function (ev) {
		// Escape to cancel
		if (ev.key === 'Escape') {
			ev.preventDefault();

			const returnTo = form.dataset.returnTo;
			window.location.href = returnTo;
		}
	});
});
