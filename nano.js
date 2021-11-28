/* * * * * * * * * * * * * * */
/*          Made by          */
/*       pineappl#3507       */
/* * * * * * * * * * * * * * */

require("dotenv").config();
const {Client, Intents, MessageEmbed, Permissions, MessageSelectMenu} = require("discord.js");
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
        curchannel.send(`<@226588531772882945> I've been added to server ${guild.name} (${guild.id})`).catch(e => {});
    });
});

client.on("guildDelete", (guild) => {
    client.channels.fetch(Solver.logchannel).then(curchannel => {
        curchannel.send(`<@226588531772882945> I've been removed from server ${guild.name} (${guild.id})`).catch(e => {});
    });
});

client.on("messageCreate", async message => {
    if (message.author.id == client.user.id) {
        return;
    }

    if (message.content.startsWith("<@664574956302237696>")) { 
        message.channel.send("Hi, I am a date solver made by pineappl#2507. Use `nanohelp` to see what I can do.");
    }

    if (message.content.toLowerCase() == "nanohelp") {
        message.channel.send({embeds: [
            new MessageEmbed()
            .setTitle("Nano Help")
            .setDescription(`List of commands:\n` +
                "`nanoenable`: enables Nano on a channel\n" +
                "`nanodisable`: disables Nano on a channel\n" +
                "`nanoping`: see the bot latency\n" +
                "`nanocd`: see your date cooldowns\n" + 
                "`nanoremove <code>`: removes a character from your nanocd\n" +
                "`nanosubs`: checks the remaining time for your subscription\n" +
                "`nanoserver`: get the link to Nano's server\n" + 
                "`nanostats`: get your stats about karuta dates that was recorded by Nano"
            )
        ]});
    }

    if (true || message.author.id == "226588531772882945") {
        if (message.content.toLowerCase() == "nanoenable") {
            if (message.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
                Database.enablechannel(message.guild.id, message.channel.id, true).then(result => {
                    message.reply(result).catch(e => {console.log(e)});
                    client.channels.fetch(Solver.logchannel).then(curchannel => {
                        curchannel.send(`<@226588531772882945> I've enabled on channel ${message.channel.name} (${message.channel.id})`).catch(e => {});
                    });
                    return;
                }).catch(e => {
                    console.log(e)
                });
            } else {
                message.reply("You need `Manage Channels` permission to use this command").catch(e => {});
                return;
            }
        } else if (message.content.toLowerCase() == "nanodisable") {
            if (message.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
                Database.enablechannel(message.guild.id, message.channel.id, false).then(result => {
                    message.reply(result).catch(e => {});
                    client.channels.fetch(Solver.logchannel).then(curchannel => {
                        curchannel.send(`<@226588531772882945> I've disabled on channel ${message.channel.name} (${message.channel.id})`).catch(e => {});
                    });
                    return;
                }).catch(e => {
                    console.log(e)
                });
            } else {
                message.reply("You need `Manage Channels` permission to use this command").catch(e => {});
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
                    message.channel.send({embeds:[rvembed]}).catch(e => {});
                    return;
                }).catch(e => {
                    console.log(e)
                    return;
                });
            }

            if (message.content.toLowerCase() == "nanoping") {
                message.channel.send(`Pong! In ${Math.round(client.ws.ping)}ms`).catch(e => {});
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
                        message.channel.send({embeds:[rvembed]}).catch(e => {});
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

            if (message.content.toLowerCase().startsWith("nanoremove ")) {
                Database.getuser(message.author.id).then(curuser => {
                    if (!curuser["cooldown"]) {
                        curuser["cooldown"] = {}
                    }

                    let delname = message.content.slice(11);
                    let deletedname = false;
                    let deletedcode = false;
                    if (curuser["cooldown"][delname]) {
                        let deletedchar = curuser["cooldown"][delname];
                        deletedname = deletedchar["name"];
                        deletedcode = deletedchar["code"];
                        delete curuser["cooldown"][delname];
                        Database.upsertuser(message.author.id, curuser);
                    } else {
                        for (let char in curuser["cooldown"]) {
                            if (curuser["cooldown"][char]["code"] == delname) {
                                let deletedchar = curuser["cooldown"][char];
                                deletedname = deletedchar["name"];
                                deletedcode = deletedchar["code"];
                                delete curuser["cooldown"][char];
                                Database.upsertuser(message.author.id, curuser);
                            }
                        }
                    }

                    if (deletedname) {
                        message.channel.send(`Character **${deletedname}** (\`${deletedcode}\`) has successfuly been removed from your cooldown list.`).catch(e => {});
                        return;
                    } else {
                        message.channel.send(`Character/code **${delname}** cannot be found in your cooldown list.\n`+
                                                "Make sure the letters are exact (copying and pasting is reccomended).").catch(e => {});
                        return;
                    }
                })
                return;
            }


            if (message.content.toLowerCase() == "nanosubs" || message.content.toLowerCase() == "nanosubscription") {
                let rvembed;
                Database.checksubs(message.author.id).then(curuser => {
                    let enddate = new Date(parseInt(curuser["end"])*1000);

                    rvembed = new MessageEmbed()
                    .setTitle("Nano Subscription")
                    .setDescription(`Ends on: ${enddate.toString()}\nRemaining time: ~ **${Math.floor(curuser["timeremain"]/24)}** Day(s) **${Math.round(curuser["timeremain"]%24)}** Hour(s).`)
                    .setFooter(text="Note: If you have just subscribed or updated your subscription it might take some time for it to update in the system");   
                    message.channel.send({embeds:[rvembed]}).catch(e => {});
                    return;
                }).catch(e => {
                    console.log(e);
                    rvembed = new MessageEmbed()
                    .setTitle("Nano Subscription")
                    .setDescription("You don't seem to be subscribed/your subscription details isn't available at the moment.\nIf you are not subscribed and wish to, [you can join our server to get started.](https://discord.gg/ckBYm4pUHm)")
                    .setFooter(text="Note: If you have just subscribed or updated your subscription it might take some time for it to update in the system");    
                    message.channel.send({embeds:[rvembed]}).catch(e => {});
                    return;
                })

            }

            if (message.content.toLowerCase() == "nanoserver") {
                message.channel.send("Here is the link to the server:\nhttps://discord.gg/ckBYm4pUHm").catch(e => {});
                return;
            }

            if (message.content.toLowerCase().startsWith("nanoextend ")) {
                if (!Solver.admins.includes(message.author.id)) {
                    message.channel.send("You are not permitted to use that command").catch(e => {});
                    return;
                } 
                try {
                    userid = message.content.split(" ")[1];
                } catch(e) {
                    message.channel.send(`Something went wrong: ${e}`).catch(e => {});
                    return;
                }

                Database.updatesubs(userid, Math.round(Date.now()/1000 + 60 * 60 * 24 * 7), false, 1).then(result => {
                    console.log(result)
                    client.users.fetch(userid).then(tempuser => {
                        console.log(`${tempuser.username}'s (${tempuser.id}) subscription extended <@226588531772882945>.`);
                        message.channel.send(`${tempuser.username}'s (${tempuser.id}) subscription extended <@226588531772882945>.`).catch(e => {});
                        return;
                    }).catch(err => {
                        message.channel.send(`Something went wrong: ${err}`).catch(e => {})
                        return;
                    });
                })
                .catch(err => {
                    message.channel.send(`Something went wrong: ${err}`).catch(e => {});
                    return;
                });
            }

            let args = "";

            if (message.content.toLowerCase().startsWith("nanosolve ")) {
                let mid = message.content.split(" ")[1];
                try {
                    args = message.content.split(" ")[2]
                } catch (e) {}

                if (mid.includes("/")) {
                    mid = mid.split("/").pop();
                }

                message.channel.messages.fetch(mid).then(curmsg => {
                    if (!curmsg) {
                        message.channel.send("Invalid message ID/link. Make sure that the message is in this channel.").catch(e => {});
                        return;
                    } else {
                        Solver.run(client, curmsg, args);
                        return;
                    }
                }).catch(e => {
                    message.channel.send("Invalid message ID/link. Make sure that the message is in this channel.").catch(e => {});
                    return;
                })
            }

            Solver.run(client, message, args)
        }
    })
    .catch(e => {});
})

client.login(process.env.TOKEN)