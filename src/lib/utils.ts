export const capitalize = (word: string) => {
	return word.slice(0, 1).toUpperCase() + word.slice(1);
};

export const capitalizeAll = (text: string) => {
	return text
		.split(' ')
		.map((word) => capitalize(word))
		.join(' ');
};

export const formatCurrency = (num: number) => {
	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	});

	return formatter.format(num);
};

export const formatNumToCompactNotation = (num: number) => {
	const formatter = new Intl.NumberFormat('en', {
		notation: 'compact',
		compactDisplay: 'short', // 'short' for 'K', 'long' for 'thousand'
	});

	return formatter.format(num);
};
