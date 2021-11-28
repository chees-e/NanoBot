const cv = require("opencv4nodejs");
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
    negate_direction,
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
let xletter = "abcdef";
let filename = `./loc/in.png`;
let radius = 16;

try {
    let temp_img = cv.imread(filename, cv.IMREAD_UNCHANGED);

    for (let i = 0; i < locationy.length; i++) {
        for (let j = 0; j < locationx[i].length; j++) {
            let curry = locationy[i];
            let currx = locationx[i][j];
            let sub_image = temp_img.getRegion(new cv.Rect(currx - radius, curry - radius, 2 * radius, 2 * radius));
            cv.imwrite(`./out/${xletter[j]}${i}.png`, sub_image)
        }
    }
} catch(e) {
    console.log(e)
}
console.log("done")