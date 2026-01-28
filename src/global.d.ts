/* eslint-disable */
import { LogLevel } from "./utils/createLogger";

declare global {
	var logger: {
		[K in LogLevel]: (...args: unknown[]) => void;
	};
}
