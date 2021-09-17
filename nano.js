/* * * * * * * * * * * * * * */
/*          Made by          */
/*       pineappl#3507       */
/* * * * * * * * * * * * * * */

require("dotenv").config();
const {Client, Intents, MessageEmbed, Permissions} = require("discord.js");
const Solver = require("./solver.js")
const Database = require("./database.js")

const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS]});

const dburi = "mongodb://127.0.0.1:27017/";
const dbname = "Nano";

// const vipchannels = [];
// const announcementchannels = [];
// const staff_roles = [];
// const logchannel = "";

client.once("ready", () => {
    Database.dbinit(dburi, dbname).then();
    console.log("Ready!")
})

client.on("guildCreate", (guild) => {
    client.channels.fetch(Solver.logchannel).then(curchannel => {
        curchannel.send(`<@226588531772882945> I've been added to server ${guild.name} (${guild.id})`);
    });
});

client.on("guildDelete", (guild) => {
    client.channels.fetch(Solver.logchannel).then(curchannel => {
        curchannel.send(`<@226588531772882945> I've been removed from server ${guild.name} (${guild.id})`);
    });
});

client.on("messageCreate", async message => {
    if (message.author.id == client.user.id) {
        return;
    }

    if (message.author.id == "226588531772882945") {
        if (message.content.toLowerCase() == "nanoenable") {
            if (message.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
                Database.enablechannel(message.guild.id, message.channel.id, true).then(result => {
                    message.reply(result);
                    return;
                });
            } else {
                message.reply("You need `Manage Channels` permission to use this command");
                return;
            }
        } else if (message.content.toLowerCase() == "nanodisable") {
            if (message.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
                Database.enablechannel(message.guild.id, message.channel.id, false).then(result => {
                    message.reply(result);
                    return;
                });
            } else {
                message.reply("You need `Manage Channels` permission to use this command");
                return;
            }
        }
    }

    Database.checkchannel(message.guild.id, message.channel.id).then(channelenabled => {
        if (Solver.limitlesschannels.includes(message.channel.id) || channelenabled) {
            if (message.content.toLowerCase() == "nanostats") {
                Database.getuser(message.author.id).then(curuser => {
                    let desc = `Total usage: ${curuser['usage']} \n` +
                    `Total AP earned: ${curuser['ap']}\n` + 
                    `Times went home:  ${curuser['home']}\n` +
                    `Rings Acquired:  ${curuser['ring']}\n` +
                    `Shopping Acquired:  ${curuser['shopping']}\n` +
                    `Failed dates:  ${curuser['failed']}\n` + 
                    `Perfect dates:  ${curuser['perfect']}\n`;

                    let rvembed = new MessageEmbed()
                    .setTitle(`${message.author.username}'s stats`)
                    .setDescription(desc)
                    .setFooter("Stats are collected after August 11th 2021.");            
                    message.channel.send({embeds:[rvembed]});
                    return;
                }).catch(e => {
                    console.log(e)
                    return;
                });
            }

            if (message.content.toLowerCase() == "nanoping") {
                message.channel.send(`Pong! In ${Math.round(client.ws.ping)}ms`);
                return;
            }

            if (message.content.toLowerCase() == "nanocd" || message.content.toLowerCase() == "nanocooldown") {
                Database.getuser(message.author.id).then(curuser => {
                    try {
                        if (!curuser["cooldown"]) curuser["cooldown"] = {};

                        let chars = []
                        for (let char in curuser["cooldown"]) {
                            chars.push([curuser["cooldown"][char], curuser["cooldown"][char]["time"]])
                        }

                        chars.sort((a, b) => { return a[1] - b[1] });
            
                        let desc = ""
                        if (chars.length <= 0) desc = "Nano has not collected any data yet.";
                        for (let i = 0; i < 10 && i < chars.length; i++) {
                            let nextchar = chars[i][0];
                            let datecooldown;
                            if (nextchar['time'] - Date.now()/1000 <= 0) {
                                datecooldown = "Ready"
                            } else {
                                datecooldown = Math.round((nextchar['time'] - Date.now()/1000)/3600) + " hour(s)"
                            }
                            desc = desc + `${i + 1}. \`${nextchar['code']}\` · **${nextchar['name']}** · Date Cooldown: ${datecooldown}\n`;
                        }
                        let rvembed = new MessageEmbed()
                        .setTitle("Date Cooldowns")
                        .setDescription(desc)
                        .setFooter(text="Disclaimer:\n"+
                                        "The cooldown time does not include the time you spent on completing the date.\n"+
                                        "It also does not detect when you fail a date.\n"+
                                        "Use *nanoremove <name/code>* if you wish a character to be removed from this list")
                        message.channel.send({embeds:[rvembed]});
                        return;
                    } catch(e) {
                        console.log(e)
                        return
                    }
                }).catch(e => {
                    console.log(e)
                    return;
                });
            }

            // if (mess)

            if (message.content.startsWith("nanoextend ")) {
                if (!Solver.admins.includes(message.author.id)) {
                    message.channel.send("You are not permitted to use that command");
                    return;
                } 
                try {
                    userid = message.content.split(" ")[1];
                } catch(e) {
                    message.channel.send(`Something went wrong: ${e}`);
                    return;
                }

                Database.updatesubs(userid, Date.now()/1000 + 60 * 60 * 24, false, 1).then(result => {
                    client.users.fetch(userid).then(tempuser => {
                        console.log(`${tempuser.username}'s (${tempuser.id}) subscription extended <@226588531772882945>.`)
                        message.channel.send(`${tempuser.username}'s (${tempuser.id}) subscription extended <@226588531772882945>.`)
                        return
                    }).catch(err => {
                        message.channel.send(`Something went wrong: ${err}`);
                        return;
                    });
                })
                .catch(err => {
                    message.channel.send(`Something went wrong: ${err}`);
                    return;
                });
            }

            Solver.run(client, message)
        }
    });
})

client.login(process.env.TOKEN)