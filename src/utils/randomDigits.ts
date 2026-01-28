export default function (digitCount: number) {
	let digit: number;
	let result = "";

	for (let i = 0; i < digitCount; i++) {
		digit = Math.round(Math.random() * 9);

		result += digit.toString();
	}

	return result;
}
