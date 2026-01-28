export default function (str: string) {
	try {
		const url = new URL(str);

		if (url.protocol !== "https:") {
			return false;
		}

		return true;
	} catch (e) {
		return false;
	}
}
