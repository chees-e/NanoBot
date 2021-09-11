require("dotenv").config();

/*const cv = require("opencv4nodejs");
const jimp = require("jimp");
const { MongoAPIError } = require("mongodb");
const { locationy, locationx, locationlist } = require("./data");

// xhr.onload = function(e) {
//     if (e) {
//         console.log(e)
//     }
//     let arraybuffer = xhr.response;

//     console.log(arraybuffer)

//     const newmat = new cv.Mat(arraybuffer, 600, 800, cv.CV_8UC3);
//     console.log(newmat); 
// }

jimp.read("https://dhp5ttvnehc80.cloudfront.net/58b46dde00997b6a7697ffd87c140420.png")
.then(image => {
    let map = new cv.Mat(image.bitmap.data, image.bitmap.height, image.bitmap.width, cv.CV_8UC4);

    let startedmoving = false
    if (map.height != 600 || map.width != 800) {
        return;
    } else if (JSON.stringify(map.atRaw(130, 700)) != JSON.stringify([0, 255, 0, 255])) {
        startedmoving = true
    }
    // console.log(map.atRaw(581, 395))

    // let submap = map.getRegion(new cv.Rect(45, 45, 32, 32))

    // let tempmap = cv.imread("./locations/1.png", cv.IMREAD_UNCHANGED);
    // console.log(tempmap)
    // console.log(map.matchTemplate(tempmap, 1))

    if (!startedmoving) {
        let mapreceivedstring = "Date Map received, processing...\n";
        if (random.random() < 0.2) {
            mapreceivedstring += "P.S. with more and more people using " +
                                 "the bot, the wait times tend to be longer than usual at times. " +
                                 "Please be patient while I solve.";
        }
        message.channel.send(mapreceivedstring);
    }

    let _location_string = "";
    let radius = 16;

    for (let i = 0; i < locationy.length; i++) {
        for (let j = 0; j < locationx[i].length; j++) {
            let curry = locationy[i];
            let currx = locationx[i][j];

            let sub_image = map.getRegion(new cv.Rect(curry - radius, currx - radius, 2 * radius, 2 * radius));
            let highestres = -1;
            let highestlocation = "0";
            for (let k = 0; k < locationlist.length; k++) {
                let filename = `./locations/${locationlist[k]}.png`;
                let temp_img = cv.imread(filename, cv.IMREAD_UNCHANGED);
                let res = sub_image.matchTemplate(temp_img, cv.TM_CCOEFF_NORMED);
                if (res[0][0] > highest_res) {
                    highest_res = res[0][0];
                    highest_location = locationlist[k];
                }
            }
            _location_string = _location_string + highest_location;
        }
    }

    let _roadblock_string = "";

    for (let i = 0; i < roadblocky.length; i++) {
        for (let j = 0; j < roadblockx[i].length; j++) {
            let curry = roadblocky[i];
            let currx = roadblockx[i][j];

            if (JSON.stringify(map.atRaw(curry, currx)) == JSON.stringify([53, 86, 113, 255])) {
                _roadblock_string = _roadblock_string + "0";
            } else {
                _roadblock_string = _roadblock_string + "1";
            }
        }
    }

    let _direction = "";

    if (JSON.stringify(map.atRaw(581, 395)) == JSON.stringify([47, 108, 250, 255])) {
        _direction = "l";
    } else {
        _direction = "r";
    }

    if (startedmoving) {
        console.log(_location_string + _roadblock_string + _direction);
    }

    return _location_string + _roadblock_string + _direction;
})
.catch(err => {

    console.log(err)
})
*/

//milisec
function delay(sec) {
    return new Promise(resolve => setTimeout(resolve, sec))
}

msg = ""
const {Client, Intents} = require("discord.js");
const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS]});

client.once("ready", () => {
    console.log("Ready!")
})

client.on("messageCreate", async message => {
    let x = 0, y = 0;
    y++;
    if (message.author.id == "226588531772882945") {
        msg = message.content;
        await delay(10000);
        message.channel.send(x + "," + y);
    }
})

client.login("NDM1MzIxMzg1MDk1NzkwNjEy.YJNUNQ.apmeVf7XsA5DYLuSr3eRXNmc638");