/* eslint-disable @typescript-eslint/no-explicit-any */
import { inspect } from "util";
import { getUTC8Date, formatInt } from "./botUtils.js";

const logColors = {
	info: "\x1b[1;32m",
	warn: "\x1b[1;38;2;240;190m",
	error: "\x1b[1;38;2;255m",
	debug: "\x1b[1;38;2;0;170;250m"
} as const;
const otherColors = {
	reset: "\x1b[0m",
	timestamp: "\x1b[30m",
	content: "\x1b[37m"
};
const logTypeStr = {
	info: "[資訊]",
	warn: "[警告]",
	error: "[錯誤]",
	debug: "[除錯]"
};

export type logTypes = keyof typeof logColors;

export function createLogger() {
	function logger(type: logTypes, ...args: any[]) {
		if (!Object.keys(logColors).includes(type)) {
			throw new Error("Invalid log type.");
		}

		let content = "";
		for (const arg of args) {
			if (content !== "") {
				content += " ";
			}
			if (typeof arg === "object") {
				content += inspect(arg, {
					depth: 2,
					colors: false
				});
			} else {
				content += arg;
			}
		}

		console.log(
			`${otherColors.timestamp}${getTimestamp().padEnd(23)}${
				otherColors.reset
			}${logColors[type]}${logTypeStr[type].padEnd(8)}${otherColors.reset}${
				otherColors.content
			}${content}${otherColors.reset}`
		);
	}

	logger.children = {} as any;
	for (const key of Object.keys(logColors) as (keyof typeof logColors)[]) {
		logger.children[key] = logger.bind(null, key);
	}
	return logger;
}

function getTimestamp() {
	const date = getUTC8Date();
	return `[${date.getUTCFullYear()}/${formatInt(date.getUTCMonth() + 1)}/${formatInt(
		date.getUTCDate()
	)}-${formatInt(date.getUTCHours())}:${formatInt(date.getUTCMinutes())}:${formatInt(
		date.getUTCSeconds()
	)}]`;
}
