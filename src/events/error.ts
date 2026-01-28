import { Event } from "../types";

export default {
	name: "error",
	listener: (_client, err) => logger.error(err)
} as Event<"error">;
