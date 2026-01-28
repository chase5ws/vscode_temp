const event: ClientEvent = {
	name: "error",
	lib: "djs",
	run: (_, err: Error) => {
		logger.error(err);
	}
};

export default event;
