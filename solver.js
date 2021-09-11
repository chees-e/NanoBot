/* * * * * * * * * * * * * * */
/*          Made by          */
/*       pineappl#3507       */
/* * * * * * * * * * * * * * */

const cv = require("opencv4nodejs");
const jimp = require("jimp")
const {MessageEmbed} = require("discord.js");
const Database = require("./database.js")

// TODO scoring
// [0] Settings //
let max_iteration = 10000000;
let debug = false;
let maintenance = false;
let airplane = false;

let vipchannels = ["736062482560450616"];
let limitlesschannels = [];
let announcementchannels = [];
let logchannel = "";

const { 
    initial_resource, 
    cur_row, 
    cur_col, 
    cur_turn, 
    respawn_matrix, 
    locationlist, 
    locationy, 
    locationx, 
    roadblocky, 
    roadblockx, 
    location_emojis, 
    denotations, 
    updates, 
    refill, 
    distance_matrix0,
    distance_matrix, 
    distance_matrixl0, 
    distance_matrixl,
    distance_matrixr0,  
    distance_matrixr, 
    distance_matrixu
} = require("./data.js");

// [1] Functions //
function delay(sec) {
    return new Promise(resolve => setTimeout(resolve, sec))
}

function matchpixel(img1, img2){
    if (!(img1.rows == img2.rows && img1.cols == img2.cols && img1.channels == img2.channels)) return -1;

    let r = img1.rows, c = img1.cols;
    let res = 0;
    for (let i = 0; i < r; i++) {
        for (let j = 0; j < c; j++){
            if (JSON.stringify(img1.atRaw(i, j)) == JSON.stringify(img2.atRaw(i, j))) res += 1;
        }
    }
    return res;
}

function getinput(img_url, message, starttime, uid) {
    jimp.read(img_url)
    .then(async image => {
        let map = new cv.Mat(image.bitmap.data, image.bitmap.height, image.bitmap.width, cv.CV_8UC4);

        map = map.cvtColor(cv.COLOR_RGBA2BGRA);
        let startedmoving = false
        if (map.rows != 600 || map.cols != 800) {
            return;
        } else if (JSON.stringify(map.atRaw(130, 700)) != JSON.stringify([0, 255, 0, 255])) {

            startedmoving = true
        }

        let _location_string = "";
        let radius = 16;

        for (let i = 0; i < locationy.length; i++) {
            for (let j = 0; j < locationx[i].length; j++) {
                let curry = locationy[i];
                let currx = locationx[i][j];
                let sub_image = map.getRegion(new cv.Rect(currx - radius, curry - radius, 2 * radius, 2 * radius));
                let highest_res = -1;
                let highest_location = "0";
                for (let k = 0; k < locationlist.length; k++) {
                    let filename = `./locations/${locationlist[k]}.png`;
                    let temp_img = cv.imread(filename, cv.IMREAD_UNCHANGED);

                    // let res = sub_image.matchTemplate(temp_img, cv.TM_CCOEFF_NORMED).atRaw(0, 0);
                    let res = matchpixel(temp_img, sub_image);
                    if (res > highest_res) {
                        highest_res = res;
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

                if (JSON.stringify(map.atRaw(curry, currx)) == JSON.stringify([113, 86, 53, 255])) {
                    _roadblock_string = _roadblock_string + "0";
                } else {
                    _roadblock_string = _roadblock_string + "1";
                }
            }
        }

        let _direction = "";

        if (JSON.stringify(map.atRaw(581, 395)) == JSON.stringify([250, 108, 47, 255])) {
            _direction = "l";
        } else {
            _direction = "r";
        }

        if (startedmoving) {
            message.channel.send("This minigame has started already. Currently the solver cannot solve maps that have began but it will be implemented in the near future.")
            console.log(_location_string + _roadblock_string + _direction);
            return "";
        }

        console.log(_location_string + _roadblock_string + _direction)


        if ((_location_string + _roadblock_string + _direction).length != 94) {
            return;
        }

        startchecks(message, _location_string + _roadblock_string + _direction, starttime, 1, uid);
    })
    .catch(err => {
        console.log(err);
        return "";
    })

}

function blocked(r, c, roadblocks) {
    try {
        let isblocked = roadblocks[r - 1][Math.floor((c - 1) / 2)] == "1";
        return isblocked;
    } catch(e) {
        return false;
    }
}

function getdistance(r, c, d, roadblocks, zero) {
    let startr = 0, startc = 0, innerd = 0, outerd = 0;
    let lblocked = false, rblocked = false, ublocked = false;

    switch (d) {
        case ("u"):
            startr = 6 - Math.floor(r / 2);
            startc = 8 - Math.floor(c / 2);
            innerd = [0, 1];
            outerd = [1, -5];
            lblocked = blocked(r-1, c-1, roadblocks);
            rblocked = blocked(r-1, c+1, roadblocks);
            ublocked = blocked(r-2, c, roadblocks);
            break;
        case ("d"):
            startr = 6 + Math.floor(r / 2);
            startc = 7 + Math.floor(c / 2);
            innerd = [0, -1];
            outerd = [-1, 5];
            lblocked = blocked(r+1, c+1, roadblocks);
            rblocked = blocked(r+1, c-1, roadblocks);
            ublocked = blocked(r+2, c, roadblocks);
            break;
        case ("l"):
            startr = 6 - Math.floor(c / 2);
            startc = 7 + Math.floor(r / 2);
            innerd = [1, 0];
            outerd = [-5, -1];
            lblocked = blocked(r+1, c-1, roadblocks);
            rblocked = blocked(r-1, c-1, roadblocks);
            ublocked = blocked(r, c-2, roadblocks);
            break;
        case ("r"):
            startr = 6 + Math.floor(c / 2);
            startc = 8 - Math.floor(r / 2);
            innerd = [-1, 0];
            outerd = [5, 1];
            lblocked = blocked(r-1, c+1, roadblocks);
            rblocked = blocked(r+1, c+1, roadblocks);
            ublocked = blocked(r, c+2, roadblocks);
            break;
    }

    let distance = [];
    let d_matrix = zero ? distance_matrix0 : distance_matrix;
    let d_matrixl = zero ? distance_matrixl0 : distance_matrixl;
    let d_matrixr = zero ? distance_matrixr0 : distance_matrixr;

    for (let i = 0; i < 7; i++) {
        let temp = [];
        for (let j = 0; j < 5; j++) {
            let dist = d_matrix[startr][startc];
            if (lblocked) dist += d_matrixl[startr][startc];
            if (rblocked) dist += d_matrixr[startr][startc];
            if (ublocked) dist += distance_matrixu[startr][startc];

            temp.push(dist);
            startr += innerd[0];
            startc += innerd[1];
        }
        distance.push(temp);
        startr += outerd[0];
        startc += outerd[1];
    }

    return distance;
}

function move(r, c, m, d) {
    switch(m) {
        case ("u"):
            if (d == "d") {
                return [-1, -1];
            }
            if (r % 2 == 1 && r > 2) {
                return [r - 2, c];
            } else if (r % 2 == 0 && r > 1) {
                if (d == "l") {
                    return [r - 1, c - 1];
                } else {
                    return [r - 1, c + 1];
                }
            } else {
                return [-1, -1];
            }
            break;
        case ("d"):
            if (d == "u") {
                return [-1, -1];
            }
            if (r % 2 == 1 && r < 12) {
                return [r + 2, c];
            } else if (r % 2 == 0 && r < 13) {
                if (d == "l") {
                    return [r + 1, c - 1];
                } else {
                    return [r + 1, c + 1];
                }
            } else {
                return [-1, -1];
            }
            break;
        case ("l"):
            if (d == "r") {
                return [-1, -1];
            }
            if (c % 2 == 1 && c > 2) {
                return [r, c - 2];
            } else if (c % 2 == 0 && c > 1) {
                if (d == "u") {
                    return [r - 1, c - 1];
                } else {
                    return [r + 1, c - 1];
                }
            } else {
                return [-1, -1];
            }
            break;
        case ("r"):
            if (d == "l") {
                return [-1, -1];
            }
            if (c % 2 == 1 && c < 8) {
                return [r, c + 2];
            } else if (c % 2 == 0 && c < 9) {
                if (d == "u") {
                    return [r - 1, c + 1];
                } else {
                    return [r + 1, c + 1];
                }
            } else {
                return [-1, -1];
            }
            break;
    }
}

function getlocations(r, c, mtx) {
    let rv = [];

    if (r == 0) {
        rv.push("0");
        rv.push(mtx[0][Math.floor(c / 2)]);
    } else if (r == 14) {
        rv.push(mtx[6][Math.floor(c / 2)]);
        rv.push("0");   
    } else if (r % 2 == 0) {
        rv.push(mtx[Math.floor(r / 2) - 1][Math.floor(c / 2)]);
        rv.push(mtx[Math.floor(r / 2)][Math.floor(c / 2)]);
    } else {
        if (c == 0) {
            rv.push("0")
            rv.push(mtx[Math.floor(r / 2)][0])
        } else if (c == 10) {
            rv.push(mtx[Math.floor(r / 2)][4])
            rv.push("0")
        } else {
            rv.push(mtx[Math.floor(r / 2)][Math.floor(c / 2) - 1]);
            rv.push(mtx[Math.floor(r / 2)][Math.floor(c / 2)]);
        }
    }
    return rv;
}

function getmoves(r, c, d, _locations, _roadblocks) {
    let loc = getlocations(r, c, _locations);

    _move = move(r, c, "u", d);
    if (_move[0] >= 0 && _move[1] >= 0)
        if (!blocked(_move[0], _move[1], _roadblocks))
            loc.push("u");

    _move = move(r, c, "l", d);
    if (_move[0] >= 0 && _move[1] >= 0)
        if (!blocked(_move[0], _move[1], _roadblocks))
            loc.push("l");

    _move = move(r, c, "r", d);
    if (_move[0] >= 0 && _move[1] >= 0)
        if (!blocked(_move[0], _move[1], _roadblocks))
            loc.push("r");

    _move = move(r, c, "d", d);
    if (_move[0] >= 0 && _move[1] >= 0)
        if (!blocked(_move[0], _move[1], _roadblocks))
            loc.push("d");

    return loc
}

function getuldr(locations, roadblocks) {
    let ul_req = [
        [[], [], [], [], []],
        [[], [], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], [], []],
        [[], [], [], [], []]
    ];
    let dr_req = JSON.parse(JSON.stringify(ul_req));
    let ul_moves = JSON.parse(JSON.stringify(ul_req));
    let dr_moves = JSON.parse(JSON.stringify(ul_req));

    for (let i = 0; i < ul_req.length; i++) {
        for (let j = 0; j < ul_req[i].length; j++) {
            // default: i is odd
            let cur_c = j * 2
            let cur_d_ul = "u"
            let cur_d_dr = "d"
            if (i % 2 == 0) {
                cur_c = j * 2 + 1
                cur_d_ul = "l"
                cur_d_dr = "r"
            } 
            let distanceul = getdistance(i, cur_c, cur_d_ul, roadblocks, false)
            let distancedr = getdistance(i, cur_c, cur_d_dr, roadblocks, false)
            let movesul = getmoves(i, cur_c, cur_d_ul, locations, roadblocks)
            let movesdr = getmoves(i, cur_c, cur_d_dr, locations, roadblocks)

            let g_req_ul = [], f_req_ul = [], d_req_ul = [], e_req_ul = [];
            let g_req_dr = [], f_req_dr = [], d_req_dr = [], e_req_dr = [];


            for (let k = 0; k < 7; k++) {
                for (let l = 0; l < 5; l++) {
                    let loc = locations[k][l]
                    if (refill[0].includes(loc)) {
                        g_req_ul.push(distanceul[k][l] * 10);
                        g_req_dr.push(distancedr[k][l] * 10);
                    }
                    if (refill[1].includes(loc)) {
                        f_req_ul.push(distanceul[k][l] * 4);
                        f_req_dr.push(distancedr[k][l] * 4);
                    }
                    if (refill[2].includes(loc)) {
                        d_req_ul.push(distanceul[k][l] * 6);
                        d_req_dr.push(distancedr[k][l] * 6);
                    }
                    if (refill[3].includes(loc)) {
                        e_req_ul.push(distanceul[k][l] * 8);
                        e_req_dr.push(distancedr[k][l] * 8);
                    }
                }
            }
            ul_req[i][j] = [g_req_ul.reduce((a,b) => a < b ? a : b), f_req_ul.reduce((a,b) => a < b ? a : b), d_req_ul.reduce((a,b) => a < b ? a : b), e_req_ul.reduce((a,b) => a < b ? a : b)];
            dr_req[i][j] = [g_req_dr.reduce((a,b) => a < b ? a : b), f_req_dr.reduce((a,b) => a < b ? a : b), d_req_dr.reduce((a,b) => a < b ? a : b), e_req_dr.reduce((a,b) => a < b ? a : b)];

            ul_moves[i][j] = movesul;
            dr_moves[i][j] = movesdr;
        }
    }
    
    return [ul_req, dr_req, ul_moves, dr_moves];
}

function createsolution(moves, resources, alive, iteration) {
    let _resources = [...resources];
    let timeremain = _resources.pop();

    if (moves.includes("h")) {
        _resources[1] -= 4;
        _resources[2] -= 6;
        _resources[3] -= 8;

        if (_resources[1] < 0) {
            _resources[1] = 0;
        }
        if (_resources[2] < 0) {
            _resources[2] = 0;
        }
        if (_resources[3] < 0) {
            _resources[3] = 0;
        }    
    }

    let rv = {
        "type": 1,
        "moves": moves,
        "resources": _resources,
        "home": moves.includes("h"),
        "ring": moves.includes("1"),
        "shopping": moves.includes("2"),
        "alive": alive,
        "airplane": moves.includes("a"),
        "iteration": iteration,
        "time": 0,
        "timeremain": timeremain,
        "remainingmoves": 0      
    };
    return rv;
}

function comparesolution(oldsol, newsol, need_ring) {
    if (Object.keys(oldsol).length <= 0) {
        return true;
    }

    if (!oldsol["alive"] && newsol["alive"]) {
        return need_ring < 2 || newsol["ring"];
    }

    let oldscore = 0, newscore = 0;

    if (oldsol["airplane"] && !(newsol["airplane"]) && newsol["alive"]) {
        return true
    } else if (!oldsol["airplane"] && newsol["airplane"]) {
        return false
    } else if (oldsol["airplane"] && newsol["airplane"]) {
        let o1 = Math.ceil(oldsol["resources"][0] / 10) - 1;
        let o2 = Math.ceil(oldsol["resources"][1] / 4) - 1;
        let o3 = Math.ceil(oldsol["resources"][2] / 6) - 1;
        let o4 = Math.ceil(oldsol["resources"][3] / 8) - 1;
        let n1 = Math.ceil(newsol["resources"][0] / 10) - 1;
        let n2 = Math.ceil(newsol["resources"][1] / 4) - 1;
        let n3 = Math.ceil(newsol["resources"][2] / 6) - 1;
        let n4 = Math.ceil(newsol["resources"][3] / 8) - 1;

        oldscore = Math.min(o1, o2, o3, o4) + (o1 + o2 + o3 + o4) / 100;
        newscore = Math.min(n1, n2, n3, n4) + (n1 + n2 + n3 + n4) / 100;
    } else {
        oldscore = (oldsol["resources"].slice(1).reduce((a, b) => a + b)) * (oldsol["moves"].length)/25;
        if (oldsol["shopping"]) oldscore += 180;
        if (oldsol["ring"] && need_ring > 0) oldscore += 1000;

        newscore = (newsol["resources"].slice(1).reduce((a, b) => a + b)) * (newsol["moves"].length)/25;
        if (newsol["shopping"]) newscore += 180;
        if (newsol["ring"] && need_ring > 0) newscore += 1000;
    }

    return newscore > oldscore;
}

function updaterespawn(respawn, turn, r, c, i, isspecial) {
    let rv = JSON.parse(JSON.stringify(respawn));
    let _r = -1, _c = -1;

    if (r == 0) {
        _r = 0;
        _c = Math.floor(c/2);
    } else if (r == 14) {
        _r = 6;
        _c = Math.floor(c/2);
    } else if (r % 2 == 0) {
        if (i == 0) {
            _r = Math.floor(r/2) - 1;
            _c = Math.floor(c/2);
        } else {
            _r = Math.floor(r/2);
            _c = Math.floor(c/2);
        }
    } else {
        if (c == 0) {
            _r = Math.floor(r/2);
            _c = 0;
        } else if (c == 10) {
            _r = Math.floor(r/2);
            _c = 4;
        } else {
            if (i == 0) {
                _r = Math.floor(r/2);
                _c = Math.floor(c/2) - 1;
            } else {
                _r = Math.floor(r/2);
                _c = Math.floor(c/2);
            }
        }
    }
    rv[_r][_c] = isspecial ? 25 : turn + 10;

    return rv;
}

let testsol = "uculluunrpdsmrgrulbllpsl"

async function date(turn, resources, respawn, r, c, d, moves, globalv) {
    let iterations = globalv["iterations"];

    if (iterations >= max_iteration) return;
    globalv["iterations"] += 1;

    for (let i = 0; i < 4; i++) {
        if (resources[i] <= 0) return;
    }

    if (turn > 25 || resources[4] <= 0) {
        let sol = createsolution(moves, resources, true, iterations);
        if (comparesolution(globalv["bestsolution"], sol, 1)) {
            globalv["bestsolution"] = sol;
        }
        // TODO dont forget nr (no ring)
        if (comparesolution(globalv["bestsolution_nr"], sol, 0)) {
            globalv["bestsolution_nr"] = sol;
        }
        globalv["totalsol"] += 1;
        return;
    }

    let validmoves;
    if (d == "u" || d == "l") {
        validmoves = globalv["ul_moves"][r][Math.floor(c/2)];
    } else {
        validmoves = globalv["dr_moves"][r][Math.floor(c/2)];
    }

    // if (testsol.startsWith(moves.join(""))) {
    //     console.log(moves)
    //     console.log("> " + validmoves)
    // }

    for (let i = 0; i < validmoves.length; i++) {
        let curmove = validmoves[i];
        if (curmove == "0") continue;

        if (i < 2) {
            if (curmove == "a") {
                let updatedresources = [];
                let updatelist = [0, -4, -6, -18, -4];

                let dead = false;
                for (let j = 0; j < 5; j++){
                    let newresource = Math.min(100, resources[j] + updatelist[j]);
                    if (newresource <= 0) {
                        dead = true;
                        break;
                    }
                    updatedresources.push(newresource);
                }
                if (dead) continue;

                let sol = createsolution(moves.concat([curmove]), updatedresources, true, iterations);
                if (comparesolution(globalv["bestsolution"], sol, 1)) {
                    globalv["bestsolution"] = sol;
                }
                if (comparesolution(globalv["bestsolution_nr"], sol, 0)) {
                    globalv["bestsolution_nr"] = sol;
                }
                globalv["totalsol"] += 1;
                continue;
            }
            if (curmove == "h") {
                let sol = createsolution(moves.concat([curmove]), resources, true, iterations);
                if (comparesolution(globalv["bestsolution"], sol, 1)) {
                    globalv["bestsolution"] = sol;
                }
                if (comparesolution(globalv["bestsolution_nr"], sol, 0)) {
                    globalv["bestsolution_nr"] = sol;
                }
                globalv["totalsol"] += 1;
                continue;
            }

            let respawnlist = getlocations(r, c, respawn);
            if (turn <= respawnlist[i]) continue;

            let updatedresources = [];
            let updatelist = updates[curmove];

            for (let j = 0; j < 5; j++){
                updatedresources.push(Math.min(100, resources[j] + updatelist[j]));
            }

            await date(turn + 1, updatedresources, updaterespawn(respawn, turn, r, c, i, ["f", "1", "2"].includes(curmove)), r, c, d, moves.concat(curmove), globalv);
        } else {
            // checking for dead path
            let minresource;
            if (d == "u" || d == "l") {
                minresource = globalv["ul_req"][r][Math.floor(c / 2)];
            } else {
                minresource = globalv["dr_req"][r][Math.floor(c / 2)];
            }
            let timeremaining = Math.floor(resources[4] / 4);

            if (resources[3] <= Math.min(minresource[3], 8 * timeremaining)) {
                globalv["optimization"] += 1;
                return;
            }
            if (resources[2] <= Math.min(minresource[2], 6 * timeremaining)) {
                globalv["optimization"] += 1;
                return;
            }
            if (resources[1] <= Math.min(minresource[1], 4 * timeremaining)) {
                globalv["optimization"] += 1;
                return;
            }
            if (resources[0] <= Math.min(minresource[0], Math.floor((timeremaining + 2) / 3))) {
                globalv["optimization"] += 1;
                return;
            }

            let updatedresources = [];
            let updatelist = [-10, -4, -6, -8, -4];

            for (let j = 0; j < 5; j++) {
                updatedresources.push(Math.min(100, resources[j] + updatelist[j]));
            }

            // moving
            let newr, newc;
            switch(curmove) {
                case("u"):
                    if (r % 2 == 1) {
                        newr = r - 2;
                        newc = c;
                    } else {
                        if (d == "l") {
                            newr = r - 1;
                            newc = c - 1;  
                        } else {
                            newr = r - 1;
                            newc = c + 1;  
                        }
                    }
                    break;
                case("d"):
                    if (r % 2 == 1) {
                        newr = r + 2;
                        newc = c;
                    } else {
                        if (d == "r") {
                            newr = r + 1;
                            newc = c + 1;  
                        } else {
                            newr = r + 1;
                            newc = c - 1;  
                        }
                    }
                    break;
                case("l"):
                    if (c % 2 == 1) {
                        newr = r;
                        newc = c - 2;
                    } else {
                        if (d == "u") {
                            newr = r - 1;
                            newc = c - 1;  
                        } else {
                            newr = r + 1;
                            newc = c - 1;  
                        }
                    }
                    break;
                case("r"):
                    if (c % 2 == 1) {
                        newr = r;
                        newc = c + 2;
                    } else {
                        if (d == "d") {
                            newr = r + 1;
                            newc = c + 1;  
                        } else {
                            newr = r - 1;
                            newc = c + 1;  
                        }
                    }
                    break;
            }
            await date(turn + 1, updatedresources, respawn, newr, newc, curmove, moves.concat([curmove]), globalv);
        }
    }
}

async function startchecks(message, inputstrings, starttime, ringflag, uid) {
    if (maintenance && uid != "226588531772882945") {
        message.channel.send("Nano is currently under maintenance, please try again later.");
        return;
    }

    Database.checksubs(parseInt(uid)).then(user => {
        if (user["timeremain"] <= 0) {
            if (user["warned"]) {
                message.channel.send(`<@${uid}> your subscription has expired. Please ask pineappl or a mod to start a new subscription.`);
            } else {
                message.channel.send(`<@${uid}> your subscription has expired. Please ask <@226588531772882945>  or <@&815511257062965259> to start a new subscription.`);
                Database.updatesubs(parseInt(uid), -1, true);
            }
            return;
        } else if (user["timeremain"] <= 12) {
            message.channel.send(`Friendly reminder that your subscription ends in less ${user['timeremain']} hours.`);
        }

        Database.checkcache(inputstrings).then(recent => {
            // rerun
        })
        .catch(e => {
            //add to cache
            //maybe include the remaining time inside the map

            startdate(message, inputstrings, starttime, ringflag);
        })
    }).catch(e => {

    })
  

    startdate(message, inputstrings, starttime, ringflag);
}

async function startdate(message, inputstrings, starttime, ringflag) {
    // needed?
    let location_string = inputstrings.slice(0, 35);
    let roadblock_string = inputstrings.slice(35, 93);
    let direction = inputstrings.charAt(93);

    let locations = [];
    for (let i = 0; i < 7; i++){
        locations.push(location_string.slice(i * 5,(i + 1) * 5).split(""));
    }

    let roadblocks = [];
    for (let i = 0; i < 13; i++) {
        if (i % 2 == 0) {
            roadblocks.push(roadblock_string.slice((Math.floor(i / 2)) * 9,(Math.floor(i / 2)) * 9 + 4).split("").concat(["0"]));
        } else {
            roadblocks.push(roadblock_string.slice((Math.floor(i / 2)) * 9 + 4, (Math.floor(i / 2 + 1)) * 9).split("").concat(["0"]));
        }
    }
    roadblocks.push(["0", "0", "0", "0", "0"]);

    let uldr = getuldr(locations, roadblocks);
    let ul_req = uldr[0], dr_req = uldr[1], ul_moves = uldr[2], dr_moves = uldr[3];

    let globalv = {
        "locations": locations,
        "roadblocks": roadblocks,
        "totalsol": 0,
        "bestsolution": {},
        "bestsolution_nr": {},
        "iterations": 0,
        "need_ring": ringflag,
        "ul_req": ul_req,
        "dr_req": dr_req,
        "ul_moves": ul_moves,
        "dr_moves": dr_moves,
        "optimization": 0    
    }

    let currentdate = new Date();
    let starttime2 = currentdate.getTime()/1000;

    await date(cur_turn, initial_resource, respawn_matrix, cur_row, cur_col, direction, [], globalv);

    let bestsolution = globalv["bestsolution"];

    currentdate = new Date();
    let endtime = currentdate.getTime()/1000;
    let dt = endtime - starttime;
    let dttext = `${Math.round(1000*dt) / 1000} s`;
    let dttext2 = `${Math.round(1000*(starttime2-starttime)) / 1000} s`;
    let dttext3 = `${Math.round(1000*(endtime-starttime2)) / 1000} s`;

    let solution = ""
    let solutionemoji = "";
    let remainingresource = "";
    let interpretedmap = "";
    let hasring = false;
    let details = "";

    // Intepreted map
    for (let j = 0; j < 5; j++)
        interpretedmap = interpretedmap + "------ ";
    interpretedmap = interpretedmap + "\n";

    for (let i = 0; i < roadblocks.length - 1; i++) {
        if (i % 2 == 0) {
            for (let j = 0; j < 4; j++) {
                interpretedmap = interpretedmap + ` ${location_emojis[locations[Math.floor(i / 2)][j]]} `;
                if (roadblocks[i][j] == "0") {
                    interpretedmap = interpretedmap + "|";
                } else {
                    interpretedmap = interpretedmap + " ";
                }
            }
            interpretedmap = interpretedmap + ` ${location_emojis[locations[Math.floor(i / 2)][4]]}\n`;
        } else {
            for (let j = 0; j < 5; j++) {
                if (roadblocks[i][j] == "0") {
                    interpretedmap = interpretedmap + "------";
                } else {
                    interpretedmap = interpretedmap + "     ";
                }
                interpretedmap = interpretedmap + " ";
            }
            interpretedmap = interpretedmap + "\n";
        }
    }
    for (let j = 0; j < 5; j++)
        interpretedmap = interpretedmap + "------ ";
    interpretedmap = interpretedmap + "\n"

    if (direction == "l") {
        interpretedmap = interpretedmap + "     ⬅️ 🚘";
    } else {
        interpretedmap = interpretedmap + "      🚘 ➡️";
    }

    if (Object.keys(bestsolution).length <= 0) {
        solution = "No solution found";
        solutionemoji = "😢";
        remainingresource = "N/A";
        report = "**AP Earned:** 0\nsad";
        hasring = false;
        details = "N/A";
    } else {
        // Solution
        bestsolution["time"] = dt;
        hasring = location_string.includes("1") && bestsolution["moves"].includes("1");
        if (bestsolution["airplane"]) {
            solution = "**Solution not found, best path to an airplane:**\n";
        }

        for (let i = 0; i < bestsolution["moves"].length - 1; i++) {
            solution = solution + denotations[bestsolution["moves"][i]] + ", ";
            solutionemoji = solutionemoji + location_emojis[bestsolution["moves"][i]] + " ";
            if (i == 14) solutionemoji = solutionemoji + "\n> ";
        }
        solution = solution + denotations[bestsolution["moves"][bestsolution["moves"].length-1]];
        solutionemoji = solutionemoji + location_emojis[bestsolution["moves"][bestsolution["moves"].length-1]] + " ";

        // Report
        // AP and AR
        let arearned = 0, apearned = Math.ceil(bestsolution["resources"].slice(1).reduce((a, b) => a + b) * bestsolution["moves"].length / 25 / 6);
        try {
            let prear = parseFloat(message.embeds[0].description.split("**")[3]);
            let prearunscaled = prear;
            if (prear > 100) {
                prearunscaled = Math.round(10000/(200-prear));
            }
            let postarunscaled = prearunscaled + apearned;
            let postar = postarunscaled;

            if (postar > 100) {
                postarunscaled = Math.round(10000/(200-postar));
            }

            arearned = postar - prear;
        } catch (e) {
            console.log(e);
        }

        if (bestsolution["airplane"]) {
            apearned = "0"
        }
        if (bestsolution["shopping"]) {
            apearned = apearned + " + 30";
        }

        if (bestsolution["airplane"]) {
            report = `Remaining moves: ${bestsolution['remainingmoves']}\n`;
        } else {
            report = `AP Earned: ${apearned}\n`;
            if (arearned > 0) {
                report = report + `AR Earned: ${Math.round(arearned * 100) / 100}\n`;
            }
        }
        report = report + `Preparation duration: ${dttext2}\n`;
        report = report + `Solve duration: ${dttext3}\n`;
        report = report + `Total time taken: ${dttext}\n`;
        report = report + `Path explored: ${globalv['iterations']}\n`;
        report = report + `Optimization: ${globalv["optimization"]}\n`
        // TODO ^ remove
        if (globalv['iterations'] < max_iteration && !bestsolution["airplane"]) {
            report = report + "The solution found is optimal";
            if (hasring) report = report + "\n(with ring)";
        } else {
            report = report + "Max iteration reached";
            if (hasring) report = report + "\n(with ring)";
        }
        report = report + "\n\u200b\n";

        remainingresource = "Gas: " + bestsolution["resources"][0] + "\n";
        remainingresource = remainingresource + "Food: " + bestsolution["resources"][1] + "\n";
        remainingresource = remainingresource + "Drink: " + bestsolution["resources"][2] + "\n";
        remainingresource = remainingresource + "Entertainment : " + bestsolution["resources"][3] + "\n";

        report = report + "**Remaining Resource:**\n" + remainingresource + "\u200b\n"      

        //TODO: Details
    }
    let poterr = [];
    for (let i = 0; i < locationlist.length - 3; i++) {
        if (!location_string.includes(locationlist[i])) {
            poterr.push(denotations[i]);
        }
    }

    let desc = solution;
    let rvembed = new MessageEmbed()
        .setTitle("Data Solver Run Results")
        .setDescription(desc);

    if (poterr.length > 0) {
        rvembed.addField("Error:", `Missing: ${poterr.join(", ")}`, false);
    }
    rvembed.addFields(
        {name: "> " + solutionemoji, value: "\u200b", inline: false},
        {name: "Report:", value: report, inline: true},
        {name: "Interpreted Map:", value: interpretedmap, inline: true}
    );
    let footertext = "React ➕ for more details.";
    if (Object.keys(bestsolution).length > 0) {
        if (hasring) {
            footertext += " React ❌ for no ring.";
        }
    } else {
        hasring = 0;
    }

    rvembed.setFooter(footertext);


    // Sending results
    message.reply({content: "result", embeds: [rvembed]});
    
}

module.exports.run = async (client, message) => {
    let currentdate = new Date();
    let starttime = currentdate.getTime()/1000;

    let imurl = ""
    let uid = message.author.id;

    try {
        let mapembed = message.embeds[0];

        if (mapembed) {
            let embedimage = mapembed.image
            if (embedimage) {

                // kvi
                try {
                    uid = mapembed.description.split("@")[1].split(">")[0];
                    imurl = embedimage.url;
                    if (mapembed.title == "Date Minigame") {
                        let mapreceivedstring = "Date Map received, processing...\n";
                        if (Math.random() < 0.2) {
                            mapreceivedstring += "P.S. with more and more people using " +
                                                "the bot, the wait times tend to be longer than usual at times. " +
                                                "Please be patient while I solve.";
                        }
                        message.channel.send(mapreceivedstring);
                    }
                } catch (e) {
                    console.log(e);
                    return;
                }
            } else {
                // link
                if (vipchannels.includes(message.channel.id)) {
                    imurl = mapembed.url;
                }
            }
        } else if (message.attachments) {
            if (vipchannels.includes(message.channel.id)) {
                imurl = message.attachments[0].url;
            }
        } else {
            if (vipchannels.includes(message.channel.id)) {
                imurl = message.content;
            }
        }

        if (imurl.length <= 0) {
            console.log("1")
            return;
        }

        getinput(imurl, message, starttime, uid);
    } catch(e) {
        return;
    }
}

