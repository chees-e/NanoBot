/* * * * * * * * * * * * * * */
/*          Made by          */
/*       pineappl#3507       */
/* * * * * * * * * * * * * * */

const cv = require("opencv4nodejs");
const jimp = require("jimp")
const {MessageEmbed, ReactionCollector} = require("discord.js");
const Database = require("./database.js")

// TODO scoring
// [0] Settings //
let max_iteration = 6942069;
let debug = false;
let maintenance = false;
let airplane = false;

let vipchannels = ["858766517369831424", "815120360973926410"];
let limitlesschannels = ["858766517369831424", "815120360973926410"];
let announcementchannels = [];
let logchannel = "884343675432362014";
let admins = [
    "226588531772882945",  // pine
    "321897898470146048",  // natsuki
    "711069244573351966",  // yyk
    "387707421730144257",  // cat
    "398188915326058496"  // ruya
]
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
    distance_matrixu,
    carx,
    cary
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

function getinput(img_url, message, starttime, uid, pnginput) {
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

        if (pnginput) {
            let mapreceivedstring = "Date Map received, processing...\n";
            if (Math.random() < 0.2) {
                mapreceivedstring += "P.S. with more and more people using " +
                                    "the bot, the wait times tend to be longer than usual at times. " +
                                    "Please be patient while I solve.";
            }
            await message.channel.send(mapreceivedstring);
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

        let initial_var = {
            locations: _location_string,
            roadblocks: _roadblock_string,
            direction: _direction,
            inputstrings: _location_string + _roadblock_string + _direction,
            startedmoving: false,
            resources: [100, 50, 50, 75, 100],
            car_y: 14,
            car_x: 5,
        }

        if (startedmoving) {
            initial_var["startedmoving"] = true;
            let gasremain = 10;
            let foodremain = 1;
            let drinksremain = 1;
            let entarremain = 1;
            let timeremain = 4;

            for (let i = 0; i < 9; i++) {
                if (JSON.stringify(map.atRaw(17,701-Math.round(i*10*6.16))) != JSON.stringify([0, 0, 0, 255])) {
                    gasremain = 100 - i * 10;
                    break;
                }
            }
            for (let i = 0; i < 99; i++) {
                if (JSON.stringify(map.atRaw(45,701-Math.round(i*6.16))) != JSON.stringify([0, 0, 0, 255])) {
                    foodremain = 100 - i;
                    break;
                }
            }
            for (let i = 0; i < 99; i++) {
                if (JSON.stringify(map.atRaw(74,701-Math.round(i*6.16))) != JSON.stringify([0, 0, 0, 255])) {
                    drinksremain = 100 - i;
                    break;
                }
            }
            for (let i = 0; i < 99; i++) {
                if (JSON.stringify(map.atRaw(102,701-Math.round(i*6.16))) != JSON.stringify([0, 0, 0, 255])) {
                    entarremain = 100 - i;
                    break;
                }
            }
            for (let i = 0; i < 24; i++) {
                if (JSON.stringify(map.atRaw(131,701-Math.round(i*4*6.16))) != JSON.stringify([0, 0, 0, 255])) {
                    timeremain = 100 - i*4;
                    break;
                }
            }

            initial_var["resources"] = [gasremain, foodremain, drinksremain, entarremain, timeremain];

            outerloop:
            for (let i = 0; i < cary.length; i++) {
                for (let j = 0; j < carx[i].length; j++) {
                    if (i % 2 == 0) { //lr
                        if (JSON.stringify(map.atRaw(cary[i], carx[i][j])) == JSON.stringify([250, 195, 78, 255])) { 
                            initial_var["direction"] = "l";
                            initial_var["car_x"] = j*2+1;
                            initial_var["car_y"] = i;
                            break outerloop;
                        } else if (JSON.stringify(map.atRaw(cary[i], carx[i][j]-13)) == JSON.stringify([250, 195, 78, 255])) { 
                            initial_var["direction"] = "r";
                            initial_var["car_x"] = j*2+1;
                            initial_var["car_y"] = i;
                            break outerloop;
                        }
                    } else {                   
                        if (JSON.stringify(map.atRaw(cary[i]-4, carx[i][j])) == JSON.stringify([250, 195, 78, 255])) { 
                            initial_var["direction"] = "d";
                            initial_var["car_x"] = j*2;
                            initial_var["car_y"] = i;
                            break outerloop;
                        } else if (JSON.stringify(map.atRaw(cary[i], carx[i][j])) == JSON.stringify([250, 195, 78, 255])) { 
                            initial_var["direction"] = "u";
                            initial_var["car_x"] = j*2;
                            initial_var["car_y"] = i;
                            break outerloop;
                        }   
                    }
                }
            }
        }

        console.log(_location_string + _roadblock_string + _direction)


        if ((_location_string + _roadblock_string + _direction).length != 94) {
            return;
        }

        startchecks(message, initial_var, starttime, 1, uid, img_url);
    })
    .catch(err => {
        return "";
    })

}

function blocked(r, c, roadblocks) {
    if ((r == 0 || r == 14) && (c >= 0 && c <= 10)) {
        return false
    }
    if ((c == 0 || c == 10) && (r >= 0 && r <= 14)) {
        return false
    }
    if (c < 0 || c > 10 || r < 0 || r > 14) {
        return true
    }
    try {
        let isblocked = roadblocks[r - 1][Math.floor((c - 1) / 2)] == "1";
        return isblocked;
    } catch(e) {
        return true;
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
        "remainingmoves": [Math.ceil(_resources[0] / 10) - 1, Math.ceil(_resources[1] / 4) - 1, Math.ceil(_resources[2] / 6) - 1, Math.ceil(_resources[3] / 8) - 1],
        "safe": Math.min(Math.ceil(_resources[0] / 10) - 1, Math.ceil(_resources[1] / 4) - 1, Math.ceil(_resources[2] / 6) - 1, Math.ceil(_resources[3] / 8) - 1) + moves.length >= 25    
    };
    return rv;
}

function comparesolution(oldsol, newsol, need_ring) {
    if (Object.keys(oldsol).length <= 0) {
        return true;
    }

    if (need_ring >= 2 && newsol["ring"] && !oldsol["ring"]) {
        return true
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

        if (newscore + newsol["moves"].length >= 25) {
            if (oldscore + oldsol["moves"].length >= 25) {
                return oldsol["moves"].length > newsol["moves"].length;
            } else {
                return true
            }
        } else {
            if (oldscore + oldsol["moves"].length >= 25) {
                return false;
            } else {
                return newscore > oldscore;
            }
        }
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
                if (comparesolution(globalv["bestsolution_airplane"], sol, 0)) {
                    globalv["bestsolution_airplane"] = sol;
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

async function startchecks(message, initial_var, starttime, ringflag, uid, imurl) {
    let inputstrings = initial_var["inputstrings"];
    if (maintenance && uid != "226588531772882945") {
        message.channel.send("Nano is currently under maintenance, please try again later.");
        return;
    }

    if (limitlesschannels.includes(message.channel.id)) {
        if (initial_var["startedmoving"]) {
            startcustomdate(message, initial_var, ringflag, uid);
            return;
        } else {
            Database.checkcache(inputstrings).then(recent => {
                rerunmessage(message, initial_var, recent, ringflag, uid);
                return;
            })
            .catch(e => {
                console.log(e)
                Database.updatecache(inputstrings, "https://www.youtube.com/watch?v=dQw4w9WgXcQ", false, Date.now()/1000, imurl, "lol I am still calculating the first one").then(result => {console.log(result)});
                startdate(message, initial_var, starttime, ringflag, uid);
                return;
            })
        }
    } else {
        Database.checksubs(uid).then(user => {
            if (user["timeremain"] <= 0) {
                if (user["warned"]) {
                    message.channel.send(`<@${uid}> your subscription has expired. Please ask pineappl or a mod to start a new subscription.`);
                } else {
                    message.channel.send(`<@${uid}> your subscription has expired. Please ask <@226588531772882945>  or <@&815511257062965259> to start a new subscription.`);
                    Database.updatesubs(uid, -1, true, 1);
                }
                return;
            } else if (user["timeremain"] <= 12) {
                message.channel.send(`Friendly reminder that your subscription ends in less ${Math.round(user['timeremain'])} hours.`);
            }

            if (initial_var["startedmoving"]) {
                startcustomdate(message, initial_var, ringflag, uid);
                return;
            } else {
                Database.checkcache(inputstrings).then(recent => {
                    rerunmessage(message, initial_var, recent, ringflag, uid);
                    return;
                })
                .catch(e => {
                    console.log(e)
                    Database.updatecache(inputstrings, "https://www.youtube.com/watch?v=dQw4w9WgXcQ", false,  Date.now()/1000, imurl, "lol I am still calculating the first one").then(result => {console.log(result)});
                    startdate(message, initial_var, starttime, ringflag, uid);
                    return;
                })
            }
        }).catch(err => {
            message.channel.send(`<@${uid}> you don't seem to be subscribed. Join our server to get started.\nhttps://discord.gg/ckBYm4pUHm`);
            return;
        })
    }
}

async function rerunmessage(message, initial_var, cached, ringflag, uid){
    message.channel.send({embeds: [
        new MessageEmbed()
        .setTitle("Map processed recently")
        .setDescription(`Solution: ${cached['solution']}\n\u200b\n`+
        `[Click here to nagivate to the previous run]` +
        `(${cached['link']})`)
        .setFooter(`React 🔁 to rerun`)]
    }).then(m => {
        m.react("🔁");
        const filter = (reaction, user) => {
            return ['🔁'].includes(reaction.emoji.name) && user.id == uid;
        };
        m.awaitReactions({filter, max: 1, time: 60000, errors: ['time']}).then(async collected => {
            await message.channel.send("rerunning");
            startdate(message, initial_var,  Date.now()/1000, ringflag, uid);

        }).catch(e => {
            console.log(e)
            return;
        })
    });
}

async function startcustomdate(message, initial_var, ringflag, uid) {
    let location_string = initial_var["locations"];
    let roadblock_string = initial_var["roadblocks"];

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

    if (initial_var["car_x"] > 0 && initial_var["car_x"] < 10 && initial_var["car_y"] > 0 && initial_var["car_y"] < 14) {
        roadblocks[initial_var["car_y"]-1][Math.floor((initial_var["car_x"]-1)/2)] = "0"
    }

    let interpretedmap = getinterpretedmap(locations, roadblocks, initial_var);
    let interpretedmap_m = getinterpretedmap2(locations, roadblocks, initial_var);
    let intepretedresources = `Gas: ${initial_var["resources"][0]}\n` +
    `Food: ${initial_var["resources"][1]}\n` +
    `Drinks: ${initial_var["resources"][2]}\n` +
    `Entartainment: ${initial_var["resources"][3]}\n` +
    `Time: ${initial_var["resources"][4]}\n`;

    let poterr = [];
    for (let i = 0; i < locationlist.length - 3; i++) {
        if (!location_string.includes(locationlist[i])) {
            poterr.push(denotations[locationlist[i]]);
        }
    }

    let rvembed = new MessageEmbed()
    .setTitle("Date already stated")
    .setDescription("Here is the interpreted map. If this is a correct interpretation, react ✅ to continue.\n\nWarning:\nNano cannot get an accurate interpretation if some locations are taken already (I'm still working on that).");
    
    let rvembed_m = new MessageEmbed()
    .setTitle("Date already stated")
    .setDescription("Here is the interpreted map. If this is a correct interpretation, react ✅ to continue.\n\nWarning:\nNano cannot get an accurate interpretation if some locations are taken already (I'm still working on that).");
    
    if (poterr.length > 0) {
        rvembed.addField("⚠️ Potential Error:", `Missing: ${poterr.join(", ")}`, false);
        rvembed_m.addField("⚠️ Potential Error:", `Missing: ${poterr.join(", ")}`, false);
    }
    
    rvembed.addFields(
        {name: "Resources: ", value: intepretedresources, inline: true},
        {name: "Interpreted Map:", value: interpretedmap, inline: true}
    )
    .setFooter("The map's formatting is optimized for 16px chat font scaling. React 📱 if it is too messy");

    rvembed_m.addFields(
        {name: "Resources: ", value: intepretedresources, inline: true},
        {name: "Interpreted Map:", value: interpretedmap_m, inline: true}
    )
    .setFooter( "React 📱 to revert to the original formatting.");


    let curr_embed = rvembed;

    message.reply({embeds:[rvembed]}).then(m => {
        m.react("✅");
        m.react("📱");

        let reformatted = false

        const filter = (reaction, user) => {
            return ["✅", "📱"].includes(reaction.emoji.name) && user.id == uid;
        };
        
        const collector = m.createReactionCollector({filter, time: 60000})
        collector.on("collect", async r => {
            switch (r.emoji.name) {
                case ("✅"): 
                    await message.channel.send("starting");
                    startdate(message, initial_var, Date.now()/1000, ringflag, uid)
                    collector.stop("");
                    break;
                case("📱"):
                    reformatted = !reformatted;
                    curr_embed = reformatted ? rvembed_m : rvembed;
                    m.edit({embeds:[curr_embed]})
                    break;
            }
        });
    })
}

async function startdate(message, initial_var, starttime, ringflag, uid) {
    // needed? TODO: update this
    let inputstrings = initial_var["inputstrings"];
    let location_string = initial_var["locations"];
    let roadblock_string = initial_var["roadblocks"];
    let direction = initial_var["direction"];

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

    if (initial_var["car_x"] > 0 && initial_var["car_x"] < 10 && initial_var["car_y"] > 0 && initial_var["car_y"] < 14) {
        roadblocks[initial_var["car_y"]-1][Math.floor((initial_var["car_x"]-1)/2)] = "0"
    }

    let uldr = getuldr(locations, roadblocks);
    let ul_req = uldr[0], dr_req = uldr[1], ul_moves = uldr[2], dr_moves = uldr[3];

    let globalv = {
        "locations": locations,
        "roadblocks": roadblocks,
        "totalsol": 0,
        "bestsolution": {},
        "bestsolution_nr": {},
        "bestsolution_airplane": {},
        "iterations": 0,
        "need_ring": ringflag,
        "ul_req": ul_req,
        "dr_req": dr_req,
        "ul_moves": ul_moves,
        "dr_moves": dr_moves,
        "optimization": 0    
    }

    let starttime2 = Date.now()/1000;

    await date(cur_turn, initial_var["resources"], respawn_matrix, initial_var["car_y"], initial_var["car_x"], direction, [], globalv);

    let bestsolution = globalv["bestsolution"];
    let hasring = location_string.includes("1") && bestsolution["moves"].includes("1");

    let rvembed1 = getsolutionembed(message, globalv, starttime, starttime2, locations, roadblocks, direction, initial_var, 1, false);
    let rvembed2 = getsolutionembed(message, globalv, starttime, starttime2, locations, roadblocks, direction, initial_var, 2, false);
    let rvembed3 = getsolutionembed(message, globalv, starttime, starttime2, locations, roadblocks, direction, initial_var, 3, false);
    let rvembed1_m = getsolutionembed(message, globalv, starttime, starttime2, locations, roadblocks, direction, initial_var, 1, true);
    let rvembed2_m = getsolutionembed(message, globalv, starttime, starttime2, locations, roadblocks, direction, initial_var, 2, true);
    let rvembed3_m = getsolutionembed(message, globalv, starttime, starttime2, locations, roadblocks, direction, initial_var, 3, true);
    let curr_embed = rvembed1;
    let curr_content = `<@${uid}> Results`;

    // Sending results
    message.reply({content: `<@${uid}> Results`, embeds: [rvembed1]}).then(m => {
        let _solution = [];
        Database.cleancache(Date.now()/1000 - 3600);

        if (Object.keys(bestsolution).length > 0) {
            for (let i = 0; i < bestsolution["moves"].length; i++) {
                _solution.push(denotations[bestsolution["moves"][i]]);
            }
            Database.updatecache(inputstrings, m.url, hasring, Date.now()/1000, false, _solution.join(", "));
        } else {
            Database.updatecache(inputstrings, m.url, hasring, Date.now()/1000, false, "No solution found");
        }

        if (Object.keys(bestsolution).length > 0 && !bestsolution["airplane"]) {
            let _solution2 = [];
            let _solution3 = [];

            let validreactions = [];

            let reformatted = false;
            let curr_embed_n = 1;

            m.react("👑");
            validreactions.push("👑");
            
            if (hasring) {
                m.react("❌");
                validreactions.push("❌");
                for (let i = 0; i < globalv["bestsolution_nr"]["moves"].length; i++) {
                    _solution2.push(denotations[globalv["bestsolution_nr"]["moves"][i]]);
                }
            }

            if (Object.keys(globalv["bestsolution_airplane"]).length > 0) {
                m.react("✈️");
                validreactions.push("✈️");
                for (let i = 0; i < globalv["bestsolution_airplane"]["moves"].length; i++) {
                    _solution3.push(denotations[globalv["bestsolution_airplane"]["moves"][i]]);
                }
            }
            m.react("📱");
            validreactions.push("📱");

            const filter = (reaction, user) => {
                return validreactions.includes(reaction.emoji.name) && user.id == uid;
            };
            
            const collector = m.createReactionCollector({filter, time: 60000})
            collector.on("collect", async r => {
                switch (r.emoji.name) {
                    case ("👑"): 
                        curr_embed = reformatted ? rvembed1_m : rvembed1;
                        curr_embed_n = 1;
                        m.edit({content: `<@${uid}> Results`, embeds: [curr_embed]});
                        Database.updatecache(inputstrings, m.url, hasring, Date.now()/1000, false, _solution.join(", "));
                        break;
                    case("❌"):
                        if (hasring) {
                            curr_embed = reformatted ? rvembed2_m : rvembed2;
                            curr_embed_n = 2;
                            m.edit({content: `<@${uid}> Results (no ring)`, embeds: [curr_embed]});
                            Database.updatecache(inputstrings, m.url, 0, Date.now()/1000, false, _solution2.join(", "));
                        }
                        break;
                    case("✈️"):
                        curr_embed = reformatted ? rvembed3_m : rvembed3;
                        curr_embed_n = 3;
                        m.edit({content: `<@${uid}> Results (airplane)`, embeds: [curr_embed]});
                        Database.updatecache(inputstrings, m.url, 0, Date.now()/1000, false, _solution3.join(", "));
                        break;
                    case("📱"):
                        reformatted = !reformatted;
                        if (curr_embed_n == 1) {
                            curr_embed = reformatted ? rvembed1_m : rvembed1;
                            curr_content = `<@${uid}> Results`;
                        } else if (curr_embed_n == 2) { 
                            curr_embed = reformatted ? rvembed2_m : rvembed2;
                            curr_content = `<@${uid}> Results (no ring)`;
                        } else if (curr_embed_n == 3) {
                            curr_embed = reformatted ? rvembed3_m : rvembed3;
                            curr_content = `<@${uid}> Results (airplane)`;
                        }
                        m.edit({content: curr_content, embeds: [curr_embed]});
                        break;
                }

            })
        }
            
    
        try {
            Database.checkcache(inputstrings).then(recent => {
                message.client.channels.fetch(logchannel).then(curchannel => {
                    message.client.users.fetch(uid).then(tempuser => {
                        let currentdate = new Date();
                        curchannel.send(`\`\`\`${tempuser.username} (${tempuser.id}) in channel ${message.channel.name} `+
                                            `(${message.channel.id}) in guild ${message.guild.name} (${message.guild.id}) ` +
                                            `at ${currentdate.toString()}\`\`\``);
                        if (message.embeds[0].image) {
                            curchannel.send(message.embeds[0].image.url);
                        } else {
                            curchannel.send(message.embeds[0].url);
                        }
                        curchannel.send(m.url);
                        curchannel.send({embeds:[rvembed1]});
                    })
                })
            }).catch(err => {
                console.log(err)
            })
        } catch (err) {
            console.log(err)

        };
    });

    Database.updatebot(bestsolution);
    Database.updateserver(message.guild.id);
    Database.updateuser(message, bestsolution);


}

function getsolutionembed(message, globalv, starttime, starttime2, locations, roadblocks, direction, initial_var, type, reformat) {
    let bestsolution;
    let location_string = initial_var["locations"];
    
    if (type == 1) {
        // Best
        bestsolution = globalv["bestsolution"];
    } else if (type == 2) {
        // No ring
        bestsolution = globalv["bestsolution_nr"];
    } else if (type == 3) {
        // Airplane
        bestsolution = globalv["bestsolution_airplane"];

    }
    let endtime = Date.now()/1000;
    let dt = endtime - starttime;
    let dttext = `${Math.round(1000*dt) / 1000} s`;
    let dttext2 = `${Math.round(1000*(starttime2-starttime)) / 1000} s`;
    let dttext3 = `${Math.round(1000*(endtime-starttime2)) / 1000} s`;

    let solution = ""
    let solutionemoji = "";
    let remainingresource = "";
    let interpretedmap = reformat ? getinterpretedmap2(locations, roadblocks, initial_var) : getinterpretedmap(locations, roadblocks, initial_var);
    let hasring = false;
    let details = "";
    let report = "";


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
            if (type < 2) {
                solution = "**Solution not found, best path to an airplane:**\n";
            }
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
        // TODO checks for moves already made
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
                postar = 200 - 10000/(postar);
            }

            arearned = postar - prear;
        } catch (e) {
        }
        if (bestsolution["airplane"]) {
            apearned = "0"
        }
        if (bestsolution["shopping"]) {
            apearned = apearned + " + 30";
        }

        if (bestsolution["airplane"]) {
            report = `Remaining moves: ${bestsolution['remainingmoves'].reduce((a,b) => a < b ? a : b)}\n`;
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
        report = report + `Solutions found: ${globalv['totalsol']}\n`;

        // report = report + `Optimization: ${globalv["optimization"]}\n`
        if (bestsolution["airplane"]) {
            let issafe = "an **unsafe**";
            if (bestsolution["safe"]) {
                issafe = "a **safe**"
            }
            report = report + `Showing ${issafe} solution to airplane`;
            if (hasring) report = report + "\n(with ring)";

        } else if (globalv['iterations'] < max_iteration) {
            report = report + "The solution found is optimal";
            if (hasring) report = report + "\n(with ring)";
        } else {
            report = report + "Max iteration reached";
            if (hasring) report = report + "\n(with ring)";
        }
        report = report + "\n\u200b\n";

        remainingresource = "Gas: " + bestsolution["resources"][0];
        if (bestsolution["airplane"]) remainingresource = remainingresource + ` \u200b (${bestsolution['remainingmoves'][0]} moves)`
        remainingresource = remainingresource + "\nFood: " + bestsolution["resources"][1];
        if (bestsolution["airplane"]) remainingresource = remainingresource + ` \u200b (${bestsolution['remainingmoves'][1]} moves)`
        remainingresource = remainingresource + "\nDrink: " + bestsolution["resources"][2];
        if (bestsolution["airplane"]) remainingresource = remainingresource + ` \u200b (${bestsolution['remainingmoves'][2]} moves)`
        remainingresource = remainingresource + "\nEntertainment : " + bestsolution["resources"][3];
        if (bestsolution["airplane"]) remainingresource = remainingresource + ` \u200b (${bestsolution['remainingmoves'][3]} moves)`

        report = report + "**Remaining Resource:**\n" + remainingresource + "\u200b\n"      
    }
    let poterr = [];
    for (let i = 0; i < locationlist.length - 3; i++) {
        if (!location_string.includes(locationlist[i])) {
            poterr.push(denotations[locationlist[i]]);
        }
    }

    let desc = solution;
    let rvembed = new MessageEmbed()
        .setTitle("Data Solver Run Results")
        .setDescription(desc);

    if (poterr.length > 0) {
        rvembed.addField("⚠️ Potential Error:", `Missing: ${poterr.join(", ")}`, false);
    }
    rvembed.addFields(
        {name: "> " + solutionemoji, value: "\u200b", inline: false},
        {name: "Report:", value: report, inline: true},
        {name: "Interpreted Map:", value: interpretedmap, inline: true}
    );
    let footertext = "";
    if (Object.keys(bestsolution).length > 0) {
        if (hasring) {
            footertext += " React ❌ for no ring. ";
        }
        if (type != 1) {
            footertext += "React 👑 for a standard solution. ";
        }
        if (type != 3 && !globalv["bestsolution"]["airplane"]) {
            footertext += "React ✈️ for a path to airplane (if there exist one). ";
        }
    } else {
        hasring = 0;
    }
    if (reformat) {
        footertext += "\nReact 📱 to revert to the original formatting."
    } else {
        footertext += "\nThe map's formatting is optimized for 16px chat font scaling. React 📱 if it is too messy";
    }

    rvembed.setFooter(footertext);

    return rvembed
}

// for mobile
function getinterpretedmap2(locations, roadblocks, initial_var) {
    let interpretedmap = "```";

    let arrows = {
        "u": "↑",
        "d": "↓",
        "r": "\u200b \u200b → \u200b \u200b",
        "l": "\u200b \u200b ← \u200b \u200b",
    }

    let intersection = ["╬","╦","╠","╔","╣","╗","║","╥","╩","═","╚","╞","╝","╡","╨"," "];

    for (let i = 0; i < 15; i++) {
        if (i % 2 == 0) {
            let intersection_val = (blocked(i-1, 0, roadblocks) ? 1 : 0) + 2 + (blocked(i, 1, roadblocks) ? 4 : 0) + (blocked(i+1, 0, roadblocks) ? 8 : 0);
            interpretedmap += intersection[intersection_val];      
            for (let j = 0; j < 5; j++) {
                if (initial_var["car_y"] == i && initial_var["car_x"] == j*2+1) {
                    interpretedmap += arrows[initial_var["direction"]];
                } else if (blocked(i, 2*j+1, roadblocks)){
                    // 2 space + 2 nqsp + 4 fsp
                    interpretedmap += "    ";
                } else {
                    interpretedmap += "════";
                }

                let intersection_val = (blocked(i-1, 2*(j+1), roadblocks) ? 1 : 0) + (blocked(i, 2*(j+1)-1, roadblocks) ? 2 : 0) + (blocked(i, 2*(j+1)+1, roadblocks) ? 4 : 0) + (blocked(i+1, 2*(j+1), roadblocks) ? 8 : 0);
                interpretedmap += intersection[intersection_val];     
            }
            interpretedmap += "\n"
        } else {
            for (let j = 0; j < 6; j++) {
                if (initial_var["car_y"] == i && initial_var["car_x"] == j*2) {
                    interpretedmap += arrows[initial_var["direction"]];
                } else if (blocked(i, 2*j, roadblocks)){
                    interpretedmap += " ";
                } else {
                    interpretedmap += "║";
                }
                if (j < 5) interpretedmap += ` ${location_emojis[locations[Math.floor(i / 2)][j]]} `;
            }
            interpretedmap += "\n"
        }
    }

    interpretedmap += "```"
    return interpretedmap;
}

function getinterpretedmap(locations, roadblocks, initial_var) {
    let interpretedmap = "";

    // Intepreted map
    
    // 16 px
    //PC => 3msp + nqsp
    //mobile => thsp + nqsp + nqsp
    let arrows = {
        "u": "\u200b ↑ \u200b",
        "d": "\u200b ↓ \u200b",
        "r": " \u200b → \u200b ",
        "l": " \u200b ← \u200b ",
    }

    // 1 => u
    // 2 => l
    // 4 => r
    // 8 => d
    let intersection = ["╬","╦","╠","╔","╣","╗","║","╥","╩","═","╚","╞","╝","╡","╨"," "];
    // pc: 3msp + nqsp
    // mobile: replace 3msp with thsp + nqsp
    // gap 4 nqsp + thsp
    
    // for (let j = 0; j < 5; j++)
    //     interpretedmap += "═══╦";
    // interpretedmap += "\u200b ╔═══╦\n"
    // interpretedmap += "\u200b ╔      ╦\n"
    // interpretedmap += `\u200b \u200b ↓ \u200b \u200b ${location_emojis["f"]} ║(thsp + nqsp+ nqsp)║\n`
    // interpretedmap += `\u200b \u200b ↓ \u200b ${location_emojis["s"]} ║(3msp + nqsp)║\n`

    for (let i = 0; i < 15; i++) {
        if (i % 2 == 0) {
            let intersection_val = (blocked(i-1, 0, roadblocks) ? 1 : 0) + 2 + (blocked(i, 1, roadblocks) ? 4 : 0) + (blocked(i+1, 0, roadblocks) ? 8 : 0);
            interpretedmap += intersection[intersection_val];      
            for (let j = 0; j < 5; j++) {
                if (initial_var["car_y"] == i && initial_var["car_x"] == j*2+1) {
                    interpretedmap += arrows[initial_var["direction"]];
                } else if (blocked(i, 2*j+1, roadblocks)){
                    // 2 space + 2 nqsp + 4 fsp
                    interpretedmap += "        ";
                } else {
                    interpretedmap += "═══";
                }

                let intersection_val = (blocked(i-1, 2*(j+1), roadblocks) ? 1 : 0) + (blocked(i, 2*(j+1)-1, roadblocks) ? 2 : 0) + (blocked(i, 2*(j+1)+1, roadblocks) ? 4 : 0) + (blocked(i+1, 2*(j+1), roadblocks) ? 8 : 0);
                interpretedmap += intersection[intersection_val];     
            }
            interpretedmap += "\n"
        } else {
            for (let j = 0; j < 6; j++) {
                if (initial_var["car_y"] == i && initial_var["car_x"] == j*2) {
                    interpretedmap += arrows[initial_var["direction"]];
                } else if (blocked(i, 2*j, roadblocks)){
                    // nqsp + psp + hsp
                    interpretedmap += "   ";
                } else {
                    interpretedmap += "║";
                }
                if (j < 5) interpretedmap += ` ${location_emojis[locations[Math.floor(i / 2)][j]]} `;
            }
            interpretedmap += "\n"
        }
    }

    return interpretedmap;

    // old
    try {
    //interpretedmap = interpretedmap.split(" ").join("  ");

    // for (let i = 0; i < roadblocks.length - 1; i++) {
    //     if (i % 2 == 0) {
    //         interpretedmap += "\u200b ║";

    //         for (let j = 0; j < 4; j++) {
    //             interpretedmap += ` ${location_emojis[locations[Math.floor(i / 2)][j]]} `;
    //             if (roadblocks[i][j] == "0") {
    //                 interpretedmap += "║";
    //             } else {
    //                 interpretedmap += "\u200b \u200b ";
    //             }
    //         }
    //         interpretedmap += ` ${location_emojis[locations[Math.floor(i / 2)][4]]} \u200b ║\n`;
    //     } else {
    //         interpretedmap += "\u200b \u200b \u200b ";
    //         for (let j = 0; j < 5; j++) {
    //             if (roadblocks[i][j] == "0") {
    //                 interpretedmap += "═══ \u200b";
    //             } else {
    //                 interpretedmap += "\u200b \u200b \u200b \u200b \u200b \u200b \u200b \u200b \u200b \u200b";
    //             }
    //             interpretedmap += "\u200b \u200b";
    //         }
    //         interpretedmap += "\n";
    //     }
    // }
    // interpretedmap += "\u200b \u200b \u200b"
    // for (let j = 0; j < 5; j++)
    //     interpretedmap += "═══ \u200b";
    // interpretedmap += "\n"

    // if (direction == "l") {
    //     interpretedmap += "     ⬅️ 🚘";
    // } else {
    //     interpretedmap += "      🚘 ➡️";
    // }
    } finally {}
}

module.exports.limitlesschannels = limitlesschannels;
module.exports.logchannel = logchannel;
module.exports.admins = admins;

module.exports.run = async (client, message) => {
    let starttime = Date.now()/1000;

    let imurl = ""
    let uid = message.author.id;
    let pnginput = false;
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
                    pnginput = true
                }
            }
        } else if (message.attachments.length > 0) {
            if (vipchannels.includes(message.channel.id)) {
                imurl = message.attachments[0].url;
            }
        } else {
            if (vipchannels.includes(message.channel.id)) {
                imurl = message.content;
            }
        }

        if (imurl && imurl.length <= 0) {
            return;
        }

        getinput(imurl, message, starttime, uid, pnginput);
    } catch(e) {
        return;
    }
}

