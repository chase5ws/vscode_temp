const event: ClientEvent = {
	name: "disconnected",
	lib: "mongo",
	run: () => {
		logger.warn("與資料庫斷開連線。");
	}
};

export default event;
