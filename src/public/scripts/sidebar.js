document.addEventListener('DOMContentLoaded', () => {
	const menuToggle = document.querySelector('#btn-menu');
	const layout = document.querySelector('#layout');
	const sidebar = document.querySelector('#sidebar');
	const main = document.querySelector('#main');

	function openSidebar(ev) {
		ev.stopPropagation();

		if (!layout.classList.contains('translate-x-72')) {
			layout.classList.add('translate-x-72');
			main.classList.add('pointer-events-none', 'grayscale', 'blur-[2px]');
			sidebar.classList.add('shadow-xl');
		}
	}

	function closeSidebar() {
		if (layout.classList.contains('translate-x-72')) {
			layout.classList.remove('translate-x-72');
			main.classList.remove('pointer-events-none', 'grayscale', 'blur-[2px]');
			sidebar.classList.remove('shadow-xl');
		}
	}

	// Open
	menuToggle.addEventListener('click', openSidebar);

	// Close
	document.addEventListener('click', (e) => {
		if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
			closeSidebar();
		}
	});
});

document.querySelectorAll('aside tr[data-href]').forEach((row) => {
	row.addEventListener('click', () => {
		closeSidebar();

		const href = row.getAttribute('data-href');

		if (href) {
			window.location.href = href;
		}
	});
});
