const titleEl = document.querySelector('#title');
const formWrapper = document.querySelector('#form-wrapper');
const nameInput = document.querySelector('input#name');
// const errorMessage = document.querySelector('#error-message');
const cancel = document.querySelector('#cancel');

if (titleEl) {
	titleEl.addEventListener('click', () => {
		titleEl.classList.add('hidden');
		formWrapper.classList.remove('hidden');
		nameInput.focus();
	});
}

if (cancel) {
	cancel.addEventListener('click', () => {
		formWrapper.classList.add('hidden');
		titleEl.classList.remove('hidden');
	});
}

if (formWrapper) {
	formWrapper.addEventListener('keydown', (ev) => {
		if (ev.key === 'Escape') {
			formWrapper.classList.add('hidden');
			titleEl.classList.remove('hidden');
		}
	});
}

function cancelInput() {
	formWrapper.classList.add('hidden');
	titleEl.classList.remove('hidden');
	// errorMessage.classList.add('hidden');
}
