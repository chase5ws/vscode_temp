import { Client, GatewayIntentBits, Options } from "discord.js";
import { initialize } from "./utils/botUtils.js";
import { createLogger } from "./utils/logger.js";

const client: Client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent
	],
	presence: {
		status: "invisible"
	},
	makeCache: Options.cacheWithLimits({
		...Options.DefaultMakeCacheSettings,
		AutoModerationRuleManager: 0,
		BaseGuildEmojiManager: 0,
		GuildBanManager: 0,
		GuildEmojiManager: 0,
		GuildForumThreadManager: 0,
		GuildInviteManager: 0,
		GuildMemberManager: {
			keepOverLimit: (m) => m.id === client.user!.id,
			maxSize: 100
		},
		GuildScheduledEventManager: 0,
		GuildStickerManager: 0,
		GuildTextThreadManager: 0,
		MessageManager: 0,
		PresenceManager: 0,
		ReactionManager: 0,
		ReactionUserManager: 0,
		StageInstanceManager: 0,
		ThreadManager: 0,
		ThreadMemberManager: 0,
		UserManager: {
			keepOverLimit: (u) => u.id === client.user!.id,
			maxSize: 100
		},
		VoiceStateManager: 0
	})
});

globalThis.logger = createLogger().children;
globalThis.ItemType = {
	IncBetAmt: 0,
	IncWorkReward: 1,
	ResetCd: 2,
	Protection: 3,
	Respawn: 4,
	NoEffect: 5
};

initialize(client);
