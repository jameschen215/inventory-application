const cancelBtn = document.querySelector('#form-cancel-btn');

if (cancelBtn) {
	cancelBtn.addEventListener('click', () => {
		history.back();
	});
}
