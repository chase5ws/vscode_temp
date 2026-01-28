import { Document, model, Schema, SchemaTypes, Types } from "mongoose";

interface UserData {
	guildId: string;
	userId: string;
	coins: number;
	chat4coins?: number;
	exp?: number;
	level?: number;
	timestamps: {
		work?: number;
		robbed?: number;
		killed?: number;
		dice?: number;
		roulette?: number;
		rps?: number;
		guess?: number;
		spring?: number;
	};
	dailyCommand: {
		onCooldown: boolean;
		streak: number;
		monthStreak: number;
	};
	workCommand: {
		unclaimSalary?: number;
		times: number;
	};
	gamesData: {
		killAttempts: number;
		killCooldown?: number;
		killTimes: number;
		robAttempts: number;
		robCooldown?: number;
		robTimes: number;
		gambleTimes: number;
		ingame: boolean;
		protected: number;
	};
	items: {
		[type: number]: {
			multiplier: number;
			startAt: number;
			duration: number;
		};
	};
	noEffectItems?: Map<string, number>;
}

export const userDataDb = model(
	"users",
	new Schema<UserData>({
		guildId: {
			type: SchemaTypes.String,
			required: true
		},
		userId: {
			type: SchemaTypes.String,
			required: true
		},
		coins: {
			type: SchemaTypes.Number,
			required: true,
			default: 0
		},
		chat4coins: {
			type: SchemaTypes.Number,
			required: false
		},
		exp: {
			type: SchemaTypes.Number,
			required: false
		},
		level: {
			type: SchemaTypes.Number,
			required: false
		},
		timestamps: {
			work: {
				type: SchemaTypes.Number,
				required: false
			},
			robbed: {
				type: SchemaTypes.Number,
				required: false
			},
			killed: {
				type: SchemaTypes.Number,
				required: false
			},
			dice: {
				type: SchemaTypes.Number,
				required: false
			},
			roulette: {
				type: SchemaTypes.Number,
				required: false
			},
			rps: {
				type: SchemaTypes.Number,
				required: false
			},
			guess: {
				type: SchemaTypes.Number,
				required: false
			},
			spring: {
				type: SchemaTypes.Number,
				required: false
			}
		},
		dailyCommand: {
			onCooldown: {
				type: SchemaTypes.Boolean,
				required: true,
				default: false
			},
			streak: {
				type: SchemaTypes.Number,
				required: true,
				default: 0
			},
			monthStreak: {
				type: SchemaTypes.Number,
				required: true,
				default: 0
			}
		},
		workCommand: {
			unclaimSalary: {
				type: SchemaTypes.Number,
				required: false
			},
			times: {
				type: SchemaTypes.Number,
				required: true,
				default: 0
			}
		},
		gamesData: {
			killAttempts: {
				type: SchemaTypes.Number,
				required: true,
				default: 0
			},
			killCooldown: {
				type: SchemaTypes.Number,
				required: false
			},
			killTimes: {
				type: SchemaTypes.Number,
				required: true,
				default: 0
			},
			robAttempts: {
				type: SchemaTypes.Number,
				required: true,
				default: 0
			},
			robCooldown: {
				type: SchemaTypes.Number,
				required: false
			},
			robTimes: {
				type: SchemaTypes.Number,
				required: true,
				default: 0
			},
			gambleTimes: {
				type: SchemaTypes.Number,
				required: true,
				default: 0
			},
			ingame: {
				type: SchemaTypes.Boolean,
				required: true,
				default: false
			},
			protected: {
				type: SchemaTypes.Number,
				required: false
			}
		},
		items: {
			0: {
				multiplier: {
					type: SchemaTypes.Number,
					required: false
				},
				startAt: {
					type: SchemaTypes.Number,
					required: false
				},
				duration: {
					type: SchemaTypes.Number,
					required: false
				}
			},
			1: {
				multiplier: {
					type: SchemaTypes.Number,
					required: false
				},
				startAt: {
					type: SchemaTypes.Number,
					required: false
				},
				duration: {
					type: SchemaTypes.Number,
					required: false
				}
			}
		},
		noEffectItems: {
			type: SchemaTypes.Map,
			required: false
		}
	})
);

export type UserDataDoc = Document<unknown, any, UserData> &
	UserData & {
		_id: Types.ObjectId;
	};
