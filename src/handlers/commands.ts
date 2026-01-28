import path from "path";
import { fileURLToPath } from "url";
import { readdirSync } from "fs";
import { getUserData } from "../utils/mognoUtils.js";
import { resolveReply } from "../utils/botUtils.js";
import { userDataDb } from "../mongoose/userData.js";
import { settingsDataDb } from "../mongoose/settingsData.js";

export async function loadCommands(client: import("discord.js").Client) {
	const __dirname = path.dirname(fileURLToPath(import.meta.url));
	const dirs = readdirSync(`${__dirname}/../commands`, {
		withFileTypes: true
	})
		.filter((dir) => dir.isDirectory())
		.map((dir) => dir.name);

	for (const dir of dirs) {
		const commandFiles = readdirSync(`${__dirname}/../commands/${dir}`).filter(
			(file) => file.endsWith(".js")
		);

		for (const file of commandFiles) {
			const command: Command = (
				await import(`file://${__dirname}/../commands/${dir}/${file}`)
			).default;

			client.commands.set(command.data.name, command);
		}
	}

	logger.info(`指令載入完成。(${client.commands.size})`);
}

export async function handleSlashCommand(
	client: import("discord.js").Client<true>,
	interaction: import("discord.js").ChatInputCommandInteraction<"cached">
) {
	const command = client.commands.get(interaction.commandName);

	if (!command) {
		return;
	}

	logger.debug(
		`@${interaction.user.username}使用指令：/${interaction.commandName}`
	);

	if (command.defer) {
		await interaction.deferReply({
			ephemeral: !!command.ephemeral
		});
	}
	if (interaction.commandName === "kill" || interaction.commandName === "rob") {
		const settings = await settingsDataDb.findOne({
			guildId: client.config.guildId
		});

		if (settings?.krSwitch === false) {
			await interaction.editReply(
				resolveReply(client.messages[interaction.commandName]["unavailable"], {
					$: client.messages.$,
					everyone: interaction.guild.roles.everyone,
					user: interaction.user
				})
			);
			return;
		}
	}
	if (command.game) {
		if (interaction.channelId !== client.config.channels.game) {
			command.defer
				? await interaction.editReply(
						resolveReply(client.messages["games"]["incorrect_channel"], {
							$: client.messages.$,
							everyone: interaction.guild.roles.everyone,
							user: interaction.user,
							channel: `<#${client.config.channels.game}>`
						})
					)
				: await interaction.reply(
						resolveReply(client.messages["games"]["incorrect_channel"], {
							$: client.messages.$,
							everyone: interaction.guild.roles.everyone,
							user: interaction.user,
							channel: `<#${client.config.channels.game}>`
						})
					);
			return;
		}

		const userData = await getUserData(client, interaction.user.id);

		if (userData.gamesData.ingame) {
			command.defer
				? await interaction.editReply(
						resolveReply(client.messages[interaction.commandName]["ingame"], {
							$: client.messages.$,
							everyone: interaction.guild.roles.everyone,
							user: interaction.user
						})
					)
				: await interaction.reply(
						resolveReply(client.messages[interaction.commandName]["ingame"], {
							$: client.messages.$,
							everyone: interaction.guild.roles.everyone,
							user: interaction.user
						})
					);
			return;
		}

		await userData.updateOne({
			$set: {
				"gamesData.ingame": true
			}
		});
		logger.debug(`@${interaction.user.username} 進入遊戲狀態。`);
	}
	if (
		command.leveling &&
		interaction.channelId !== client.config.channels.leveling
	) {
		command.defer
			? await interaction.editReply(
					resolveReply(client.messages["leveling"]["incorrect_channel"], {
						$: client.messages.$,
						everyone: interaction.guild.roles.everyone,
						user: interaction.user,
						channel: `<#${client.config.channels.leveling}>`
					})
				)
			: await interaction.reply(
					resolveReply(client.messages["leveling"]["incorrect_channel"], {
						$: client.messages.$,
						everyone: interaction.guild.roles.everyone,
						user: interaction.user,
						channel: `<#${client.config.channels.leveling}>`
					})
				);
		return;
	}

	command
		.run(client, interaction, {
			$: client.messages.$,
			everyone: interaction.guild.roles.everyone
		})
		.then(async () => {
			if (command.game) {
				await userDataDb.findOneAndUpdate(
					{
						guildId: client.config.guildId,
						userId: interaction.user.id
					},
					{
						$set: {
							"gamesData.ingame": false
						}
					}
				);
				logger.debug(`@${interaction.user.username} 離開遊戲狀態。`);
			}
		});
}
