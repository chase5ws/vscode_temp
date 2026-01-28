const event: ClientEvent = {
	name: "error",
	lib: "mongo",
	run: (_, err) => {
		logger.error(err);
	}
};

export default event;
