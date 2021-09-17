const { MongoClient, Long } = require("mongodb");

let db = null;

let recentdb = null;
let serverdb = null;
let botdb = null
let subdb = null;
let userdb = null;

module.exports.dbinit = async (uri, dbname) => {
    client = new MongoClient(uri, { useUnifiedTopology: true});
    await client.connect();
    db = await client.db(dbname);
    recentdb = db.collection("recent");
    serverdb = db.collection("serverstats");
    botdb = db.collection("stats");
    subdb = db.collection("subscription");
    userdb = db.collection("userstats");
}


// Cache
module.exports.checkcache = async (inputstring) => {
    return new Promise((resolve, reject) => {
        recentdb.findOne({id:inputstring}).then(recent => {
            if (recent) {
                resolve(recent);
            } else {
                reject("no results");
            }
        }).catch(e => {
            reject(`Database error: ${e}`);
        });
    });
}

module.exports.updatecache = async (inputstring, link, ring, time, imurl, solution) => {
    return new Promise((resolve, reject) => {
        let newcache = {
            id: inputstring,
            link: link,
            ring: ring,
            time: time,
            solution: solution
        };
        if (imurl) {
            newcache["imgurl"] = imurl;
        }
        recentdb.updateOne({id:inputstring}, {"$set":newcache}, {"upsert": true}).then(result => {
            resolve(result);
        }).catch(e => {
            reject(`Database error: ${e}`);         
        })
    });
}

module.exports.cleancache = async () => {
    let currentdate = new Date();
    let curtime = currentdate.getTime()/1000;
    return new Promise((resolve, reject) => {
        recentdb.deleteMany({"time": {"$lt": curtime}}).then(result => {
            resolve(result);
        }).catch(e => {
            reject(`Database error: ${e}`);         
        })
    });
}

// Server
module.exports.updateserver = async (id) => {
    id = Long.fromString(id);
    return new Promise((resolve, reject) => {
        serverdb.findOne({id: id}).then(server => {
            if (!server) {
                server = {
                    id: id,
                    usage: 0,
                    enabled: []
                };
            }
            server["usage"] += 1;
            serverdb.updateOne({id: id}, {"$set": server}).then(result => {
                resolve(result);
            }).catch(e => {
                reject(`Database error: ${e}`);
            })
        }).catch(e => {
            reject(`Database error: ${e}`);
        })

    });
}

module.exports.serverlb = async (id) => {

}

// Bot
module.exports.updatebot = async (sol) => {
    return new Promise((resolve, reject) => {
        botdb.findOne({id: 0}).then(botstat => {
            botstat["usage"] += 1;
            if (!sol) {
                user["failed"] += 1;
            }
            let ap = Math.ceil(sol["resources"].slice(1).reduce((a,b) => a+b) * sol["moves"].length / 25 / 6);
            botstat["ap"] += ap;

            if (sol["home"]) {
                botstat["home"] += 1;
            }
            
            if (sol["resources"].slice(1).reduce((a,b) => a+b) >= 300) {
                botstat["perfect"] += 1;
            }
            
            if (sol["shopping"]) {
                botstat["shopping"] += 1;
            }

            if (sol["ring"]) {
                botstat["ring"] += 1;
            }

            if (sol["time"] < botstat["fastest"]) {
                botstat["fastest"] = sol["time"];
            }
            if (sol["time"] > botstat["slowest"]) {
                botstat["slowest"] = sol["time"]
            }

            botdb.updateOne({id: 0}, {"$set": botstat}).then(result => {
                resolve(result);
            }).catch(e => {
                reject(`Database error: ${e}`);
            })
        }).catch(e => {
            reject(`Database error: ${e}`);
        })

    });
}

module.exports.enablechannel = async (guildid, channelid, enabled) => {
    guildid = Long.fromString(guildid);
    return new Promise((resolve, reject) => {
        serverdb.findOne({id:guildid}).then(guild => {
            if (!guild) {
                guild = {
                    id: guildid,
                    usage: 0,
                    enabled: []
                };
            }
            if (!guild["enabled"]) {
                guild["enabled"] = [];
            }
            if (enabled) {
                if (guild["enabled"].includes(channelid)) {
                    resolve("Channel already enabled");
                } else {
                    guild["enabled"].push(channelid);
                    serverdb.updateOne({id:guildid}, {"$set":guild}, {"upsert": true});
                    resolve(`Channel ${channelid} enabled`);
                }
            } else {
                if (guild["enabled"].includes(channelid)) {
                    guild["enabled"].splice(guild["enabled"].indexOf(channelid), 1);
                    serverdb.updateOne({id:guildid}, {"$set":guild}, {"upsert": true});
                    resolve(`Channel ${channelid} disabled`);
                } else {
                    resolve("Channel already enabled");
                }          
            }
        }).catch(e => {
            reject(`Database error: ${e}`);
        });
    });
}

module.exports.checkchannel = async (guildid, channelid) => {
    guildid = Long.fromString(guildid);
    return new Promise((resolve, reject) => {
        serverdb.findOne({id:guildid}).then(guild => {
            if (!guild) {
                reject("No server found");
            }
            if (!guild["enabled"]) {
                guild["enabled"] = [];
            }
            resolve(guild["enabled"].includes(channelid))
        }).catch(e => {
            reject(`Database error: ${e}`);
        });
    });
}

// Subscription
module.exports.checksubs = async (id) => {
    id = Long.fromString(id);

    return new Promise((resolve, reject) => {
        subdb.findOne({id:id}).then(user => {
            if (user) {
                let now = new Date();
                let timeremain = (parseInt(user["end"]) - Math.floor(now.getTime()/1000))/3600;
                let rv = {
                    "timeremain": timeremain,
                    "warned": user["warned"]
                };
                resolve(rv);
            } else {
                reject("no user");
            }
        }).catch(e => {
            reject(`Database error: ${e}`);
        });
    });
}

module.exports.updatesubs = async (id, endtime, warned, type) => {
    id = Long.fromString(id);
    return new Promise((resolve, reject) => {
        subdb.findOne({id:id}).then(user => {
            if (user) {
                if (endtime > 0) user["endtime"] = endtime;
                if (type > 0) user["type"] = type;
                user["warned"] = warned;
            } else {
                user = {
                    id: id,
                    endtime: endtime,
                    warned: warned,
                    type: type
                }
            }
            subdb.updateOne({id:id}, {"$set": user}, {"upsert": true})
            .then(user => {
                resolve(user["id"]);
            }).catch(e => {
                reject(`Database error: ${e}`);
            })

        }).catch(e => {
            reject(`Database error: ${e}`);
        })
    });
}

module.exports.getuser = async (id) => {
    id = Long.fromString(id);

    return new Promise((resolve, reject) => {
        userdb.findOne({id:id}).then(user => {
            if (!user) {
                reject("no results");
            } else {
                resolve(user);
            }
        }).catch(e => {
            reject(`Database error: ${e}`);
        });
    });
}

module.exports.updateuser = async (message, sol) => {
    return new Promise((resolve, reject) => {
        let uid = Long.fromString(message.author.id);
        let cardname = "";
        let cardcode = "";

        try {
            if (message.embeds){
                if (message.embeds[0].image.url){
                    uid = Long.fromString(message.embeds[0].description.split("@")[1].split(">")[0]);
                    cardname = message.embeds[0].description.split("**")[1];
                    cardcode = message.embeds[0].description.split("`")[1];
                }
            }
        } catch (e) {
            
        }
        userdb.findOne({id: uid}).then(user => {
            if (!user) {
                user = {
                    id: uid,
                    usage: 0,
                    ap: 0,
                    failed: 0,
                    perfect: 0,
                    ring: 0,
                    home: 0,
                    shopping: 0,
                    pref: 0,
                    cooldown: {}
                }
            }

            user["usage"] += 1;
            if (!sol) {
                user["failed"] += 1;
            }
            let ap = Math.ceil(sol["resources"].slice(1).reduce((a,b) => a+b) * sol["moves"].length / 25 / 6);
            user["ap"] += ap;

            if (sol["home"]) {
                user["home"] += 1;
            }
            
            if (sol["resources"].slice(1).reduce((a,b) => a+b) >= 300) {
                user["perfect"] += 1;
            }
            
            if (sol["shopping"]) {
                user["shopping"] += 1;
            }

            if (sol["ring"]) {
                user["ring"] += 1;
            }

            if (cardname) {
                let currentdate = new Date();
                let curtime = currentdate.getTime()/1000;                    
                let cooldown = curtime + 10 * 60 * 60;
                if (!sol) {
                    cooldown += 14 * 60 * 60;
                }
                user["cooldown"][cardname] = {"name": cardname, "code": cardcode, "time": cooldown}
            }

            userdb.updateOne({id: uid}, {"$set": user}, {"upsert": true}).then(result => {
                resolve(result);
            }).catch(e => {
                reject(`Database error: ${e}`);
            })
        }).catch(e => {
            reject(`Database error: ${e}`);
        })

    });
}

module.exports.userlb = async (id) => {

}

module.exports.setpreference = async (id, pref) => {

}

module.exports.getpreference = async (id) => {

}