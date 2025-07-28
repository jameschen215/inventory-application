const cancelBtn = document.querySelector('#form-cancel-btn');

if (cancelBtn) {
	cancelBtn.addEventListener('click', () => {
		history.back();
	});
}

// const mobileInput = document.querySelector('[data-device="mobile"]');
// const desktopInput = document.querySelector('[data-device="desktop"]');

// if (getComputedStyle(mobileInput).display !== 'none') {
// 	mobileInput.addEventListener('keydown', (ev) => {
// 		console.log(ev.key);
// 	});
// } else {
// 	desktopInput.addEventListener('keydown', (ev) => {
// 		console.log(ev.key);
// 	});
// }

window.addEventListener('pageshow', function () {
	document.querySelectorAll('input[name="q"]').forEach((input) => {
		input.value = '';
	});
});
