process.on("unhandledRejection", (reason) =>
	logger.error("[UnhandledRejection]", reason)
);
