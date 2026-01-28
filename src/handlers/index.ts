import { Interaction } from "discord.js";
import Client from "../structures/Client";

export default function (
	type: "chatInputCommand" | "button"
): Promise<(client: Client<true>, interaction: Interaction) => void> {
	return import(`./${type}Handler`).then((h) => h.default);
}
