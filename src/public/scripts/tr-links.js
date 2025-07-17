document.querySelectorAll('#main tr[data-href]').forEach((row) => {
	row.addEventListener('click', () => {
		const href = row.getAttribute('data-href');

		if (href) {
			window.location.href = href;
		}
	});
});
