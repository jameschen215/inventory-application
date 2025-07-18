document.addEventListener('DOMContentLoaded', () => {
	const menuToggle = document.querySelector('#btn-menu');

	const sidebar = document.querySelector('#sidebar');
	const main = document.querySelector('#main');

	function openSidebar(ev) {
		ev.stopPropagation();

		sidebar.classList.add('shadow-xl', 'translate-x-72');
		main.classList.add(
			'translate-x-72',
			'pointer-events-none',
			'grayscale',
			'blur-[2px]'
		);
	}

	function closeSidebar() {
		sidebar.classList.remove('translate-x-72', 'shadow-xl');
		main.classList.remove(
			'translate-x-72',
			'pointer-events-none',
			'grayscale',
			'blur-[2px]'
		);
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
