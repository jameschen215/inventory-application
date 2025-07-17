export const capitalize = (word: string) => {
	return word.slice(0, 1).toUpperCase() + word.slice(1);
};

export const capitalizeAll = (text: string) => {
	return text
		.split(' ')
		.map((word) => capitalize(word))
		.join(' ');
};
