const TIMEZONE_OFFSET =
	(process.env["TZ"] ? parseInt(process.env["TZ"]) : 0) * 3600000;

export default function (timestamp?: number) {
	const fmtInt = (n: number) => (n < 10 ? `0${n}` : `${n}`);
	const baseDate = new Date((timestamp ?? Date.now()) + TIMEZONE_OFFSET);
	const year = baseDate.getUTCFullYear();
	const month = baseDate.getUTCMonth() + 1;
	const date = baseDate.getUTCDate();
	const hour = baseDate.getUTCHours();
	const minute = baseDate.getUTCMinutes();
	const second = baseDate.getUTCSeconds();

	return {
		year: year.toString(),
		month: fmtInt(month),
		date: fmtInt(date),
		hour: fmtInt(hour),
		minute: fmtInt(minute),
		second: fmtInt(second)
	};
}
