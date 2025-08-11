const cancelBtn = document.querySelector('#form-cancel-btn');

if (cancelBtn) {
	cancelBtn.addEventListener('click', () => {
		history.back();
	});
}

// Empty search value when go back in history
window.addEventListener('pageshow', function () {
	document.querySelectorAll('input[name="q"]').forEach((input) => {
		input.value = '';
	});
});
