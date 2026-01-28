import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType
} from "discord.js";
import { userDataDb } from "../mongoose/userData.js";
import { getUTC8Date, resolveReply } from "./botUtils.js";
import { getUserData } from "./mognoUtils.js";

export function isItemWorking(item?: { startAt: number; duration: number }) {
	if (
		!item ||
		!item.startAt ||
		!item.duration ||
		item.startAt + item.duration * 3600000 < Date.now()
	) {
		return false;
	}

	return true;
}

export async function gameRequest(
	client: import("discord.js").Client<true>,
	interaction: import("discord.js").ChatInputCommandInteraction<"cached">,
	replyOptions: { [x: string]: any }
) {
	const request = await interaction.editReply({
		...resolveReply(
			client.messages[interaction.commandName]["game_request"],
			replyOptions
		),
		components: [
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId("accept")
					.setLabel("接受")
					.setStyle(ButtonStyle.Success),
				new ButtonBuilder()
					.setCustomId("deny")
					.setLabel("拒絕")
					.setStyle(ButtonStyle.Danger)
			)
		]
	});
	const answer = await request
		.awaitMessageComponent({
			componentType: ComponentType.Button,
			filter: (i) => i.user.id === replyOptions.opponent!.id,
			time: 30000,
			dispose: true
		})
		.catch(() => null);

	await interaction.editReply({
		components: []
	});

	if (!answer) {
		await interaction.editReply(
			resolveReply(
				client.messages[interaction.commandName]["no_answer"],
				replyOptions
			)
		);
		return false;
	}

	await answer.deferUpdate();

	if (answer.customId === "accept") {
		await answer.editReply(
			resolveReply(
				client.messages[interaction.commandName]["accept_request"],
				replyOptions
			)
		);
		return true;
	} else {
		await answer.editReply(
			resolveReply(
				client.messages[interaction.commandName]["deny_request"],
				replyOptions
			)
		);
		return false;
	}
}

export function rollDice() {
	const result: number[] = [];

	while (result.length < 2) {
		result.push(Math.floor(Math.random() * 6 + 1));
	}

	result.push(result.reduce((acc, cur) => acc + cur, 0));
	return result;
}

export function getSignReward(
	client: import("discord.js").Client<true>,
	streak: number
) {
	const maxMul =
		Math.floor(
			(client.config.commands.daily.reward.max -
				client.config.commands.daily.reward.min) /
				client.config.commands.daily.reward.inc_amt
		) - 1;
	const mul = Math.min(
		Math.floor(streak / 7 / client.config.commands.daily.reward.inc_time),
		maxMul
	);

	return (
		Math.round(Math.random() * client.config.commands.daily.reward.inc_amt) +
		client.config.commands.daily.reward.min +
		client.config.commands.daily.reward.inc_amt * mul
	);
}

export function getGuessReward(
	amount: number,
	round: number,
	gambler: boolean
) {
	const mul = gambler ? 1.2 : 1;

	if (round === 0) {
		return Math.floor(11 * amount * mul);
	}
	if (round === 1) {
		return Math.floor(Math.ceil(Math.random() * 2.5 + 7) * amount * mul);
	}
	if (round === 2) {
		return Math.floor(Math.ceil(Math.random() * 2.5 + 4) * amount * mul);
	}
	if (round === 3) {
		return Math.floor(Math.ceil(Math.random() * 1.5 + 2) * amount * mul);
	}

	return Math.floor(1.5 * amount * mul);
}

export async function rouletteDecision(
	client: import("discord.js").Client<true>,
	interaction: import("discord.js").ChatInputCommandInteraction<"cached">,
	user: import("discord.js").User,
	replyOptions: { [x: string]: any }
) {
	const question = interaction.replied
		? await interaction.followUp({
				...resolveReply(client.messages[interaction.commandName]["question"], {
					...replyOptions,
					user
				}),
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId("shoot")
							.setLabel("開槍")
							.setStyle(ButtonStyle.Danger),
						new ButtonBuilder()
							.setCustomId("give-up")
							.setLabel("放棄")
							.setStyle(ButtonStyle.Secondary)
					)
				]
			})
		: await interaction.editReply({
				...resolveReply(client.messages[interaction.commandName]["question"], {
					...replyOptions,
					user
				}),
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId("shoot")
							.setLabel("開槍")
							.setStyle(ButtonStyle.Danger),
						new ButtonBuilder()
							.setCustomId("give-up")
							.setLabel("放棄")
							.setStyle(ButtonStyle.Secondary)
					)
				]
			});
	const answer = await question
		.awaitMessageComponent({
			componentType: ComponentType.Button,
			filter: (i) => i.user.id === user.id,
			time: 60000,
			dispose: true
		})
		.catch(() => null);

	if (!answer) {
		await question.edit({
			...resolveReply(client.messages[interaction.commandName]["decided"], {
				...replyOptions,
				action: "放棄",
				user
			}),
			components: []
		});
		return false;
	}

	await answer.deferUpdate();

	if (answer.customId === "give-up") {
		await question.edit({
			...resolveReply(client.messages[interaction.commandName]["decided"], {
				...replyOptions,
				action: "放棄",
				user
			}),
			components: []
		});
		return false;
	}

	await question.edit({
		...resolveReply(client.messages[interaction.commandName]["decided"], {
			...replyOptions,
			action: "開槍",
			user
		}),
		components: []
	});
	return true;
}

export async function rpsDecision(
	client: import("discord.js").Client<true>,
	interaction: import("discord.js").ChatInputCommandInteraction<"cached">,
	user: import("discord.js").User,
	replyOptions: { [x: string]: any }
): Promise<0 | 1 | 2 | undefined> {
	const question = interaction.replied
		? await interaction.followUp({
				...resolveReply(client.messages[interaction.commandName]["question"], {
					...replyOptions,
					user
				}),
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId("0")
							.setLabel("石頭")
							.setStyle(ButtonStyle.Success),
						new ButtonBuilder()
							.setCustomId("1")
							.setLabel("布")
							.setStyle(ButtonStyle.Success),
						new ButtonBuilder()
							.setCustomId("2")
							.setLabel("剪刀")
							.setStyle(ButtonStyle.Success)
					)
				]
			})
		: await interaction.editReply({
				...resolveReply(client.messages[interaction.commandName]["question"], {
					...replyOptions,
					user
				}),
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId("0")
							.setLabel("石頭")
							.setStyle(ButtonStyle.Success),
						new ButtonBuilder()
							.setCustomId("1")
							.setLabel("布")
							.setStyle(ButtonStyle.Success),
						new ButtonBuilder()
							.setCustomId("2")
							.setLabel("剪刀")
							.setStyle(ButtonStyle.Success)
					)
				]
			});
	const answer = await question
		.awaitMessageComponent({
			componentType: ComponentType.Button,
			filter: (i) => i.user.id === user.id,
			time: 60000,
			dispose: true
		})
		.catch(() => null);

	if (!answer) {
		return;
	}

	await answer.update({
		...resolveReply(client.messages[interaction.commandName]["answered"], {
			...replyOptions,
			user
		}),
		components: []
	});

	return parseInt(answer.customId) as 0 | 1 | 2;
}

export function rpsStateToStr(state: 0 | 1 | 2) {
	if (state === 0) {
		return "石頭";
	} else if (state === 1) {
		return "布";
	}

	return "剪刀";
}

export async function updateWorker(
	client: import("discord.js").Client<true>,
	interaction: import("discord.js").ChatInputCommandInteraction<"cached">,
	replyOptions: { [x: string]: any }
) {
	let data = (await getUserData(client))
		.filter((d) => d.workCommand.times)
		.sort((a, b) => b.workCommand.times - a.workCommand.times);

	data = data.filter((d) => d.workCommand.times === data[0].workCommand.times);

	if (!data.some((d) => d.userId === interaction.user.id)) {
		return;
	}
	if (!interaction.member.roles.cache.has(client.config.roles.worker)) {
		Object.assign(replyOptions, {
			role: `<@&${client.config.roles.worker}>`
		});
		await interaction.followUp(
			resolveReply(
				client.messages[interaction.commandName]["get_worker"],
				replyOptions
			)
		);

		for (const userData of data) {
			await (
				await client.guilds
					.resolve(client.config.guildId)!
					.members.fetch(userData.userId)
			).roles.add(client.config.roles.worker);
		}
	}

	const holders = (
		await client.guilds.resolve(client.config.guildId)!.members.fetch()
	)
		.filter(
			(m) =>
				m.roles.cache.has(client.config.roles.worker) &&
				!m.user.bot &&
				!data.some((d) => m.id === d.userId)
		)
		.map((m) => m);

	for (const member of holders) {
		await member.roles.remove(client.config.roles.worker);
	}
}

export async function updateGambler(
	client: import("discord.js").Client<true>,
	interaction: import("discord.js").ChatInputCommandInteraction<"cached">,
	replyOptions: { [x: string]: any }
) {
	let data = (await getUserData(client))
		.filter((d) => d.gamesData.gambleTimes)
		.sort((a, b) => b.gamesData.gambleTimes - a.gamesData.gambleTimes);

	data = data.filter(
		(d) => d.gamesData.gambleTimes === data[0].gamesData.gambleTimes
	);

	if (!data.some((d) => d.userId === interaction.user.id)) {
		return;
	}

	if (!interaction.member.roles.cache.has(client.config.roles.gambler)) {
		Object.assign(replyOptions, {
			user: interaction.user,
			role: `<@&${client.config.roles.gambler}>`
		});
		await interaction.followUp(
			resolveReply(
				client.messages[interaction.commandName]["get_gambler"],
				replyOptions
			)
		);

		for (const userData of data) {
			await (
				await client.guilds
					.resolve(client.config.guildId)!
					.members.fetch(userData.userId)
			).roles.add(client.config.roles.gambler);
		}
	}

	const holders = (
		await client.guilds.resolve(client.config.guildId)!.members.fetch()
	)
		.filter(
			(m) =>
				m.roles.cache.has(client.config.roles.gambler) &&
				!m.user.bot &&
				!data.some((d) => m.id === d.userId)
		)
		.map((m) => m);

	for (const member of holders) {
		await member.roles.remove(client.config.roles.gambler);
	}
}

export async function updateKiller(
	client: import("discord.js").Client<true>,
	interaction: import("discord.js").ChatInputCommandInteraction<"cached">,
	replyOptions: { [x: string]: any }
) {
	let data = (await getUserData(client))
		.filter((d) => d.gamesData.killTimes)
		.sort((a, b) => b.gamesData.killTimes - a.gamesData.killTimes);

	data = data.filter(
		(d) => d.gamesData.killTimes === data[0].gamesData.killTimes
	);

	if (!data.some((d) => d.userId === interaction.user.id)) {
		return;
	}

	if (!interaction.member.roles.cache.has(client.config.roles.killer)) {
		Object.assign(replyOptions, {
			role: `<@&${client.config.roles.killer}>`
		});
		await interaction.followUp(
			resolveReply(
				client.messages[interaction.commandName]["get_killer"],
				replyOptions
			)
		);

		for (const userData of data) {
			await (
				await client.guilds
					.resolve(client.config.guildId)!
					.members.fetch(userData.userId)
			).roles.add(client.config.roles.killer);
		}
	}

	const holders = (
		await client.guilds.resolve(client.config.guildId)!.members.fetch()
	)
		.filter(
			(m) =>
				m.roles.cache.has(client.config.roles.killer) &&
				!m.user.bot &&
				!data.some((d) => d.userId === m.id)
		)
		.map((m) => m);

	for (const member of holders) {
		await member.roles.remove(client.config.roles.killer);
	}
}

export async function updateRobber(
	client: import("discord.js").Client<true>,
	interaction: import("discord.js").ChatInputCommandInteraction<"cached">,
	replyOptions: { [x: string]: any }
) {
	let data = (await getUserData(client))
		.filter((d) => d.gamesData.robTimes)
		.sort((a, b) => b.gamesData.robTimes - a.gamesData.robTimes);

	data = data.filter(
		(d) => d.gamesData.robTimes === data[0].gamesData.robTimes
	);

	if (!data.some((d) => d.userId === interaction.user.id)) {
		return;
	}

	if (!interaction.member.roles.cache.has(client.config.roles.robber)) {
		Object.assign(replyOptions, {
			role: `<@&${client.config.roles.robber}>`
		});
		await interaction.followUp(
			resolveReply(
				client.messages[interaction.commandName]["get_robber"],
				replyOptions
			)
		);

		for (const userData of data) {
			await (
				await client.guilds
					.resolve(client.config.guildId)!
					.members.fetch(userData.userId)
			).roles.add(client.config.roles.robber);
		}
	}

	const holders = (
		await client.guilds.resolve(client.config.guildId)!.members.fetch()
	)
		.filter(
			(m) =>
				m.roles.cache.has(client.config.roles.robber) &&
				!m.user.bot &&
				!data.some((d) => d.userId === m.id)
		)
		.map((m) => m);

	for (const member of holders) {
		await member.roles.remove(client.config.roles.robber);
	}
}

export async function resetRoles(client: import("discord.js").Client<true>) {
	const guild = await client.guilds
		.fetch(client.config.guildId)
		.catch(() => null);

	if (!guild) {
		logger.warn(
			`機器人尚未加入指定的伺服器。可以透過此連結將機器人加入伺服器中：
			https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`
		);
		return;
	}

	logger.info("運行每日身分組重置。");

	const members = (await guild.members.fetch())
		.filter((m) => !m.user.bot)
		.map((m) => m);
	// Workers
	for (const worker of members.filter((m) =>
		m.roles.cache.has(client.config.roles.worker)
	)) {
		getUserData(client, worker.id).then(async (d) => {
			await d.updateOne({
				$inc: {
					coins: client.config.commands.work.bonus
				}
			});
		});
		await worker.roles.remove(client.config.roles.worker);

		const channel = await guild.channels
			.fetch(client.config.commands.work.announce_ch)
			.then((c) => c as import("discord.js").TextChannel)
			.catch(() => null);

		if (channel) {
			await channel.send(
				resolveReply(client.messages["work"]["get_bonus"], {
					user: worker,
					bonus: client.config.commands.work.bonus.toLocaleString()
				})
			);
		}
	}
	// Killers
	members
		.filter((m) => m.roles.cache.has(client.config.roles.killer))
		.forEach(async (k) => await k.roles.remove(client.config.roles.killer));
	// Robbers
	members
		.filter((m) => m.roles.cache.has(client.config.roles.robber))
		.forEach(async (r) => await r.roles.remove(client.config.roles.robber));
	// Gamblers
	members
		.filter((m) => m.roles.cache.has(client.config.roles.gambler))
		.forEach(async (g) => await g.roles.remove(client.config.roles.gambler));
}

export async function dailyStatsReset(
	client: import("discord.js").Client<true>
) {
	logger.info("運行每日數值重置。");

	const userData = await userDataDb.find({
		guildId: client.config.guildId
	});

	for (const data of userData) {
		const $set = {
			"workCommand.times": 0,
			"gamesData.killTimes": 0,
			"gamesData.robTimes": 0,
			"gamesData.gambleTimes": 0,
			chat4coins: 0
		};

		if (!data.dailyCommand.onCooldown && data.dailyCommand.streak) {
			Object.assign($set, {
				"dailyCommand.streak": 0
			});
		} else if (data.dailyCommand.onCooldown) {
			Object.assign($set, {
				"dailyCommand.onCooldown": false
			});
		}

		await data.updateOne({ $set });
	}
}

export async function monthlyStatsReset(
	client: import("discord.js").Client<true>
) {
	if (getUTC8Date().getDate() !== 1) {
		return;
	}

	logger.info("運行每月數值重置。");
	await userDataDb.updateMany(
		{
			guildId: client.config.guildId
		},
		{
			$set: {
				"dailyCommand.monthStreak": 0
			}
		}
	);

	const guild = await client.guilds
		.fetch(client.config.guildId)
		.catch(() => null);

	if (!guild) {
		logger.warn(
			`機器人尚未加入指定的伺服器。可以透過此連結將機器人加入伺服器中：
			https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`
		);
		return;
	}

	(await guild.members.fetch())
		.filter(
			(m) =>
				!m.user.bot &&
				m.roles.cache.has(client.config.commands.daily.monthly_role.id)
		)
		.forEach(
			async (m) =>
				await m.roles.remove(client.config.commands.daily.monthly_role.id)
		);
}
