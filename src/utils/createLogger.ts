import { existsSync, mkdirSync, renameSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import { inspect } from "util";
import getTime from "./getTime";

const LEVEL_COLOR = {
	info: "\x1b[1;32m",
	warn: "\x1b[1;38;2;240;190m",
	error: "\x1b[1;38;2;255m",
	debug: "\x1b[1;38;2;0;170;250m"
};
const OTHER_COLOR = {
	timestamp: "\x1b[1;38;2;117;80;123m",
	message: "\x1b[1;37m"
};

export type LogLevel = keyof typeof LEVEL_COLOR;

function renameLastLog() {
	const path = join(__dirname, "..", "..", "logs", "latest.log");

	if (!existsSync(path)) {
		return;
	}

	const logStat = statSync(path);
	const date = getTime(logStat.mtimeMs);
	const fileName = `${date.year}${date.month}${date.date}_${date.hour}${date.minute}${date.second}`;

	renameSync(path, join(__dirname, "..", "..", "logs", `${fileName}.log`));
}

function writeLog(level: LogLevel, ...args: unknown[]) {
	const { year, month, date, hour, minute, second } = getTime();
	const levelTag = `[${level.toUpperCase()}]`;
	let message = "";

	for (const arg of args) {
		if (message !== "") {
			message += " ";
		}
		if (typeof arg === "object") {
			message += inspect(arg);
		} else {
			message += arg;
		}
	}

	if (!existsSync(join(__dirname, "..", "..", "logs"))) {
		mkdirSync(join(__dirname, "..", "..", "logs"));
	}

	console.log(
		OTHER_COLOR.timestamp,
		`[${year}/${month}/${date}-${hour}:${minute}:${second}]`.padEnd(23),
		LEVEL_COLOR[level],
		levelTag.padEnd(8),
		OTHER_COLOR.message,
		message
	);
	writeFileSync(
		join(__dirname, "..", "..", "logs", "latest.log"),
		`[${year}/${month}/${date}-${hour}:${minute}:${second}]`.padEnd(23) +
			levelTag.padEnd(8) +
			message +
			"\n",
		{ flag: "a+" }
	);
}

export default function () {
	renameLastLog();

	const logger = {};

	for (const level of Object.keys(LEVEL_COLOR) as LogLevel[]) {
		Object.assign(logger, {
			[level]: writeLog.bind(null, level)
		});
	}

	return logger as typeof globalThis.logger;
}
