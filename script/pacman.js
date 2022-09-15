/*jslint browser: true, undef: true, eqeqeq: true, nomen: true, white: true */
/*global window: false, document: false */

/*
 * fix looped audio
 * add fruits + levels
 * fix what happens when a ghost is eaten (should go back to base)
 * do proper ghost mechanics (blinky/wimpy etc)
 */

//for leaderboard
var score_mode_list = [];
var timer_mode_list = [];
function compare_func_leaderboard(a, b) //compare function for sorting in leaderboard
{
    if (a.level == b.level)
        return b.score - a.score;
    else
        return b.level - a.level;
}

var NONE = 4,
    UP = 3,
    LEFT = 2,
    DOWN = 1,
    RIGHT = 11,
    WAITING = 5,
    PAUSE = 6,
    PLAYING = 7,
    COUNTDOWN = 8,
    EATEN_PAUSE = 9,
    DYING = 10,
    Pacman = {};
var playmode = 0;
var level_now = 1;
var blockSize = $('#pacman')[0].offsetWidth / 21;

Pacman.FPS = 30;    //pacman speed

function goingThrough(pos, direction) { //for setting warping tunnels
    //going through holes for lv.1
    if (level_now == 1) {
        if (pos.y === 100 && pos.x >= 200 && direction === RIGHT) {
            return { "y": 100, "x": -10 };
        }
        if (pos.y === 100 && pos.x <= -10 && direction === LEFT) {
            return { "y": 100, "x": 200 };
        }

        if (pos.y === 40 && pos.x >= 200 && direction === RIGHT) {
            return { "y": 160, "x": -10 };
        }
        if (pos.y === 40 && pos.x <= -10 && direction === LEFT) {
            return { "y": 160, "x": 200 };
        }

        if (pos.y === 160 && pos.x >= 200 && direction === RIGHT) {
            return { "y": 40, "x": -10 };
        }
        if (pos.y === 160 && pos.x <= -10 && direction === LEFT) {
            return { "y": 40, "x": 200 };
        }
    }
    else if (level_now == 2) {
        if (pos.y === 100 && pos.x >= 200 && direction === RIGHT) {
            return { "y": 100, "x": -10 };
        }
        if (pos.y === 100 && pos.x <= -10 && direction === LEFT) {
            return { "y": 100, "x": 200 };
        }
    }
    else if (level_now == 3) {
        if (pos.y === 100 && pos.x >= 200 && direction === RIGHT) {
            return { "y": 100, "x": -10 };
        }

        if (pos.y === 100 && pos.x <= -10 && direction === LEFT) {
            return { "y": 100, "x": 200 };
        }

        if (pos.x === 100 && pos.y >= 200 && direction === DOWN) {
            return { "y": 0, "x": 100 };
        }

        if (pos.x === 100 && pos.y <= 0 && direction === UP) {
            return { "y": 200, "x": 100 };
        }
    }
    return false;
};

Pacman.Ghost = function (game, map, colour) {

    var position = null,
        direction = null,
        eatable = null,
        eaten = null,
        due = null;

    function getNewCoord(dir, current) {

        var speed = isVunerable() ? 1 : isHidden() ? 4 : 2,
            xSpeed = (dir === LEFT && -speed || dir === RIGHT && speed || 0),
            ySpeed = (dir === DOWN && speed || dir === UP && -speed || 0);

        return {
            "x": addBounded(current.x, xSpeed),
            "y": addBounded(current.y, ySpeed)
        };
    };

    /* Collision detection(walls) is done when a ghost lands on an
     * exact block, make sure they dont skip over it 
     */
    function addBounded(x1, x2) {
        var rem = x1 % 10,
            result = rem + x2;
        if (rem !== 0 && result > 10) {
            return x1 + (10 - rem);
        } else if (rem > 0 && result < 0) {
            return x1 - rem;
        }
        return x1 + x2;
    };

    function isVunerable() {        //true if edible --> scared ghost
        return eatable !== null;
    };

    function isDangerous() {        //true if not eaten --> normal ghost
        return eaten === null;
    };

    function isHidden() {           //true if not edible and not eaten --> going back to base
        return eatable === null && eaten !== null;
    };

    function getRandomDirection() { //ghosts move at random
        var moves = (direction === LEFT || direction === RIGHT)
            ? [UP, DOWN] : [LEFT, RIGHT];
        /*if(position != null)
        {
            if(direction === LEFT || direction === RIGHT)
            {
                if(map.isWallSpace(position, UP) && map.isWallSpace(position, DOWN))
                    moves = [LEFT, RIGHT];
            }
            else
            {
                if(map.isWallSpace(position, LEFT) && map.isWallSpace(position, RIGHT))
                    moves = [UP, DOWN];
            }

            if(map.isWallSpace(position, moves[0]))
                return moves[1];
            else if(map.isWallSpace(position, moves[1]))
                return moves[0];
        }*/
        return moves[Math.floor(Math.random() * 2)];
    };

    function getSpawnLocation() {
        if (level_now == 1)
            return { "x": 100, "y": 40 };
        else if (level_now == 2)
            return { "x": 100, "y": 80 };
        else if (level_now == 3)
            return { "x": 100, "y": 100 };
        else if (level_now == 4)
            return { "x": 100, "y": 70};
        else if (level_now == 5)
            return { "x": 100, "y": 100};
    }

    function reset() {
        eaten = null;
        eatable = null;
        position = getSpawnLocation();
        //position = { "x": 100, "y": 40 };  //ghost spawn location for lv.1
        direction = getRandomDirection();
        due = getRandomDirection();
    };

    function onWholeSquare(x) {
        return x % 10 === 0;
    };

    function oppositeDirection(dir) {
        return dir === LEFT && RIGHT ||
            dir === RIGHT && LEFT ||
            dir === UP && DOWN || UP;
    };

    function makeEatable() {
        direction = oppositeDirection(direction);
        eatable = game.getTick();
    };

    function eat() {
        eatable = null;
        eaten = game.getTick();
    };

    function pointToCoord(x) {
        return Math.round(x / 10);
    };

    function nextSquare(x, dir) {
        var rem = x % 10;
        if (rem === 0) {
            return x;
        } else if (dir === RIGHT || dir === DOWN) {
            return x + (10 - rem);
        } else {
            return x - rem;
        }
    };

    function onGridSquare(pos) {
        return onWholeSquare(pos.y) && onWholeSquare(pos.x);
    };

    function secondsAgo(tick) {
        return (game.getTick() - tick) / Pacman.FPS;
    };

    function getColour() {
        if (eatable) {
            if (secondsAgo(eatable) > 5) {  //flick color between blue and white
                return game.getTick() % 20 > 10 ? "#FFFFFF" : "#0000BB";
            } else {
                return "#0000BB";   //scared color
            }
        } else if (eaten) { //ghost dead color
            return "#222";
        }
        return colour;
    };

    function toggleAnimation(dir, pos, colour) {
        if (eatable || eaten)
            return "koopa_" + colour + "_shell";

        if (dir === LEFT) {
            if (pos.x % 10 < 5) {
                return "koopa_" + colour + "_idle";
            }
            else {
                return "koopa_" + colour + "_walk";
            }
        }
        else if (dir === RIGHT) {
            if (pos.x % 10 < 5) {
                return "koopa_" + colour + "_idler";
            }
            else {
                return "koopa_" + colour + "_walkr";
            }
        }
        else if (dir === UP || dir === DOWN) {
            if (pos.y % 10 < 5) {
                return "koopa_" + colour + "_idle";
            }
            else {
                return "koopa_" + colour + "_walk";
            }
        }
        return "koopa_" + colour + "_idle";
    };

    function draw(ctx) {    //draw ghosts

        var s = blockSize,
            top = (position.y / 10) * s,
            left = (position.x / 10) * s;

        if (eatable && secondsAgo(eatable) > 8) {
            eatable = null;
        }

        if (eaten && secondsAgo(eaten) > 3) {
            eaten = null;
        }

        var tl = left + s;
        var base = top + s - 3;
        var inc = s / 10;

        var high = game.getTick() % 10 > 5 ? 3 : -3;
        var low = game.getTick() % 10 > 5 ? -3 : 3;
        ctx.beginPath();

        ctx.drawImage($('#' + toggleAnimation(direction, position, colour))[0],
            ((position.x / 10) * s),
            ((position.y / 10) * s),
            5 * s / 7,
            s
        );

        if (eatable) {
            if (secondsAgo(eatable) > 5) {  //flick 
                if (game.getTick() % 20 > 10) {
                    ctx.strokeStyle = '#E74C3C';
                    ctx.lineWidth = 5;
                    ctx.arc((position.x / 10) * s + s / 3, ((position.y / 10) * s + s / 3),
                        s / 10, 0, 2 * Math.PI);
                    ctx.stroke();
                }
                else {
                    ctx.strokeStyle = '#BB8FCE';
                    ctx.lineWidth = 5;
                    ctx.arc((position.x / 10) * s + s / 3, ((position.y / 10) * s + s / 3),
                        s / 10, 0, 2 * Math.PI);
                    ctx.stroke();
                }
            } else {
                ctx.strokeStyle = '#BB8FCE';
                ctx.lineWidth = 5;
                ctx.arc((position.x / 10) * s + s / 3, ((position.y / 10) * s + s / 3),
                    s / 10, 0, 2 * Math.PI);
                ctx.stroke();
            }
        }
        ctx.closePath();

    };

    function move(ctx) {

        var oldPos = position,
            onGrid = onGridSquare(position),
            npos = null;

        if (due !== direction) {

            npos = getNewCoord(due, position);

            if (onGrid && map.isFloorSpace({
                "y": pointToCoord(nextSquare(npos.y, due)),
                "x": pointToCoord(nextSquare(npos.x, due))
            })) {
                direction = due;
            } else {
                npos = null;
            }
        }

        if (npos === null) {
            npos = getNewCoord(direction, position);
        }

        if (onGrid && map.isWallSpace({
            "y": pointToCoord(nextSquare(npos.y, direction)),
            "x": pointToCoord(nextSquare(npos.x, direction))
        })) {
            due = getRandomDirection();
            //if there are walls above and under ghost, it must go left or right
            if (map.isWallSpace({
                "y": pointToCoord(nextSquare(npos.y + 10, UP)),
                "x": pointToCoord(nextSquare(npos.x, UP))
            }) &&
                map.isWallSpace({
                    "y": pointToCoord(nextSquare(npos.y - 10, DOWN)),
                    "x": pointToCoord(nextSquare(npos.x, DOWN))
                })

            ) {
                let temp = [RIGHT, LEFT];
                due = temp[Math.floor(Math.random() * 2)];
            }
            //if there are walls on left and right side of the ghost, it must go up or down
            if (map.isWallSpace({
                "y": pointToCoord(nextSquare(npos.y, RIGHT)),
                "x": pointToCoord(nextSquare(npos.x + 10, RIGHT))
            }) &&
                map.isWallSpace({
                    "y": pointToCoord(nextSquare(npos.y, LEFT)),
                    "x": pointToCoord(nextSquare(npos.x - 10, LEFT))
                })

            ) {
                let temp = [UP, DOWN];
                due = temp[Math.floor(Math.random() * 2)];
            }
            return move(ctx);
        }

        position = npos;

        var tmp = goingThrough(position, direction);
        if (tmp) {
            position = tmp;
        }

        due = getRandomDirection();

        return {
            "new": position,
            "old": oldPos
        };
    };

    return {
        "eat": eat,
        "isVunerable": isVunerable,
        "isDangerous": isDangerous,
        "makeEatable": makeEatable,
        "reset": reset,
        "move": move,
        "draw": draw
    };
};

Pacman.User = function (game, map) {

    var position = null,
        direction = null,
        eaten = null,
        due = null,
        lives = null,
        score = 5,
        keyMap = {};

    keyMap[KEY.ARROW_LEFT] = LEFT;
    keyMap[KEY.ARROW_UP] = UP;
    keyMap[KEY.ARROW_RIGHT] = RIGHT;
    keyMap[KEY.ARROW_DOWN] = DOWN;

    function addScore(nScore) {
        score += nScore;
        if (score >= 10000 && score - nScore < 10000) { //if score hits 10k, life +1 
            lives += 1;
        }
    };

    function theScore() {
        return score;
    };

    function loseLife() {
        prev_amount = null;
        increasing = 1;
        lives -= 1;
    };

    function addLife() {
        lives += 1;
    }

    function getLives() {
        return lives;
    };

    function initUser() {
        prev_amount = null;
        increasing = 1;

        score = 0;
        if (playmode == 1)
            lives = 3;
        else if (playmode == 2)
            lives = 1;
        else
            lives = 0;
        newLevel();
    }

    function newLevel() {
        resetPosition();
        eaten = 0;
    };

    function getSpawnLocation() {
        if (level_now == 1)
            return { "x": 100, "y": 120 };
        else if (level_now == 2)
            return { "x": 100, "y": 120 };
        else if (level_now == 3)
            return { "x": 100, "y": 40 };
        else if (level_now == 4)
            return { "x": 100, "y": 170 };
        else if (level_now == 5)
            return { "x": 100, "y": 20 };
    }

    function resetPosition() {
        position = getSpawnLocation();
        //position = { "x": 100, "y": 120 }; //spawn point of pacman for lv.1
        direction = LEFT;
        due = LEFT;
    };

    function reset() {
        initUser();
        resetPosition();
    };

    function keyDown(e) {
        if (typeof keyMap[e.keyCode] !== "undefined") {
            due = keyMap[e.keyCode];
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        return true;
    };

    function getNewCoord(dir, current) {
        return {
            "x": current.x + (dir === LEFT && -2 || dir === RIGHT && 2 || 0),
            "y": current.y + (dir === DOWN && 2 || dir === UP && -2 || 0)
        };
    };

    function onWholeSquare(x) {
        return x % 10 === 0;
    };

    function pointToCoord(x) {
        return Math.round(x / 10);
    };

    function nextSquare(x, dir) {
        var rem = x % 10;
        if (rem === 0) {
            return x;
        } else if (dir === RIGHT || dir === DOWN) {
            return x + (10 - rem);
        } else {
            return x - rem;
        }
    };

    function next(pos, dir) {
        return {
            "y": pointToCoord(nextSquare(pos.y, dir)),
            "x": pointToCoord(nextSquare(pos.x, dir)),
        };
    };

    function onGridSquare(pos) {
        return onWholeSquare(pos.y) && onWholeSquare(pos.x);
    };

    function isOnSamePlane(due, dir) {
        return ((due === LEFT || due === RIGHT) &&
            (dir === LEFT || dir === RIGHT)) ||
            ((due === UP || due === DOWN) &&
                (dir === UP || dir === DOWN));
    };

    function move(ctx) {

        var npos = null,
            nextWhole = null,
            oldPosition = position,
            block = null;

        if (due !== direction) {
            npos = getNewCoord(due, position);

            if (isOnSamePlane(due, direction) ||
                (onGridSquare(position) &&
                    map.isFloorSpace(next(npos, due)))) {
                direction = due;
            } else {
                npos = null;
            }
        }

        if (npos === null) {
            npos = getNewCoord(direction, position);
        }

        if (onGridSquare(position) && map.isWallSpace(next(npos, direction))) {
            direction = NONE;
        }

        if (direction === NONE) {
            return { "new": position, "old": position };
        }

        var temp_pos = goingThrough(npos, direction)
        if (temp_pos != false)
            npos = temp_pos

        //console.log(npos);

        position = npos;
        nextWhole = next(position, direction);

        block = map.block(nextWhole);

        if ((isMidSquare(position.y) || isMidSquare(position.x)) &&
            block === Pacman.BISCUIT || block === Pacman.PILL || block == Pacman.CHERRY) {

            map.setBlock(nextWhole, Pacman.EMPTY);
            if (block === Pacman.BISCUIT)
                addScore(10);
            else if (block === Pacman.CHERRY)
            {
                if(!soundDisabled())
                {
                    $('#eatCherry')[0].load();
                    $('#eatCherry')[0].play();
                }
                addScore(30);
            }
            else
                addScore(50);
            //if eat biscuit, score+10. cherry+30. others(pill/ghost) +50. 
            eaten += 1;

            if (eaten == getPassingScore()) {
                //if (eaten === 165) { //coin eaten = 165 (for lv.1) = pass
                game.completedLevel();
            }

            if (block === Pacman.PILL) { //pill = big coin
                game.eatenPill();
            }
        }

        return {
            "new": position,
            "old": oldPosition
        };
    };

    function getPassingScore() {
        //if (level_now == 1)
        //    return 165;
        //else if(level_now == 2)
        //    return 149;
        var passscore = 0;
        var arr = Pacman.MAP[level_now - 1];
        for (var i = 0; i < arr.length; i++) {
            for (var j = 0; j < arr[i].length; j++) {
                if (arr[i][j] == Pacman.BISCUIT || arr[i][j] == Pacman.PILL ||
                    arr[i][j] == Pacman.CHERRY) {
                    passscore++;
                }
            }
        }
        return passscore;
    }

    function isMidSquare(x) {
        var rem = x % 10;
        return rem > 3 || rem < 7;
    };

    function calcAngle(dir, pos) {
        if (dir == RIGHT && (pos.x % 10 < 5)) {
            return { "start": 0.25, "end": 1.75, "direction": false };  //moving right
        } else if (dir === DOWN && (pos.y % 10 < 5)) {
            return { "start": 0.75, "end": 2.25, "direction": false };  //moving down
        } else if (dir === UP && (pos.y % 10 < 5)) {
            return { "start": 1.25, "end": 1.75, "direction": true };   //moving up
        } else if (dir === LEFT && (pos.x % 10 < 5)) {
            return { "start": 0.75, "end": 1.25, "direction": true };   //moving left
        }
        return { "start": 0, "end": 2, "direction": false };    //still
    };

    function toggleAnimation(dir, pos) {
        if (dir === RIGHT) {
            if (pos.x % 15 < 5)
                return "mario_walk1";
            else if (pos.x % 15 < 10)
                return "mario_walk2";
            else
                return "mario_walk3";
        }
        else if (dir === LEFT)   //if user going left use flipped version
        {
            if (pos.x % 15 < 5)
                return "mario_walk1l";
            else if (pos.x % 15 < 10)
                return "mario_walk2l";
            else
                return "mario_walk3l";
        }
        else if (dir === UP || dir === DOWN) {
            if (pos.y % 15 < 5)
                return "mario_walk1";
            else if (pos.y % 15 < 10)
                return "mario_walk2";
            else
                return "mario_walk3";
        }
        return "mario_idle";
    }

    var prev_amount = null; //for clearing previous image
    var increasing = 1; //for controlling mario's fall. 0.1->1 mario go up and after that fall
    function drawDead(ctx, amount, ghosts) {    //dead animation
        //console.log(amount);
        var size = blockSize,
            half = size / 2;

        //clearing previous image
        var img = ctx.createImageData(size + 1, size + 1);
        for (var i = img.data.length; --i >= 0;)
            img.data[i] = 0;
        ctx.putImageData(img, ((position.x / 10) * size),
            ((position.y / 10) * size * (increasing + prev_amount)));

        //checking position -- if mario falls to bottom of the map, stop
        if ((position.y / 10) * size * (increasing + prev_amount) >= ((map.height * size) - 10)) {
            return true;
        }

        //draw new image
        map.draw(ctx);
        map.drawPills(ctx);
        for (i = 0, len = ghosts.length; i < len; i += 1) {
            ghosts[i].draw(ctx);
        }
        ctx.drawImage($('#mario_dead')[0],
            ((position.x / 10) * size),
            ((position.y / 10) * size * (increasing + amount)),
            size,
            size
        );

        increasing = increasing + 0.2;
        prev_amount = amount;
        return false;
    };

    function draw(ctx) {

        var s = blockSize,
            angle = calcAngle(direction, position);
        var sprite = $('#' + toggleAnimation(direction, position))[0]; //get appropriate sprite
        ctx.drawImage(sprite,
            ((position.x / 10) * s),
            ((position.y / 10) * s),
            s,
            s
        );
    };

    initUser();

    return {
        "draw": draw,
        "drawDead": drawDead,
        "loseLife": loseLife,
        "addLife": addLife,
        "getLives": getLives,
        "score": score,
        "addScore": addScore,
        "theScore": theScore,
        "keyDown": keyDown,
        "move": move,
        "newLevel": newLevel,
        "reset": reset,
        "resetPosition": resetPosition
    };
};

Pacman.Map = function () {

    var height = null,
        width = null,
        //blockSize = size,
        pillSize = 0,
        map = null;
    var wall_colour = ['#0000FF', '#27AE60', '#D4AC0D', '#CA6F1E', '#C0392B'];

    function withinBounds(y, x) {
        return y >= 0 && y < height && x >= 0 && x < width;
    }

    function isWall(pos) {
        return withinBounds(pos.y, pos.x) && map[pos.y][pos.x] === Pacman.WALL;
    }

    function isFloorSpace(pos) {    //check if it's floor - add cherry cond here too
        if (!withinBounds(pos.y, pos.x)) {
            return false;
        }
        var peice = map[pos.y][pos.x];
        return peice === Pacman.EMPTY ||
            peice === Pacman.BISCUIT ||
            peice === Pacman.CHERRY ||
            peice === Pacman.PILL;
    }

    function drawWall(ctx) {

        var i, j, p, line;

        ctx.strokeStyle = wall_colour[level_now-1];    //wall color
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        for (i = 0; i < Pacman.WALLS[level_now - 1].length; i += 1) {
            line = Pacman.WALLS[level_now - 1][i];
            ctx.beginPath();

            for (j = 0; j < line.length; j += 1) {

                p = line[j];

                if (p.move) {
                    ctx.moveTo(p.move[0] * blockSize, p.move[1] * blockSize);
                } else if (p.line) {
                    ctx.lineTo(p.line[0] * blockSize, p.line[1] * blockSize);
                } else if (p.curve) {
                    ctx.quadraticCurveTo(p.curve[0] * blockSize,
                        p.curve[1] * blockSize,
                        p.curve[2] * blockSize,
                        p.curve[3] * blockSize);
                }
            }
            ctx.stroke();
        }
    }

    function reset() {
        map = Pacman.MAP[level_now - 1].clone();
        height = map.length;
        width = map[0].length;
    };

    function block(pos) {
        return map[pos.y][pos.x];
    };

    function setBlock(pos, type) {
        map[pos.y][pos.x] = type;
    };

    function drawPills(ctx) { //draw pill
        /*if (++pillSize > 30) {
            pillSize = 0;
        }*/

        for (i = 0; i < height; i += 1) {
            for (j = 0; j < width; j += 1) {
                if (map[i][j] === Pacman.PILL) {
                    ctx.beginPath();
                    ctx.fillStyle = "#000";
                    ctx.fillRect((j * blockSize), (i * blockSize),
                        blockSize, blockSize);
                    ctx.drawImage($('#mushroom')[0],
                        (j * blockSize) + (0.05 * blockSize),
                        (i * blockSize) + (0.05 * blockSize),
                        blockSize * 0.9,
                        blockSize * 0.9);
                    ctx.closePath();
                }
            }
        }
    };

    function draw(ctx) {    //draw whole map

        var i, j, size = blockSize;

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width * size, height * size * 1.05);

        drawWall(ctx);

        for (i = 0; i < height; i += 1) {
            for (j = 0; j < width; j += 1) {
                drawBlock(i, j, ctx);
            }
        }
    };

    function drawBlock(y, x, ctx) { //draw block

        var layout = map[y][x];

        if (layout === Pacman.PILL) {
            return;
        }

        ctx.beginPath();

        if (layout === Pacman.EMPTY || layout === Pacman.BLOCK ||
            layout === Pacman.BISCUIT || layout === Pacman.CHERRY) {

            ctx.fillStyle = "#000"; //bg color
            ctx.fillRect((x * blockSize), (y * blockSize),
                blockSize, blockSize);

            if (layout === Pacman.BISCUIT) {
                ctx.drawImage($('#coin')[0],
                    (x * blockSize) + (blockSize * 0.25),
                    (y * blockSize) + (blockSize * 0.25),
                    blockSize * 0.5,
                    blockSize * 0.5);
            }
            else if (layout === Pacman.CHERRY) {
                ctx.drawImage($('#star')[0],
                    (x * blockSize) + (blockSize * 0),
                    (y * blockSize) + (blockSize * 0),
                    blockSize,
                    blockSize);
            }
        }
        ctx.closePath();
    };

    reset();

    return {
        "draw": draw,
        "drawBlock": drawBlock,
        "drawPills": drawPills,
        "block": block,
        "setBlock": setBlock,
        "reset": reset,
        "isWallSpace": isWall,
        "isFloorSpace": isFloorSpace,
        "height": height,
        "width": width,
        "blockSize": blockSize
    };
};

Pacman.Audio = function (game) { //set sound

    var files = [],
        endEvents = [],
        progressEvents = [],
        playing = [];

    function load(name, path, cb) {

        var f = files[name] = document.createElement("audio");

        progressEvents[name] = function (event) { progress(event, name, cb); };

        f.addEventListener("canplaythrough", progressEvents[name], true);
        f.setAttribute("preload", "true");
        f.setAttribute("autobuffer", "true");
        f.setAttribute("src", path);
        f.pause();
    };

    function progress(event, name, callback) {
        if (event.loaded === event.total && typeof callback === "function") {
            callback();
            files[name].removeEventListener("canplaythrough",
                progressEvents[name], true);
        }
    };

    function disableSound() {
        for (var i = 0; i < playing.length; i++) {
            files[playing[i]].pause();
            files[playing[i]].currentTime = 0;
        }
        playing = [];
    };

    function ended(name) {

        var i, tmp = [], found = false;

        files[name].removeEventListener("ended", endEvents[name], true);

        for (i = 0; i < playing.length; i++) {
            if (!found && playing[i]) {
                found = true;
            } else {
                tmp.push(playing[i]);
            }
        }
        playing = tmp;
    };

    function play(name) {
        if (!game.soundDisabled()) {
            endEvents[name] = function () { ended(name); };
            playing.push(name);
            files[name].addEventListener("ended", endEvents[name], true);
            files[name].play();
        }
    };

    function pause() {
        for (var i = 0; i < playing.length; i++) {
            files[playing[i]].pause();
        }
    };

    function resume() {
        for (var i = 0; i < playing.length; i++) {
            files[playing[i]].play();
        }
    };

    return {
        "disableSound": disableSound,
        "load": load,
        "play": play,
        "pause": pause,
        "resume": resume
    };
};

var PACMAN = (function () {

    var state = WAITING,
        audio = null,
        ghosts = [],
        //ghostSpecs = [], //for testing map -- empty ghostspecs array = no ghost
        ghostSpecs = ["red", "green", "blue", "yellow"], //ghost color
        eatenCount = 0,
        //level = 0,
        tick = 0,
        ghostPos, userPos,
        stateChanged = true,
        timerStart = null,
        lastTime = 0,
        ctx = null,
        timer = null,
        timer_mode = null,
        duration = null,
        gameStart = null,
        map = null,
        user = null,
        stored = null;

    function getTick() {
        return tick;
    };

    function drawScore(text, position) {    //score when eating ghosts
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "12px BDCartoonShoutRegular";
        ctx.fillText(text,
            (position["new"]["x"] / 10) * blockSize,
            ((position["new"]["y"] + 5) / 10) * blockSize);
    }

    function dialog(text) {
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = '#9700FF';
        ctx.lineWidth = '0.5';
        ctx.font = "bold 15px BDCartoonShoutRegular";
        var width = ctx.measureText(text).width,
            x = ((map.width * blockSize) - width) / 2;
        ctx.fillText(text, x, ((map.height * blockSize) / 2) - 30);
        ctx.strokeText(text, x, ((map.height * blockSize) / 2) - 30); //text border
    }

    function startLevel() {
        user.resetPosition();
        for (var i = 0; i < ghosts.length; i += 1) {
            ghosts[i].reset();
        }
        audio.play("start");
        timerStart = tick;
        setState(COUNTDOWN);
    }

    function startNewGame() {
        tick = 0;
        setState(WAITING);
        //level = 1;
        level_now = 1;  //config start level at game start
        user.reset();
        map.reset();
        map.draw(ctx);
        if(playmode == 2) //time limit + 5 seconds
        {
            gameStart = tick;
            duration = 605;
            timer = 605;
        }
        startLevel();
    }

    function keyDown(e) {
        if (e.keyCode === KEY.N) {  //n = start over
            startNewGame();
        } else if (e.keyCode === KEY.P && state === PAUSE) {    //press p to resume
            audio.resume();
            map.draw(ctx);
            setState(stored);
        } else if (e.keyCode === KEY.P) {   //press p to pause
            if(!soundDisabled())
            {
                $('#pause_game')[0].load();
                $('#pause_game')[0].play();
            }
            stored = state;
            setState(PAUSE);
            audio.pause();
            map.draw(ctx);
            dialog("Paused");
        } else if (state !== PAUSE) {
            return user.keyDown(e);
        }
        return true;
    }

    function loseLife() {
        setState(WAITING);
        user.loseLife();
        if (user.getLives() > 0) {
            startLevel();
        }
        else {
            game_end();//ask for recording score if game over
        }
    }

    function setState(nState) {
        state = nState;
        stateChanged = true;
    };

    function collided(user, ghost) {
        return (Math.sqrt(Math.pow(ghost.x - user.x, 2) +
            Math.pow(ghost.y - user.y, 2))) < 10;
    };

    function drawFooter() {

        var topLeft = (map.height * blockSize) + 50,
            textBase = topLeft + 17;

        $('#score').text(user.theScore());
        $('#lives').text(user.getLives());
        $('#level').text(level_now);
    }

    function redrawBlock(pos) {
        map.drawBlock(Math.floor(pos.y / 10), Math.floor(pos.x / 10), ctx);
        map.drawBlock(Math.ceil(pos.y / 10), Math.ceil(pos.x / 10), ctx);
    }

    function mainDraw() {

        var diff, u, i, len, nScore;

        ghostPos = [];

        //draw ghost
        for (i = 0, len = ghosts.length; i < len; i += 1) {
            ghostPos.push(ghosts[i].move(ctx));
        }
        u = user.move(ctx);

        for (i = 0, len = ghosts.length; i < len; i += 1) {
            redrawBlock(ghostPos[i].old);
        }
        redrawBlock(u.old);

        for (i = 0, len = ghosts.length; i < len; i += 1) {
            ghosts[i].draw(ctx);
        }
        user.draw(ctx);

        userPos = u["new"];

        for (i = 0, len = ghosts.length; i < len; i += 1) {
            if (collided(userPos, ghostPos[i]["new"])) {
                if (ghosts[i].isVunerable()) {
                    audio.play("eatghost");
                    ghosts[i].eat();
                    eatenCount += 1;
                    nScore = eatenCount * 50;
                    drawScore(nScore, ghostPos[i]);
                    user.addScore(nScore);
                    setState(EATEN_PAUSE);
                    timerStart = tick;
                } else if (ghosts[i].isDangerous()) {
                    audio.play("die");
                    setState(DYING);
                    timerStart = tick;
                }
            }
        }
    };

    var dead_done;
    function mainLoop() {
        var diff;

        if (state !== PAUSE) {
            ++tick;
        }
        map.drawPills(ctx);

        if(!soundDisabled() && (state === PLAYING || state === EATEN_PAUSE))
        {
            $('#gameplay_bgm')[0].play();
            $('#gameplay_bgm')[0].loop = true;
        }
        else
        {
            $('#gameplay_bgm')[0].pause();
        }

        if (state === PLAYING) {
            mainDraw();
        } else if (state === WAITING && stateChanged) {     //load          
            stateChanged = false;
            map.draw(ctx);
            dialog("Press N to start a New game");
        } else if (state === EATEN_PAUSE &&
            (tick - timerStart) > (Pacman.FPS / 3)) {    //eat
            map.draw(ctx);
            setState(PLAYING);
        } else if (state === DYING) {       //die
            if (tick - timerStart > (Pacman.FPS * 5) || (dead_done == true)) {
                loseLife();
                dead_done = false;
            } else {
                redrawBlock(userPos);
                for (i = 0, len = ghosts.length; i < len; i += 1) {
                    redrawBlock(ghostPos[i].old);
                    ghostPos.push(ghosts[i].draw(ctx));
                }
                dead_done = user.drawDead(ctx, (tick - timerStart) / (Pacman.FPS * 2), ghosts);
            }
        } else if (state === COUNTDOWN) {   //countdown to start

            diff = 5 + Math.floor((timerStart - tick) / Pacman.FPS);

            if (diff === 0) {
                map.draw(ctx);
                setState(PLAYING);
            } else {
                if (diff !== lastTime) {
                    lastTime = diff;
                    map.draw(ctx);
                    dialog("Starting in: " + diff);
                }
            }
        }
        if(playmode == 2 && state === PLAYING && timer != null && timer > 0)
        {
            console.log(Math.floor((gameStart - tick) / Pacman.FPS));
            //in-game second so that the timer won't go ahead when the game is lagged
            timer_mode = duration + Math.floor((gameStart - tick) / Pacman.FPS);
            var minutes = parseInt(timer_mode / 60, 10);
            var seconds = parseInt(timer_mode % 60, 10);

            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;

            $('#timer').text(minutes + ":" + seconds);

            if (timer_mode < duration * 0.25) //change text from yellow to red when time less than 25%
            {
                $('#timer_clk').addClass('text-danger');
                $('#timer_clk').removeClass('text-warning');
            }
            if (timer_mode <= 0) {
                game_end(1);
                setState(WAITING);
                timer_mode = null;
                gameStart = null;
                duration = null;
            }
        }

        drawFooter();
    }

    function eatenPill() {
        audio.play("eatpill");
        timerStart = tick;
        eatenCount = 0;
        for (i = 0; i < ghosts.length; i += 1) {
            ghosts[i].makeEatable(ctx);
        }
    };

    function completedLevel() {
        setState(WAITING);
        if(level_now == 3) //pass level 3 add another koopa
        {
            alert('GAH! I have taken my eyes off you for a few minutes and '+
                    'you are already this far?!' + 
                    'then here is another of my underling.'+ 
                    'Have fun being stucked with them');
            alert('GAH HA HA HA');
            var newghost = new Pacman.Ghost({ "getTick": getTick }, map, 'black');
            ghosts.push(newghost);
        }
        if(level_now % 2 == 0) //pass level 2,4,... get one more life
        {
            user.addLife();
        }
        level_now += 1;
        //level_now = level;
        if (level_now > Pacman.MAP.length) {
            //alert('Congratulation! You have cleared all avaliable levels.');
            game_end(2);
            level_now = 1;
             //reset map 
             //or when preview, 
             //the program will read Pacman.WALLS[next level which does not exist]
            map.reset();
            newgame();  //reset game
            return;
        }
        map.reset();
        user.newLevel();
        startLevel();
    };

    function keyPress(e) {
        if (state !== WAITING && state !== PAUSE) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    function init(wrapper, root) {

        var i, len, ghost,
            //blockSize = wrapper.offsetWidth / 21,
            canvas = document.createElement("canvas");

        canvas.setAttribute("width", (blockSize * 21) + "px");
        canvas.setAttribute("height", (blockSize * 25) + 55 + "px");

        wrapper.appendChild(canvas);

        ctx = canvas.getContext('2d');

        audio = new Pacman.Audio({ "soundDisabled": soundDisabled });
        map = new Pacman.Map();
        user = new Pacman.User({
            "completedLevel": completedLevel,
            "eatenPill": eatenPill
        }, map);

        for (i = 0, len = ghostSpecs.length; i < len; i += 1) {
            ghost = new Pacman.Ghost({ "getTick": getTick }, map, ghostSpecs[i]);
            ghosts.push(ghost);
        }

        map.draw(ctx);
        dialog("Loading ...");

        var extension = Modernizr.audio.ogg ? 'ogg' : 'mp3';

        var audio_files = [
            ["start", root + "./audio_mario/start." + extension],
            ["die", root + "./audio_mario/die." + extension],
            ["eatghost", root + "./audio_mario/eatghost." + extension],
            ["eatpill", root + "./audio_mario/eatpill." + extension],
            ["eating", root + "./audio_mario/eating." + extension],
            //["eating2", root + "audio/eating.short." + extension]
        ];

        load(audio_files, function () { loaded(); });
    };

    function load(arr, callback) {

        if (arr.length === 0) {
            callback();
        } else {
            var x = arr.pop();
            audio.load(x[0], x[1], function () { load(arr, callback); });
        }
    };

    function loaded() {

        dialog("Press N to Start"); //start game 

        document.addEventListener("keydown", keyDown, true);
        document.addEventListener("keypress", keyPress, true);

        timer = window.setInterval(mainLoop, 1000 / Pacman.FPS);
    };

    function newgame() {    //restart the game after going back to menu
        if(retry == true)
        {
            document.addEventListener("keydown", keyDown, true);
            document.addEventListener("keypress", keyPress, true);
        }
        setState(WAITING);
        stateChanged = false;
        map.draw(ctx);
        dialog("Press N to Start a new game"); //start game
    }

    function game_end(end_cause = 0)
    {
        $('#gameplay_bgm')[0].pause();
        //remove keybind to prevent starting new game while in this page
        document.removeEventListener("keydown", keyDown, true);
        document.removeEventListener("keypress", keyPress, true);

        $('#back_gameplay_mode').hide();
        $('#pacman').hide();
        $('#mobile_keypad').hide();
        $('#game_end').show();
        $('#record_score').prop('disabled', false);
        $('#game_end').attr('data-end-cause', end_cause);

        if(end_cause == 2)
        {
            $('#end_cause').text('Congratulation!');
            if(!soundDisabled())
            {
                $('#clear_bgm')[0].load();
                $('#clear_bgm')[0].play();
            }
            $('#watch_ending').show();
        }
        else
        {
            $('#watch_ending').hide();
            $('#end_cause').text('Game over');
            if(!soundDisabled())
            {
                $('#gameover_bgm')[0].load();
                $('#gameover_bgm')[0].play();
            }
        }
    }

    $('#record_score').click(function()
    {
        var cause = $('#game_end').attr('data-end-cause');
        var user_name = "";
            user_name = prompt("Please enter your name");
            if (user_name != null)   //user_name = null means that user hits cancel
            {
                $('#record_score').prop('disabled', true);
                //get array data from localstorage
                get_scoredata();

                //record score
                var arrToPush; //for picking array to add values
                if (playmode == 1)
                    arrToPush = score_mode_list;
                else if (playmode == 2)
                    arrToPush = timer_mode_list;
                else
                    return;

                if (user_name != '' && arrToPush != []) {
                    //filter the data with the same name 
                    //if find same name in storage, 
                    //delete the past one if the current is higher rank
                    arrToPush = arrToPush.filter(function (a) {
                        if (a.name != null && a.name.toLowerCase() == user_name.toLowerCase()) {
                            if (a.level == level)
                                return a.score > user.theScore();
                            else
                                return a.level > level;
                        }
                        else
                            return true;
                    });
                }
                //console.log(arrToPush);
                //in case of present score < past score which means ignore the current one
                if (arrToPush.find(function (a) { return a.name != null && a.name.toLowerCase() == user_name.toLowerCase() }) == undefined) {
                    arrToPush.push({
                        "name": (user_name != '' ? user_name : null),
                        "level": level_now,
                        "score": user.theScore(),
                        "cause": cause
                    });
                }
                else
                    return;
                arrToPush.sort(compare_func_leaderboard); //compare level then score

                //save to localstorage
                if (playmode == 1) {
                    localStorage.setItem("score_leaderboard", JSON.stringify(arrToPush));
                }
                else if (playmode == 2)
                    localStorage.setItem("timer_leaderboard", JSON.stringify(arrToPush));

                //update table
                update_leaderboard();
            }
    })

    function get_scoredata() {
        score_mode_list = localStorage.getItem("score_leaderboard");
        timer_mode_list = localStorage.getItem("timer_leaderboard");

        if (score_mode_list == null)
            score_mode_list = [];
        else
        {
            score_mode_list = JSON.parse(score_mode_list);
            score_mode_list.sort(compare_func_leaderboard);
        }

        if (timer_mode_list == null)
            timer_mode_list = [];
        else
        {
            timer_mode_list = JSON.parse(timer_mode_list);
            timer_mode_list.sort(compare_func_leaderboard);
        }
    }

    function update_leaderboard() {
        //get array data from localstorage
        var board = [];
        get_scoredata();
        board[0] = score_mode_list;
        board[1] = timer_mode_list;

        //update table
        for (let mode = 0; mode <= 1; mode++) {
            $('#leaderboard' + (mode + 1) + ' tbody').empty(); //clear table body
            if (board[mode].length == 0) {
                $('#leaderboard' + (mode + 1) + ' tbody').html('<tr><td colspan="4" class="text-center">No record yet!</td></tr>');
            }
            else {
                for (let i = 0; i < board[mode].length; i++) {
                    $('#leaderboard' + (mode + 1) + ' tbody').append(
                        '<tr><th scope="row"> ' + (i + 1) + '</th> ' +
                        '<td> ' + (board[mode][i].name == null ? 'Anonymous' : board[mode][i].name) + '</td>' +
                        '<td> ' + board[mode][i].level + '</td><td> ' + board[mode][i].score + '</td>' +
                        '</tr>');
                    if (board[mode][i].cause == 1)
                        $('#leaderboard' + (mode + 1) + ' tbody > tr').eq(i).addClass('text-warning');
                    else if (board[mode][i].cause == 2)
                        $('#leaderboard' + (mode + 1) + ' tbody > tr').eq(i).addClass('text-success');
                }
            }
        }
    }

    $(document).ready(function () {
        update_leaderboard();
    });

    $(window).on('orientationchange', function(){
        if (/Mobi/.test(navigator.userAgent)) { //pause the game if on landscape mobile
            if(window.innerHeight > window.innerWidth){
                if(state != PAUSE)
                    stored = state;
                setState(PAUSE);
                audio.pause();
                map.draw(ctx);
                dialog("Paused");
            }
        }
    });

    $(window).on('resize', function(){
        if (/Mobi/.test(navigator.userAgent) && window.innerHeight < window.innerWidth) { 
            return;
        }
        else
        {
            if($('#pacman > canvas').length > 0 && $('#pacman').css('display') != 'none')
            {
                ctx.clearRect(0,0,map.width*blockSize, map.height*blockSize);

                blockSize = $('#pacman')[0].offsetWidth / 21;

                $('#pacman > canvas')[0].setAttribute("width", (blockSize * 21) + "px");
                $('#pacman > canvas')[0].setAttribute("height", (blockSize * 23) + 55 + "px");
                $('#pacman > canvas').height('');
                if($('#pacman > canvas').height() > window.innerHeight*0.65)
                {
                    $('#pacman > canvas').height(window.innerHeight*0.65);
                }

                if (state === PLAYING) {
                    mainDraw();
                }
                if(state != PAUSE)
                    stored = state;
                setState(PAUSE);
                audio.pause();
                map.draw(ctx);
                dialog("Paused");

                drawFooter();
            }
        }
    });

    return {
        "init": init,
        "newgame": newgame
    };
}());

/* Human readable keyCode index */
var KEY = { 'BACKSPACE': 8, 'TAB': 9, 'NUM_PAD_CLEAR': 12, 'ENTER': 13, 'SHIFT': 16, 'CTRL': 17, 'ALT': 18, 'PAUSE': 19, 'CAPS_LOCK': 20, 'ESCAPE': 27, 'SPACEBAR': 32, 'PAGE_UP': 33, 'PAGE_DOWN': 34, 'END': 35, 'HOME': 36, 'ARROW_LEFT': 37, 'ARROW_UP': 38, 'ARROW_RIGHT': 39, 'ARROW_DOWN': 40, 'PRINT_SCREEN': 44, 'INSERT': 45, 'DELETE': 46, 'SEMICOLON': 59, 'WINDOWS_LEFT': 91, 'WINDOWS_RIGHT': 92, 'SELECT': 93, 'NUM_PAD_ASTERISK': 106, 'NUM_PAD_PLUS_SIGN': 107, 'NUM_PAD_HYPHEN-MINUS': 109, 'NUM_PAD_FULL_STOP': 110, 'NUM_PAD_SOLIDUS': 111, 'NUM_LOCK': 144, 'SCROLL_LOCK': 145, 'SEMICOLON': 186, 'EQUALS_SIGN': 187, 'COMMA': 188, 'HYPHEN-MINUS': 189, 'FULL_STOP': 190, 'SOLIDUS': 191, 'GRAVE_ACCENT': 192, 'LEFT_SQUARE_BRACKET': 219, 'REVERSE_SOLIDUS': 220, 'RIGHT_SQUARE_BRACKET': 221, 'APOSTROPHE': 222 };

(function () {
    /* 0 - 9 */
    for (var i = 48; i <= 57; i++) {
        KEY['' + (i - 48)] = i;
    }
    /* A - Z */
    for (i = 65; i <= 90; i++) {
        KEY['' + String.fromCharCode(i)] = i;
    }
    /* NUM_PAD_0 - NUM_PAD_9 */
    for (i = 96; i <= 105; i++) {
        KEY['NUM_PAD_' + (i - 96)] = i;
    }
    /* F1 - F12 */
    for (i = 112; i <= 123; i++) {
        KEY['F' + (i - 112 + 1)] = i;
    }
})();

Pacman.WALL = 0;
Pacman.BISCUIT = 1;
Pacman.EMPTY = 2;
Pacman.BLOCK = 3;
Pacman.PILL = 4;
Pacman.CHERRY = 5;
//also don't forget to add it in map

//map = where each element is. however, it won't draw a line. we need to define lines in WALLS
/*Pacman.MAP = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 4, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 4, 0],
    [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
    [2, 2, 2, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 2, 2, 2],
    [0, 0, 0, 0, 1, 0, 1, 0, 0, 3, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    [2, 2, 2, 2, 1, 1, 1, 0, 3, 3, 3, 0, 1, 1, 1, 2, 2, 2, 2],
    [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    [2, 2, 2, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 2, 2, 2],
    [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
    [0, 4, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 4, 0],
    [0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0],
    [0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

//curve is hyperbola (m5 math man) with abs a == abs b
//line is actual line of walls
//move is starting point

Pacman.WALLS = [

    [{ "move": [0, 9.5] }, { "line": [3, 9.5] },
    { "curve": [3.5, 9.5, 3.5, 9] }, { "line": [3.5, 8] },
    { "curve": [3.5, 7.5, 3, 7.5] }, { "line": [1, 7.5] },
    { "curve": [0.5, 7.5, 0.5, 7] }, { "line": [0.5, 1] },
    { "curve": [0.5, 0.5, 1, 0.5] }, { "line": [9, 0.5] },
    { "curve": [9.5, 0.5, 9.5, 1] }, { "line": [9.5, 3.5] }],

    [{ "move": [9.5, 1] },
    { "curve": [9.5, 0.5, 10, 0.5] }, { "line": [18, 0.5] },
    { "curve": [18.5, 0.5, 18.5, 1] }, { "line": [18.5, 7] },
    { "curve": [18.5, 7.5, 18, 7.5] }, { "line": [16, 7.5] },
    { "curve": [15.5, 7.5, 15.5, 8] }, { "line": [15.5, 9] },
    { "curve": [15.5, 9.5, 16, 9.5] }, { "line": [19, 9.5] }],

    [{ "move": [2.5, 5.5] }, { "line": [3.5, 5.5] }],

    [{ "move": [3, 2.5] },
    { "curve": [3.5, 2.5, 3.5, 3] },
    { "curve": [3.5, 3.5, 3, 3.5] },
    { "curve": [2.5, 3.5, 2.5, 3] },
    { "curve": [2.5, 2.5, 3, 2.5] }],

    [{ "move": [15.5, 5.5] }, { "line": [16.5, 5.5] }],

    [{ "move": [16, 2.5] }, { "curve": [16.5, 2.5, 16.5, 3] },
    { "curve": [16.5, 3.5, 16, 3.5] }, { "curve": [15.5, 3.5, 15.5, 3] },
    { "curve": [15.5, 2.5, 16, 2.5] }],

    [{ "move": [6, 2.5] }, { "line": [7, 2.5] }, { "curve": [7.5, 2.5, 7.5, 3] },
    { "curve": [7.5, 3.5, 7, 3.5] }, { "line": [6, 3.5] },
    { "curve": [5.5, 3.5, 5.5, 3] }, { "curve": [5.5, 2.5, 6, 2.5] }],

    [{ "move": [12, 2.5] }, { "line": [13, 2.5] }, { "curve": [13.5, 2.5, 13.5, 3] },
    { "curve": [13.5, 3.5, 13, 3.5] }, { "line": [12, 3.5] },
    { "curve": [11.5, 3.5, 11.5, 3] }, { "curve": [11.5, 2.5, 12, 2.5] }],

    [{ "move": [7.5, 5.5] }, { "line": [9, 5.5] }, { "curve": [9.5, 5.5, 9.5, 6] },
    { "line": [9.5, 7.5] }],
    [{ "move": [9.5, 6] }, { "curve": [9.5, 5.5, 10.5, 5.5] },
    { "line": [11.5, 5.5] }],


    [{ "move": [5.5, 5.5] }, { "line": [5.5, 7] }, { "curve": [5.5, 7.5, 6, 7.5] },
    { "line": [7.5, 7.5] }],
    [{ "move": [6, 7.5] }, { "curve": [5.5, 7.5, 5.5, 8] }, { "line": [5.5, 9.5] }],

    [{ "move": [13.5, 5.5] }, { "line": [13.5, 7] },
    { "curve": [13.5, 7.5, 13, 7.5] }, { "line": [11.5, 7.5] }],
    [{ "move": [13, 7.5] }, { "curve": [13.5, 7.5, 13.5, 8] },
    { "line": [13.5, 9.5] }],

    [{ "move": [0, 11.5] }, { "line": [3, 11.5] }, { "curve": [3.5, 11.5, 3.5, 12] },
    { "line": [3.5, 13] }, { "curve": [3.5, 13.5, 3, 13.5] }, { "line": [1, 13.5] },
    { "curve": [0.5, 13.5, 0.5, 14] }, { "line": [0.5, 17] },
    { "curve": [0.5, 17.5, 1, 17.5] }, { "line": [1.5, 17.5] }],
    [{ "move": [1, 17.5] }, { "curve": [0.5, 17.5, 0.5, 18] }, { "line": [0.5, 21] },
    { "curve": [0.5, 21.5, 1, 21.5] }, { "line": [18, 21.5] },
    { "curve": [18.5, 21.5, 18.5, 21] }, { "line": [18.5, 18] },
    { "curve": [18.5, 17.5, 18, 17.5] }, { "line": [17.5, 17.5] }],
    [{ "move": [18, 17.5] }, { "curve": [18.5, 17.5, 18.5, 17] },
    { "line": [18.5, 14] }, { "curve": [18.5, 13.5, 18, 13.5] },
    { "line": [16, 13.5] }, { "curve": [15.5, 13.5, 15.5, 13] },
    { "line": [15.5, 12] }, { "curve": [15.5, 11.5, 16, 11.5] },
    { "line": [19, 11.5] }],

    [{ "move": [5.5, 11.5] }, { "line": [5.5, 13.5] }],
    [{ "move": [13.5, 11.5] }, { "line": [13.5, 13.5] }],

    [{ "move": [2.5, 15.5] }, { "line": [3, 15.5] },
    { "curve": [3.5, 15.5, 3.5, 16] }, { "line": [3.5, 17.5] }],
    [{ "move": [16.5, 15.5] }, { "line": [16, 15.5] },
    { "curve": [15.5, 15.5, 15.5, 16] }, { "line": [15.5, 17.5] }],

    [{ "move": [5.5, 15.5] }, { "line": [7.5, 15.5] }],
    [{ "move": [11.5, 15.5] }, { "line": [13.5, 15.5] }],

    [{ "move": [2.5, 19.5] }, { "line": [5, 19.5] },
    { "curve": [5.5, 19.5, 5.5, 19] }, { "line": [5.5, 17.5] }],
    [{ "move": [5.5, 19] }, { "curve": [5.5, 19.5, 6, 19.5] },
    { "line": [7.5, 19.5] }],

    [{ "move": [11.5, 19.5] }, { "line": [13, 19.5] },
    { "curve": [13.5, 19.5, 13.5, 19] }, { "line": [13.5, 17.5] }],
    [{ "move": [13.5, 19] }, { "curve": [13.5, 19.5, 14, 19.5] },
    { "line": [16.5, 19.5] }],

    [{ "move": [7.5, 13.5] }, { "line": [9, 13.5] },
    { "curve": [9.5, 13.5, 9.5, 14] }, { "line": [9.5, 15.5] }],
    [{ "move": [9.5, 14] }, { "curve": [9.5, 13.5, 10, 13.5] },
    { "line": [11.5, 13.5] }],

    [{ "move": [7.5, 17.5] }, { "line": [9, 17.5] },
    { "curve": [9.5, 17.5, 9.5, 18] }, { "line": [9.5, 19.5] }],
    [{ "move": [9.5, 18] }, { "curve": [9.5, 17.5, 10, 17.5] },
    { "line": [11.5, 17.5] }],

    [{ "move": [8.5, 9.5] }, { "line": [8, 9.5] }, { "curve": [7.5, 9.5, 7.5, 10] },
    { "line": [7.5, 11] }, { "curve": [7.5, 11.5, 8, 11.5] },
    { "line": [11, 11.5] }, { "curve": [11.5, 11.5, 11.5, 11] },
    { "line": [11.5, 10] }, { "curve": [11.5, 9.5, 11, 9.5] },
    { "line": [10.5, 9.5] }]
];*/

Pacman.MAP = [
    [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0],
        [2, 2, 1, 1, 4, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 4, 1, 1, 2, 2],
        [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [2, 2, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 2, 2],
        [0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0],
        [0, 0, 1, 0, 1, 0, 1, 0, 1, 2, 2, 2, 1, 0, 1, 0, 1, 0, 1, 0, 0],
        [0, 0, 1, 4, 1, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 1, 4, 1, 0, 0],
        [0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0],
        [0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0],
        [2, 2, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 2, 2],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],      
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 4, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 4, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 2, 2, 2, 5, 2, 2, 2, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 0],
        [2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2],
        [0, 0, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 2, 2, 2, 2, 2, 2, 2, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 4, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 4, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 0, 0, 4, 0, 0, 0, 1, 0, 1, 0, 0, 0, 4, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 1, 1, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
        [2, 2, 1, 1, 1, 1, 1, 1, 0, 1, 5, 1, 0, 1, 1, 1, 1, 1, 1, 1, 2],
        [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 4, 0, 0, 0, 1, 0, 1, 0, 0, 0, 4, 0, 0, 1, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ], 
    [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 4, 1, 1, 0, 1, 0, 1, 5, 1, 0, 1, 0, 1, 1, 4, 1, 0, 0],
        [0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0],
        [0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 1, 1, 1, 0, 1, 2, 2, 5, 2, 2, 1, 0, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0],
        [0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 2, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0],
        [0, 0, 1, 4, 1, 1, 0, 1, 0, 2, 2, 2, 0, 1, 0, 1, 1, 4, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ], 
    [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 0, 2, 2, 2, 2, 2, 2, 2, 0, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, 2, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, 2, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, 2, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 1, 2, 0, 0, 0, 0, 0, 2, 1, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, 2, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 1, 1, 1, 0, 2, 2, 2, 2, 2, 2, 2, 0, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 4, 1, 1, 1, 5, 1, 0, 0, 0, 0, 0, 1, 5, 1, 1, 1, 4, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 4, 1, 0, 0, 0, 0, 0, 1, 4, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 5, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ]
];

Pacman.WALLS = [
    [
        [{ "move": [0.5, 3.5] }, { "line": [1.5, 3.5] }, { "line": [1.5, 0.5] }, { "line": [19.5, 0.5] },
        { "line": [19.5, 3.5] }, { "line": [20.5, 3.5] }],
        [{ "move": [3.5, 2.5] }, { "line": [5.5, 2.5] }, { "line": [5.5, 3.5] }, { "line": [3.5, 3.5] },
        { "line": [3.5, 2.5] }],
        [{ "move": [9.5, 2.5] }, { "line": [11.5, 2.5] }, { "line": [11.5, 3.5] }, { "line": [9.5, 3.5] },
        { "line": [9.5, 2.5] }],
        [{ "move": [15.5, 2.5] }, { "line": [17.5, 2.5] }, { "line": [17.5, 3.5] }, { "line": [15.5, 3.5] },
        { "line": [15.5, 2.5] }],
        [{ "move": [3.5, 5.5] }, { "line": [5.5, 5.5] }],
        [{ "move": [15.5, 5.5] }, { "line": [17.5, 5.5] }],
        [{ "move": [7.5, 2.5] }, { "line": [7.5, 5.5] }, { "line": [9.5, 5.5] }],
        [{ "move": [13.5, 2.5] }, { "line": [13.5, 5.5] }, { "line": [11.5, 5.5] }],
        [{ "move": [0.5, 5.5] }, { "line": [1.5, 5.5] }, { "line": [1.5, 7.5] }, { "line": [3.5, 7.5] },
        { "line": [3.5, 8.5] }, { "line": [1.5, 8.5] }, { "line": [1.5, 9.5] }, { "line": [0.5, 9.5] }],
        [{ "move": [5.5, 7.5] }, { "line": [9.5, 7.5] }, { "line": [9.5, 8.5] }, { "line": [5.5, 8.5] },
        { "line": [5.5, 7.5] }],
        [{ "move": [11.5, 7.5] }, { "line": [15.5, 7.5] }, { "line": [15.5, 8.5] }, { "line": [11.5, 8.5] },
        { "line": [11.5, 7.5] }],
        [{ "move": [20.5, 5.5] }, { "line": [19.5, 5.5] }, { "line": [19.5, 7.5] }, { "line": [17.5, 7.5] },
        { "line": [17.5, 8.5] }, { "line": [19.5, 8.5] }, { "line": [19.5, 9.5] }, { "line": [20.5, 9.5] }],
        [{ "move": [0.5, 11.5] }, { "line": [1.5, 11.5] }, { "line": [1.5, 15.5] }, { "line": [0.5, 15.5] }],
        [{ "move": [20.5, 11.5] }, { "line": [19.5, 11.5] }, { "line": [19.5, 15.5] }, { "line": [20.5, 15.5] }],
        [{ "move": [5.5, 10.5] }, { "line": [3.5, 10.5] }, { "line": [3.5, 12.5] }],
        [{ "move": [15.5, 10.5] }, { "line": [17.5, 10.5] }, { "line": [17.5, 12.5] }],
        [{ "move": [3.5, 14.5] }, { "line": [3.5, 16.5] }, { "line": [5.5, 16.5] }],
        [{ "move": [15.5, 16.5] }, { "line": [17.5, 16.5] }, { "line": [17.5, 14.5] }],
        [{ "move": [5.5, 12.5] }, { "line": [5.5, 14.5] }],
        [{ "move": [15.5, 12.5] }, { "line": [15.5, 14.5] }],
        [{ "move": [7.5, 10.5] }, { "line": [7.5, 16.5] }, { "move": [7.5, 13.5] }, { "line": [9.5, 13.5] }],
        [{ "move": [13.5, 10.5] }, { "line": [13.5, 16.5] }, { "move": [13.5, 13.5] }, { "line": [11.5, 13.5] }],
        [{ "move": [0.5, 17.5] }, { "line": [1.5, 17.5] }, { "line": [1.5, 18.5] }, { "line": [19.5, 18.5] },
        { "line": [19.5, 17.5] }, { "line": [20.5, 17.5] }],
        [{ "move": [9.5, 10.5] }, { "move": [11.5, 10.5] }, { "line": [11.5, 11.5] }, { "line": [9.5, 11.5] },
        { "line": [9.5, 10.5] }],
        [{ "move": [9.5, 15.5] }, { "line": [11.5, 15.5] }, { "line": [11.5, 16.5] }, { "line": [9.5, 16.5] },
        { "line": [9.5, 15.5] }]
    ],
    [
        [{ "move": [20.5, 9.5] }, { "line": [16.5, 9.5] }, { "line": [16.5, 7.5] },
        { "line": [19.5, 7.5] }, { "line": [19.5, 0.5] }, { "line": [1.5, 0.5] },
        { "line": [1.5, 7.5] }, { "line": [4.5, 7.5] }, { "line": [4.5, 9.5] },
        { "line": [0.5, 9.5] }],
        [{ "move": [10.5, 0.5] }, { "line": [10.5, 3.5] }],
        [{ "move": [10.5, 20.5] }, { "line": [10.5, 17.5] }],
        [{ "move": [0.5, 11.5] }, { "line": [4.5, 11.5] }, { "line": [4.5, 13.5] },
        { "line": [1.5, 13.5] }, { "line": [1.5, 20.5] }, { "line": [19.5, 20.5] },
        { "line": [19.5, 13.5] }, { "line": [16.5, 13.5] }, { "line": [16.5, 11.5] },
        { "line": [20.5, 11.5] }],
        [{ "move": [0.5, 9] }, { "line": [4, 9] }, { "line": [4, 8] }, { "line": [1, 8] },
        { "line": [1, 0] }, { "line": [20, 0] }, { "line": [20, 8] }, { "line": [17, 8] },
        { "line": [17, 9] }, { "line": [20.5, 9] }],
        [{ "move": [0.5, 12] }, { "line": [4, 12] }, { "line": [4, 13] }, { "line": [1, 13] },
        { "line": [1, 21] }, { "line": [20, 21] }, { "line": [20, 13] }, { "line": [17, 13] },
        { "line": [17, 12] }, { "line": [20.5, 12] }],
        [{ "move": [3.5, 2.5] }, { "line": [3.5, 3.5] }, { "line": [4.5, 3.5] },
        { "line": [4.5, 2.5] }, { "line": [3.5, 2.5] }],
        [{ "move": [6.5, 2.5] }, { "line": [6.5, 3.5] }, { "line": [8.5, 3.5] },
        { "line": [8.5, 2.5] }, { "line": [6.5, 2.5] }],
        [{ "move": [12.5, 2.5] }, { "line": [12.5, 3.5] }, { "line": [14.5, 3.5] },
        { "line": [14.5, 2.5] }, { "line": [12.5, 2.5] }],
        [{ "move": [16.5, 2.5] }, { "line": [16.5, 3.5] }, { "line": [17.5, 3.5] },
        { "line": [17.5, 2.5] }, { "line": [16.5, 2.5] }],
        [{ "move": [3.5, 5.5] }, { "line": [6.5, 5.5] }],
        [{ "move": [14.5, 5.5] }, { "line": [17.5, 5.5] }],
        [{ "move": [6.5, 7.5] }, { "line": [6.5, 9.5] }],
        [{ "move": [14.5, 7.5] }, { "line": [14.5, 9.5] }],
        [{ "move": [6.5, 11.5] }, { "line": [6.5, 13.5] }],
        [{ "move": [14.5, 11.5] }, { "line": [14.5, 13.5] }],
        [{ "move": [3.5, 15.5] }, { "line": [6.5, 15.5] }],
        [{ "move": [14.5, 15.5] }, { "line": [17.5, 15.5] }],
        [{ "move": [3.5, 17.5] }, { "line": [3.5, 18.5] }, { "line": [4.5, 18.5] },
        { "line": [4.5, 17.5] }, { "line": [3.5, 17.5] }],
        [{ "move": [6.5, 17.5] }, { "line": [6.5, 18.5] }, { "line": [8.5, 18.5] },
        { "line": [8.5, 17.5] }, { "line": [6.5, 17.5] }],
        [{ "move": [12.5, 17.5] }, { "line": [12.5, 18.5] }, { "line": [14.5, 18.5] },
        { "line": [14.5, 17.5] }, { "line": [12.5, 17.5] }],
        [{ "move": [16.5, 17.5] }, { "line": [16.5, 18.5] }, { "line": [17.5, 18.5] },
        { "line": [17.5, 17.5] }, { "line": [16.5, 17.5] }],
        [{ "move": [8.5, 5.5] }, { "line": [12.5, 5.5] }, { "line": [12.5, 7.5] },
        { "line": [8.5, 7.5] }, { "line": [8.5, 5.5] }],
        [{ "move": [8.5, 9.5] }, { "line": [8.5, 11.5] }, { "line": [12.5, 11.5] },
        { "line": [12.5, 9.5] }],
        [{ "move": [9, 9.5] }, { "line": [9, 11] }, { "line": [12, 11] },
        { "line": [12, 9.5] }],
        [{ "move": [8.5, 13.5] }, { "line": [12.5, 13.5] }, { "line": [12.5, 15.5] },
        { "line": [8.5, 15.5] }, { "line": [8.5, 13.5] }]
    ],
    [
        [{ "move": [4.5, 9.5] }, { "line": [1.5, 9.5] }, { "line": [1.5, 0.5] }, { "line": [9.5, 0.5] },
        { "line": [9.5, 0] }, { "line": [1, 0] }, { "line": [1, 10] }, { "line": [4.5, 10] },
        { "line": [4.5, 9.5] }],
        [{ "move": [16.5, 9.5] }, { "line": [19.5, 9.5] }, { "line": [19.5, 0.5] }, { "line": [11.5, 0.5] },
        { "line": [11.5, 0] }, { "line": [20, 0] }, { "line": [20, 10] }, { "line": [16.5, 10] },
        { "line": [16.5, 9.5] }],
        [{ "move": [16.5, 11.5] }, { "line": [19.5, 11.5] }, { "line": [19.5, 20.5] },
        { "line": [11.5, 20.5] }, { "line": [11.5, 21] }, { "line": [20, 21] }, { "line": [20, 11] },
        { "line": [16.5, 11] }, { "line": [16.5, 11.5] }],
        [{ "move": [4.5, 11.5] }, { "line": [1.5, 11.5] }, { "line": [1.5, 20.5] }, { "line": [9.5, 20.5] },
        { "line": [9.5, 21] }, { "line": [1, 21] }, { "line": [1, 11] }, { "line": [4.5, 11] },
        { "line": [4.5, 11.5] }],
        [{ "move": [3.5, 2.5] }, { "line": [4.5, 2.5] }, { "line": [4.5, 5.5] }, { "line": [3.5, 5.5] },
        { "line": [3.5, 2.5] }],
        [{ "move": [3.5, 15.5] }, { "line": [4.5, 15.5] }, { "line": [4.5, 18.5] }, { "line": [3.5, 18.5] },
        { "line": [3.5, 15.5] }],
        [{ "move": [16.5, 2.5] }, { "line": [17.5, 2.5] }, { "line": [17.5, 5.5] }, { "line": [16.5, 5.5] },
        { "line": [16.5, 2.5] }],
        [{ "move": [16.5, 15.5] }, { "line": [17.5, 15.5] }, { "line": [17.5, 18.5] },
        { "line": [16.5, 18.5] }, { "line": [16.5, 15.5] }],
        [{ "move": [6.5, 2.5] }, { "line": [8.5, 2.5] }, { "line": [8.5, 3.5] }, { "line": [6.5, 3.5] },
        { "line": [6.5, 2.5] }],
        [{ "move": [12.5, 2.5] }, { "line": [14.5, 2.5] }, { "line": [14.5, 3.5] }, { "line": [12.5, 3.5] },
        { "line": [12.5, 2.5] }],
        [{ "move": [6.5, 17.5] }, { "line": [8.5, 17.5] }, { "line": [8.5, 18.5] }, { "line": [6.5, 18.5] },
        { "line": [6.5, 17.5] }],
        [{ "move": [12.5, 17.5] }, { "line": [14.5, 17.5] }, { "line": [14.5, 18.5] },
        { "line": [12.5, 18.5] }, { "line": [12.5, 17.5] }],
        [{ "move": [10.5, 2.5] }, { "line": [10.5, 3.5] }],
        [{ "move": [10.5, 17.5] }, { "line": [10.5, 18.5] }],
        [{ "move": [6.5, 5.5] }, { "line": [6.5, 9.5] }],
        [{ "move": [3.5, 7.5] }, { "line": [8.5, 7.5] }],
        [{ "move": [6.5, 11.5] }, { "line": [6.5, 15.5] }],
        [{ "move": [3.5, 13.5] }, { "line": [8.5, 13.5] }],
        [{ "move": [14.5, 5.5] }, { "line": [14.5, 9.5] }],
        [{ "move": [12.5, 7.5] }, { "line": [17.5, 7.5] }],
        [{ "move": [14.5, 11.5] }, { "line": [14.5, 15.5] }],
        [{ "move": [12.5, 13.5] }, { "line": [17.5, 13.5] }],
        [{ "move": [8.5, 5.5] }, { "line": [12.5, 5.5] }],
        [{ "move": [10.5, 5.5] }, { "line": [10.5, 7.5] }],
        [{ "move": [8.5, 15.5] }, { "line": [12.5, 15.5] }],
        [{ "move": [10.5, 15.5] }, { "line": [10.5, 13.5] }],
        [{ "move": [9.5, 11.5] }, { "line": [8.5, 11.5] }, { "line": [8.5, 9.5] }, { "line": [9.5, 9.5] }],
        [{ "move": [11.5, 11.5] }, { "line": [12.5, 11.5] }, { "line": [12.5, 9.5] }, { "line": [11.5, 9.5] }]
    ],
    [
        [{"move":[1.5,1.5]}, {"line":[19.5,1.5]}, {"line":[19.5,21.5]}, 
        {"line":[1.5,21.5]}, {"line":[1.5,1.5]}], 
       [{"move":[1,1]}, {"line":[20,1]}, {"line":[20,22]}, 
        {"line":[1,22]}, {"line":[1,1]}], 
       [{"move":[3.5,3.5]}, {"line":[4.5,3.5]}, {"line":[4.5,4.5]}, {"line":[3.5,4.5]},
        {"line":[3.5,3.5]}],
       [{"move":[6.5,1.5]}, {"line":[6.5,6.5]}, {"line":[5.5,6.5]}], 
       [{"move":[10.5,1.5]}, {"line":[10.5,4.5]}], 
       [{"move":[8.5,3.5]}, {"line":[8.5,6.5]}, {"line":[9.5,6.5]}], 
       [{"move":[12.5,3.5]}, {"line":[12.5,6.5]}, {"line":[11.5,6.5]}], 
       [{"move":[14.5,1.5]}, {"line":[14.5,6.5]}, {"line":[15.5,6.5]}], 
       [{"move":[16.5,3.5]}, {"line":[17.5,3.5]}, {"line":[17.5,4.5]}, 
        {"line":[16.5,4.5]}, {"line":[16.5,3.5]}], 
       [{"move":[3.5,6.5]}, {"line":[3.5,8.5]}, {"line":[4.5,8.5]}], 
       [{"move":[17.5,6.5]}, {"line":[17.5,8.5]}, {"line":[16.5,8.5]}], 
       [{"move":[3.5,10.5]}, {"line":[6.5,10.5]}, {"line":[6.5,8.5]}], 
       [{"move":[17.5,10.5]}, {"line":[14.5,10.5]}, {"line":[14.5,8.5]}],
       [{"move":[12.5,8.5]}, {"line":[8.5,8.5]}], 
       [{"move":[8.5,10.5]}, {"line":[8.5,12.5]}, {"line":[12.5,12.5]}, 
        {"line":[12.5,10.5]}], 
       [{"move":[3.5,12.5]}, {"line":[6.5,12.5]}, {"line":[6.5,14.5]}],
       [{"move":[17.5,12.5]}, {"line":[14.5,12.5]}, {"line":[14.5,14.5]}], 
       [{"move":[12.5,14.5]}, {"line":[8.5,14.5]}], 
       [{"move":[4.5,14.5]}, {"line":[3.5,14.5]}, {"line":[3.5,16.5]}],
       [{"move":[16.5,14.5]}, {"line":[17.5,14.5]}, {"line":[17.5,16.5]}], 
       [{"move":[5.5,16.5]}, {"line":[6.5,16.5]}, {"line":[6.5,21.5]}], 
       [{"move":[15.5,16.5]}, {"line":[14.5,16.5]}, {"line":[14.5,21.5]}],
       [{"move":[3.5,18.5]}, {"line":[4.5,18.5]}, {"line":[4.5,19.5]}, 
        {"line":[3.5,19.5]}, {"line":[3.5,18.5]}], 
       [{"move":[16.5,18.5]}, {"line":[17.5,18.5]}, {"line":[17.5,19.5]}, 
        {"line":[16.5,19.5]}, {"line":[16.5,18.5]}], 
       [{"move":[11.5,16.5]}, {"line":[12.5,16.5]}, {"line":[12.5,19.5]}], 
       [{"move":[9.5,16.5]}, {"line":[8.5,16.5]}, {"line":[8.5,19.5]}], 
       [{"move":[10.5,21.5]}, {"line":[10.5,18.5]}]  
    ], 
    [
        [{"move":[1.5,1.5]}, {"line":[19.5,1.5]}, {"line":[19.5,23.5]}, 
        {"line":[1.5,23.5]}, {"line":[1.5,1.5]}], 
       [{"move":[1,1]}, {"line":[20,1]}, {"line":[20,24]}, 
        {"line":[1,24]}, {"line":[1,1]}], 
       [{"move":[6.5,1.5]}, {"line":[6.5,5.5]}], 
       [{"move":[14.5,1.5]}, {"line":[14.5,5.5]}], 
       [{"move":[6.5,23.5]}, {"line":[6.5,19.5]}], 
       [{"move":[14.5,23.5]}, {"line":[14.5,19.5]}], 
       [{"move":[3.5,3.5]}, {"line":[4.5,3.5]}, {"line":[4.5,7.5]}, 
        {"line":[3.5,7.5]}, {"line":[3.5,3.5]}], 
       [{"move":[16.5,3.5]}, {"line":[17.5,3.5]}, {"line":[17.5,7.5]}, 
        {"line":[16.5,7.5]}, {"line":[16.5,3.5]}], 
       [{"move":[3.5,17.5]}, {"line":[4.5,17.5]}, {"line":[4.5,21.5]}, 
        {"line":[3.5,21.5]}, {"line":[3.5,17.5]}], 
       [{"move":[16.5,17.5]}, {"line":[17.5,17.5]}, {"line":[17.5,21.5]}, 
        {"line":[16.5,21.5]}, {"line":[16.5,17.5]}], 
       [{"move":[3.5,9.5]}, {"line":[4.5,9.5]}, {"line":[4.5,11.5]}, 
        {"line":[3.5,11.5]}, {"line":[3.5,9.5]}], 
       [{"move":[16.5,9.5]}, {"line":[17.5,9.5]}, {"line":[17.5,11.5]}, 
        {"line":[16.5,11.5]}, {"line":[16.5,9.5]}], 
       [{"move":[3.5,13.5]}, {"line":[4.5,13.5]}, {"line":[4.5,15.5]}, 
        {"line":[3.5,15.5]}, {"line":[3.5,13.5]}], 
       [{"move":[16.5,13.5]}, {"line":[17.5,13.5]}, {"line":[17.5,15.5]}, 
        {"line":[16.5,15.5]}, {"line":[16.5,13.5]}], 
       [{"move":[8.5,3.5]}, {"line":[12.5,3.5]}, {"line":[12.5,7.5]}, 
        {"line":[8.5,7.5]}, {"line":[8.5,3.5]}], 
       [{"move":[8.5,17.5]}, {"line":[12.5,17.5]}, {"line":[12.5,21.5]}, 
        {"line":[8.5,21.5]}, {"line":[8.5,17.5]}], 
       [{"move":[6.5,7.5]}, {"line":[6.5,11.5]}], 
       [{"move":[6.5,9.5]}, {"line":[14.5,9.5]}], 
       [{"move":[14.5,7.5]}, {"line":[14.5,11.5]}], 
       [{"move":[6.5,13.5]}, {"line":[6.5,17.5]}], 
       [{"move":[6.5,15.5]}, {"line":[9.5,15.5]}], 
       [{"move":[14.5,13.5]}, {"line":[14.5,17.5]}], 
       [{"move":[11.5,15.5]}, {"line":[14.5,15.5]}], 
       [{"move":[9.5,11.5]}, {"line":[8.5,11.5]}, {"line":[8.5,13.5]}, 
        {"line":[12.5,13.5]}, {"line":[12.5,11.5]}, {"line":[11.5,11.5]}]
    ]
];

Object.prototype.clone = function () {
    var i, newObj = (this instanceof Array) ? [] : {};
    for (i in this) {
        if (i === 'clone') {
            continue;
        }
        if (this[i] && typeof this[i] === "object") {
            newObj[i] = this[i].clone();
        } else {
            newObj[i] = this[i];
        }
    }
    return newObj;
};
