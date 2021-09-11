const { MongoClient } = require("mongodb");

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

}

module.exports.cleancache = async (curtime) => {

}

// Server
module.exports.updateserver = async (id, usage) => {

}

module.exports.serverlb = async (id) => {

}

// Bot
module.exports.updatebot = async (sol) => {

}

module.exports.enablechannel = async (id, enabled) => {

}

module.exports.checkchannel = async (id) => {

}

// Subscription
module.exports.checksubs = async (id) => {
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

module.exports.updatesubs = async (id, endtime, warned) => {
    return new Promise((resolve, reject) => {
        subdb.findOne({id:id}).then(user => {
            if (user) {
                if (endtime > 0) user["endtime"] = endtime;
                user["warned"] = warned;
                subdb.updateOne({id:id}, {"$set": user})
                .then(user => {
                    resolve(user["id"]);
                }).catch(e => {
                    reject(`Database error: ${e}`);
                })
            } else {
                reject("no user");
            }
        }).catch(e => {
            reject(`Database error: ${e}`);
        })
    });
}


// User
module.exports.createuser = async (TODO) => {

}

module.exports.updateuser = async (sol) => {

}

module.exports.userlb = async (id) => {

}

module.exports.setpreference = async (id, pref) => {

}

module.exports.getpreference = async (id) => {

}