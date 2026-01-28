import Client from "../structures/Client";
import { LoggerProfile } from "../types";

export async function getLoggerProfile(client: Client, channelId: string) {
	const profileKeys = await client.db.keys("ascchannel_*");

	let rawProfile: string | null = null;
	let profile: LoggerProfile | null = null;
	const profiles: LoggerProfile[] = [];

	for (const key of profileKeys) {
		rawProfile = (await client.db.get(key))!;
		profile = JSON.parse(rawProfile) as LoggerProfile;

		if (!profile.logging_channel) {
			rawProfile = null;
			profile = null;
			continue;
		}
		if (profile.listened_channels.includes(channelId)) {
			profiles.push(profile);
		}
	}

	return profiles;
}
