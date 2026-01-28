export default function () {
	const env = process.env;

	if (
		!env["TOKEN"] ||
		!env["DB_HOST"] ||
		!env["DB_PORT"] ||
		!env["DB_USERNAME"] ||
		!env["DB_PASSWORD"] ||
		!env["OWNER_ID"]
	) {
		throw new Error(
			"Setup environment variables properly before running the bot."
		);
	}
}
