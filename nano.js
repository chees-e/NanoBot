/* * * * * * * * * * * * * * */
/*          Made by          */
/*       pineappl#3507       */
/* * * * * * * * * * * * * * */

require("dotenv").config();
const {Client, Intents} = require("discord.js");
const Solver = require("./solver.js")
const Database = require("./database.js")

const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS]});

const dburi = "mongodb://127.0.0.1:27017/";
const dbname = "Nano";

client.once("ready", () => {
    Database.dbinit(dburi, dbname).then();
    console.log("Ready!")
})

client.on("messageCreate", async message => {
    if (message.channel.id == "736062482560450616") {
        Solver.run(client, message)
    }
})

client.login(process.env.TOKEN)