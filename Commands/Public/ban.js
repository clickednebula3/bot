const ModLog = require("./../../Modules/ModerationLogging.js");
const getUser = require("./../../Modules/GetUserWithoutREST.js");

/* eslint-disable max-len */
module.exports = async (bot, db, config, winston, userDocument, serverDocument, channelDocument, memberDocument, msg, suffix, commandData) => {
	const canBan = member => {
		if (msg.channel.guild.ownerID === msg.author.id) {
			return true;
		}
		let admin = 0;
		msg.member.roles.forEach(roleID => {
			let urole = msg.channel.guild.roles.get(roleID);
			if (urole) {
				if (urole.position > admin) {
					admin = urole.position;
				}
			}
		});
		let target = 0;
		member.roles.forEach(roleID => {
			let urole = msg.channel.guild.roles.get(roleID);
			if (urole) {
				if (urole.position > target) {
					target = urole.position;
				}
			}
		});
		if (admin > target) {
			return true;
		} else {
			return false;
		}
	};
	if (suffix) {
		let member, reason;
		const split = suffix.split("|");
		const isUserID = new RegExp(/^\d+$/).test(split[0].trim());
		if (isUserID && split.length === 2) {
			member = await getUser(bot, split[0].trim());
			reason = split[1].trim();
		} else if (split.length === 2) {
			member = bot.memberSearch(split[0].trim(), msg.channel.guild);
			reason = split[1].trim();
		} else if (isUserID) {
			member = await getUser(bot, split[0].trim());
			reason = "unspecified reason..";
		} else {
			member = bot.memberSearch(suffix.trim(), msg.channel.guild);
			reason = "unspecified reason..";
		}
		if (member) {
			let m = await msg.channel.createMessage({
				embed: {
					color: 0x9ECDF2,
					author: {
						name: `Waiting on @${bot.getName(msg.channel.guild, serverDocument, msg.member)}'s imput..`,
					},
					description: isUserID ? `Are you sure you want to ban **${member.username}**?` : `Are you sure you want to ban **@${bot.getName(msg.channel.guild, serverDocument, member)}**?`,
					footer: {
						text: `They won't be able to join again unless they get unbanned!`,
					},
				},
			});
			bot.awaitMessage(msg.channel.id, msg.author.id, async message => {
				try {
					await message.delete();
				} catch (err) {
					// Ignore error
				}
				if (config.yes_strings.includes(message.content.trim())) {
					try {
						if (isUserID) {
							if (msg.channel.guild.members.get(member.id) !== undefined && canBan(msg.channel.guild.members.get(member.id))) {
								try {
									const dm = await bot.users.get(member.id).getDMChannel();
									dm.createMessage({
										embed: {
											color: 0xFF0000,
											description: `Oh no, you just got banned from \`${msg.channel.guild.name}\`!\n`,
											fields: [
												{
													name: `Banned by`,
													value: `${msg.author.tag}`,
													inline: true,
												},
												{
													name: `Reason`,
													value: `${reason}`,
													inline: true,
												},
											],
											thumbnail: {
												url: `${msg.channel.guild.iconURL}`,
											},
										},
									});
								} catch (err) {
									// Ignore error
								}
								await msg.channel.guild.banMember(member.id, 1, `${reason} | Command issued by @${bot.getName(msg.channel.guild, serverDocument, msg.member)}`);
								m.edit({
									embed: {
										color: 0x00FF00,
										description: `Bye-bye **${bot.getName(msg.channel.guild, serverDocument, { user: member })}** 🔨`,
										image: {
											url: `https://s20.postimg.org/tgzeq0nb1/b1nzyblobban.gif`,
										},
										footer: {
											text: `You banned someone via a user ID (${member.id})!`,
										},
									},
								});
								ModLog.create(msg.channel.guild, serverDocument, "Ban", { user: member }, msg.member, reason);
							} else if (msg.channel.guild.members.get(member.id) !== undefined && !canBan(msg.channel.guild.members.get(member.id))) {
								m.edit({
									embed: {
										color: 0xFF0000,
										description: `You don't have permission to ban this user...`,
										footer: {
											text: `You should ask someone who is higher than you to run this!`,
										},
									},
								});
							} else {
								try {
									const dm = await bot.users.get(member.id).getDMChannel();
									dm.createMessage({
										embed: {
											color: 0xFF0000,
											description: `Oh no, you just got "hack" banned from \`${msg.channel.guild.name}\`!\n`,
											fields: [
												{
													name: `Banned by`,
													value: `${msg.author.tag}`,
													inline: true,
												},
												{
													name: `Reason`,
													value: `${reason}`,
													inline: true,
												},
											],
											thumbnail: {
												url: `${msg.channel.guild.iconURL}`,
											},
											footer: {
												text: `Don't know what "hack banning" means? It means that you got banned from a server via your user ID.`,
											},
										},
									});
								} catch (err) {
									// Ignore error
								}
								await msg.channel.guild.banMember(member.id, 1, `${reason} | Command issued by @${bot.getName(msg.channel.guild, serverDocument, msg.member)}`);
								m.edit({
									embed: {
										color: 0x00FF00,
										description: `Bye-bye **${bot.getName(msg.channel.guild, serverDocument, { user: member })}** 🔨`,
										image: {
											url: `https://s20.postimg.org/tgzeq0nb1/b1nzyblobban.gif`,
										},
										footer: {
											text: `You banned someone via a user ID (${member.id})!`,
										},
									},
								});
								ModLog.create(msg.channel.guild, serverDocument, "Ban", { user: member }, msg.member, reason);
							}
						} else if (canBan(member)) {
							try {
								const dm = await bot.users.get(member.user.id).getDMChannel();
								dm.createMessage({
									embed: {
										color: 0xFF0000,
										description: `Oh no, you just got banned from \`${msg.channel.guild.name}\`!\n`,
										fields: [
											{
												name: `Banned by`,
												value: `${msg.author.tag}`,
												inline: true,
											},
											{
												name: `Reason`,
												value: `${reason}`,
												inline: true,
											},
										],
										thumbnail: {
											url: `${msg.channel.guild.iconURL}`,
										},
									},
								});
							} catch (err) {
								// Ignore error
							}
							await member.ban(1, `${reason} | Command issued by @${bot.getName(msg.channel.guild, serverDocument, msg.member)}`);
							m.edit({
								embed: {
									color: 0x00FF00,
									description: `Bye-bye **@${bot.getName(msg.channel.guild, serverDocument, member)}** 🔨`,
									image: {
										url: `https://s20.postimg.org/tgzeq0nb1/b1nzyblobban.gif`,
									},
								},
							});
							ModLog.create(msg.channel.guild, serverDocument, "Ban", member, msg.member, reason);
						} else {
							m.edit({
								embed: {
									color: 0xFF0000,
									description: `You don't have permission to ban this user...`,
									footer: {
										text: `You should ask someone who is higher than you to run this!`,
									},
								},
							});
						}
					} catch (err) {
						if (isUserID) {
							winston.error(`Failed to ban member "${member.username}" from server "${msg.channel.guild.name}"`, { svrid: msg.channel.guild.id, usrid: member }, err.message);
						} else {
							winston.error(`Failed to ban member "${member.user.username}" from server "${msg.channel.guild.name}"`, { svrid: msg.channel.guild.id, usrid: member.id }, err.message);
						}
						m.edit({
							embed: {
								color: 0xFF0000,
								description: isUserID ? `I couldn't ban **${bot.getName(msg.channel.guild, serverDocument, { user: member })}**! 🍇` : `I couldn't ban **@${bot.getName(msg.channel.guild, serverDocument, member)}**! 🍇`,
								footer: {
									text: `Either I don't have the "Ban Members" permission, the user was already banned, or the user isn't in this server!`,
								},
							},
						});
					}
				} else {
					m.edit({
						embed: {
							color: 0x00FF00,
							description: `Ban canceled! 😓`,
						},
					});
				}
			});
		} else {
			msg.channel.createMessage({
				embed: {
					color: 0xFF0000,
					description: `I couldn't find a matching member on this server...`,
					footer: {
						text: `If you have a User ID, you can run "${bot.getCommandPrefix(msg.channel.guild, serverDocument)}${commandData.name} ID" to ban the user.`,
					},
				},
			});
		}
	} else {
		let m = await msg.channel.createMessage({
			embed: {
				color: 0xFF0000,
				description: `Do you want me to ban you? 😮`,
				footer: {
					text: `That means you should mention who you want to ban and give an optional reason...`,
				},
			},
		});
		bot.awaitMessage(msg.channel.id, msg.author.id, async message => {
			if (config.yes_strings.includes(message.content.trim())) {
				try {
					await message.delete();
				} catch (err) {
					// Ignore error
				}
				m.edit({
					embed: {
						color: 0xFF0000,
						description: `Ok! Bye-Bye!`,
						footer: {
							text: `Its just a prank bro! I guess you could say.. you found an Easter Egg...`,
						},
					},
				});
			}
		});
	}
};