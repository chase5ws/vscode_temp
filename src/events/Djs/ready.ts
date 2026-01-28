import { antiCrash, msTillEnd } from "../../utils/botUtils.js";
import {
	resetRoles,
	dailyStatsReset,
	monthlyStatsReset
} from "../../utils/gameUtils.js";

const event: ClientEvent = {
	name: "ready",
	lib: "djs",
	run: async (client) => {
		await client.guilds.fetch();

		if (client.guilds.cache.size > 1) {
			logger.warn(
				"此機器人只適用於單一伺服器。機器人目前存在於多個伺服器中，這可能引發錯誤。"
			);
		}
		if (!client.guilds.resolve(client.config.guildId)) {
			logger.warn(
				`機器人尚未加入指定的伺服器。可以透過此連結將機器人加入伺服器中：
				https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`
			);
		}

		await client.application.commands.set(
			client.commands.map((c) => c.data.toJSON())
		);
		client.user.setStatus("online");
		logger.info(`${client.user.tag} 已啟動。`);
		antiCrash();

		setTimeout(() => {
			resetRoles(client);
			dailyStatsReset(client);
			monthlyStatsReset(client);

			setInterval(() => {
				resetRoles(client);
				dailyStatsReset(client);
				monthlyStatsReset(client);
			}, 86400000);
		}, msTillEnd());
	}
};

export default event;
