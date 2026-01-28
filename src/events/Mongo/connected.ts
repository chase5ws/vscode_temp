import { getUserData } from "../../utils/mognoUtils.js";

const event: ClientEvent = {
	name: "connected",
	lib: "mongo",
	run: async (client) => {
		await getUserData(client).then(async (arr) => {
			for (const data of arr) {
				if (data.gamesData.ingame) {
					await data.updateOne({
						$set: {
							"gamesData.ingame": false
						}
					});
				}
			}
		});

		logger.info("連線至資料庫。");
	}
};

export default event;
