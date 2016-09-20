var NUM_ROW    = 15;
var NUM_COLUMN = 30;

var FONT = 20;
var FONT_X_SPACING = FONT * 1.0;
var FONT_Y_SPACING = FONT * 1.2;

var GRID_X_SPACING = FONT * 1.0;
var GRID_Y_SPACING = FONT * 1.2;

var GRID_X_BUFFER  = Math.floor(FONT * 0.1);
var GRID_Y_BUFFER  = Math.floor(FONT * 1.0);

var FONT_X_BUFFER  = Math.floor(FONT * 0.6);
var FONT_Y_BUFFER  = Math.floor(FONT * 1.0);

var NUM_MAP_ROW    = 40;
var NUM_MAP_COLUMN = 80;

var SPLIT_PROB     = 0.1;

var canvas  = document.getElementById("my_canvas");
var context = canvas.getContext("2d");

var jstick;
var asciidisplay;
var displayBuffer;
var mapBuffer;
var mapRandArray;

//And so it begins...
//An endless flood of unneeded classes
//You suck
class Joystick {
    constructor(){
	this.up    = false;
	this.down  = false;
	this.left  = false;
	this.right = false;
    }
}

//We will define an entity class here
//This should allow us to make a SIMPLE
//struct with no methods that contains a series of 
//values to represent state and behaviors...
class Entity {
    constructor(name){
	this.name  = name;
	this.mapY  = -1;
	this.mapX  = -1;
	this.gridY = -1;
	this.gridX = -1;
	this.oldGridX = -1;
	this.oldGridY = -1;
	this.gridArrY = [-1, -1, -1];
	this.gridArrX = [-1, -1, -1];
	this.isMoving = false;
	this.sigil = "F";
    }

    defineBehavior(b){
	this.behavior = b;
    }

    getGridY(){
	return Math.floor(this.gridY);
    }

    getGridX(){
	return Math.floor(this.gridX);
    }

}

function SuperController(){
    var instance;

    SuperController = function(){
	return instance;
    }

    SuperController.prototype = this;

    instance = new SuperController();

    instance.constructor = SuperController;

    instance.gc = new GridController();

    // Controller calls the loop for GridController
    // so we can stop events from occuring on the grid at
    // will....
    instance.loop = function(lastFrameTime, entTable){
	var time;
	
	instance.gc.loop(lastFrameTime, entTable);

	requestAnimFrame(function(){
	    instance.loop(time, entTable);
	});
    }

    instance.gcInit = function(){
	var entTable;
	
	entTable = instance.gc.init();
	instance.loop(new Date().getTime(), entTable);
	// instance.loop
    }

    return instance;
}

function GridController(){
    var instance;

    // Singleton stuff
    GridController = function(){
	return instance;
    }
    
    GridController.prototype = this;

    instance = new GridController();

    instance.constructor = GridController;

    instance.loop = function(lastFrameTime, entTable){
	var time;

	//Update timer
	// time = (new Date()).getTime();
	//console.log(Math.floor(Math.pow((time - lastFrameTime), -1) * 1000));

	//Update game state
	instance.update((time - lastFrameTime), entTable);
	
	//TODO write this method and call it here....
	//Update room if needed
	
	//Get the next frame
	// requestAnimFrame(function(){
	//     instance.loop(time, entTable);
	// });
    }

    instance.update = function(time, entTable){
	instance.executeBehavior(entTable);

	//drawBkg(entTable);
	updateEnt(entTable);
	instance.grid_delta_update_draw_hyper_drive_activate();
	//drawGridBuffer();
	//drawDisplay();
	
	//if(b){
	//	drawChar(0, 0, "X", "#ff0000");
	//}else{
	//	drawChar(0, 0, "X");
	//}
    }

    //This is where the game starts bitch
    instance.init = function(){
	var coral_size;
	
	var mapPosTable;
	var gridPosTable;

	//Contains all our entity objects...
	var entTable;

	//var jstick;
	jstick = new Joystick();

	//context stuff
	// context.fillStyle = bColor;
	// context.fillStyle = fColor;
	context.textAlign = "center";
	context.font = FONT + "px sans-serif";

	//Init map stuff
	coral_size = 0;
	while(coral_size < 200){
	    initMap();
	    console.log("Coraling...");
	    coral_size = instance.coral(-1, -1);
	    console.log("coral size..." + coral_size);
	    //Keep doing this until the map is our requisite
	    //size....
	}
	//Initalize position tables
	mapPosTable  = {};
	gridPosTable = {};
	
	entTable     = {};

	entTable["Fay"] = [];
	for(var i=0; i<2; i++){
	    entTable["Fay"][i] = {};
	    entTable["Fay"][i] = new Entity("Fay");
	    entTable["Fay"][i].defineBehavior([walkBehavior]);
	}
	//entTable["Fay"][0] = new Entity("Fay");
	//entTable["Fay"][0].defineBehavior([walkBehavior]);
	//entTable["Fay"][0].defineBehavior([runBehavior]);

	console.log("Fay was placed at map location..." + 
		    entTable["Fay"][0].mapY + ", " + entTable["Fay"][0].mapX);
	

	//Init asciidisplay stuff
	initCanvas();
	asciidisplay  = init2dArray(NUM_ROW, NUM_COLUMN, "" );
	displayBuffer = init2dArray(NUM_ROW, NUM_COLUMN, "%");

	//Get set up in the inital room
	instance.switchRoom(entTable);

	//Update the grid buffer and whatever
	//drawGridBuffer();
	//drawDisplay();

	//Add listeners for the keyboard
	document.addEventListener('keydown', function(event){
	    if(event.keyCode == 87){
		jstick.up    = true;
	    }else if(event.keyCode == 83){
		jstick.down  = true;
	    }else if(event.keyCode == 65){
		jstick.left  = true;
	    }else if(event.keyCode == 68){
		jstick.right = true;
	    }
	});
	document.addEventListener('keyup', function(event){
	    if(event.keyCode == 87){
		jstick.up    = false;
	    }else if(event.keyCode == 83){
		jstick.down  = false;
	    }else if(event.keyCode == 65){
		jstick.left  = false;
	    }else if(event.keyCode == 68){
		jstick.right = false;
	    }
	});
	return entTable;
	// //Start the game loop
	// instance.loop(new Date().getTime(), entTable);
    }

    //TO DO
    //Make sure this method works for entities that are not Fay
    instance.switchRoom = function(entTable){
	var tempArr;

	console.log("Called switchRoom()");
	if((entTable["Fay"][0].mapY == -1 && entTable["Fay"][0].mapX == -1) ||
	   (entTable["Fay"][1].mapY == -1 && entTable["Fay"][1].mapX == -1)){
	    instance.switchRandomRoom(entTable);
	} else {
	    instance.switchAdjRoom(entTable);
	}

	//Draw the background
	displayBuffer = init2dArray(NUM_ROW, NUM_COLUMN, "%");
	drawBkg(entTable);
	entTable["Fay"][1].isMoving = true;

	// console.log(Math.abs(entTable["Fay"][1].getGridY() - entTable["Fay"][0].getGridY()));
	// console.log(Math.abs(entTable["Fay"][1].getGridX() - entTable["Fay"][0].getGridX()));
	
	// console.log("truth status of the update ent loop: " + (entTable["Fay"][1].isMoving == true &&
	// 	   (Math.abs(entTable["Fay"][1].getGridY() - entTable["Fay"][0].getGridY()) > 0 ||
	// 	    Math.abs(entTable["Fay"][1].getGridX() - entTable["Fay"][0].getGridX()) > 0)));
	
	// entTable["Fay"][0].mapY = entTable["Fay"][1].mapY;
	// entTable["Fay"][0].mapX = entTable["Fay"][1].mapX;
    }

    instance.switchAdjRoom = function(entTable){
	console.log("Switching to an adjacent room");

	if(entTable["Fay"][0].gridX > NUM_COLUMN){
	    //Exit east
	    entTable["Fay"][1].gridX = 0;
	    entTable["Fay"][1].mapX++;
	}else if (entTable["Fay"][0].gridX < 0){
	    //Exit west
	    entTable["Fay"][1].gridX = NUM_COLUMN;
	    entTable["Fay"][1].mapX--;
	}else if (entTable["Fay"][0].gridY > NUM_ROW){
	    //Exit south
	    entTable["Fay"][1].gridY = 0;
	    entTable["Fay"][1].mapY++;
	}else if (entTable["Fay"][0].gridY < 0){
	    //Exit north
	    entTable["Fay"][1].gridY = NUM_ROW;
	    entTable["Fay"][1].mapY--;
	}

	console.log("Moving from " + entTable["Fay"][0].mapY + ", " + entTable["Fay"][0].mapX +
		    "... to " + entTable["Fay"][1].mapY + ", " + entTable["Fay"][1].mapX);
    }

    instance.switchRandomRoom = function(entTable){
	//Pick a random spot on the game map
	tempArr = mapRandArray[Math.floor(Math.random(mapRandArray.length))];
	//mapPosTable["Fay"] = tempArr;

	entTable["Fay"][0].mapY = tempArr[0];
	entTable["Fay"][0].mapX = tempArr[1];
	entTable["Fay"][1].mapY = tempArr[0];
	entTable["Fay"][1].mapX = tempArr[1];
	
	//Pick the center spot on the game grid
	tempArr = [Math.floor(NUM_ROW / 2.0), Math.floor(NUM_COLUMN / 2.0)];
	//gridPosTable["Fay"] = tempArr;

	// entTable["Fay"][0].gridY = tempArr[0];
	// entTable["Fay"][0].gridX = tempArr[1];
	entTable["Fay"][1].gridY = tempArr[0];
	entTable["Fay"][1].gridX = tempArr[1];

	console.log("Fay moved to " + entTable["Fay"][0].mapY + ", " + entTable["Fay"][0].mapX);
    }

    instance.executeBehavior = function(entTable){
	//TODO refactor this to account for arrays...
	for (var key in entTable){
	    //I think element [1] is supposed to be the
	    //present element...
	    if(entTable[key][0].behavior){
		entTable[key][0].behavior[0].execute(entTable[key][1]);
	    }
	}
    }

    instance.drawChar = function(charY, charX, character, fColor = "#ffffff", bColor = "#000000"){
	var origContext;
	
	//origContext = context;
	
	context.textAlign = "center";
	context.font = FONT + "px sans-serif";

	context.fillStyle = bColor;
	
	//Draw the BKG
	context.fillRect((charX * GRID_X_SPACING) + GRID_X_BUFFER,
			 (charY * GRID_Y_SPACING) + GRID_X_BUFFER,
			 GRID_X_SPACING - 1,
			 GRID_Y_SPACING - 1);

	context.fillStyle = fColor;

	//Draw the CHAR
	context.fillText(character, 
			 (FONT_X_SPACING * charX) + FONT_X_BUFFER, 
			 (FONT_Y_SPACING * charY) + FONT_Y_BUFFER);

	//context = origContext;
    }

    instance.grid_delta_update_draw_hyper_drive_activate = function(){
	for(var y = 0; y < NUM_ROW; y++){
	    for(var x = 0; x < NUM_COLUMN; x++){
		if(asciidisplay[y][x] != displayBuffer[y][x]){
		    asciidisplay[y][x] = displayBuffer[y][x];
		    sc.gc.drawChar(y, x, asciidisplay[y][x]);
		}
	    }
	}
    }

    instance.drawGridBuffer = function(){
	for(var y = 0; y < NUM_ROW; y++){
	    for(var x = 0; x < NUM_COLUMN; x++){
		asciidisplay[y][x] = displayBuffer[y][x];
	    }
	}
    }

    instance.drawDisplay = function(){
	for(var y = 0; y < NUM_ROW; y++){
	    for(var x = 0; x < NUM_COLUMN; x++){
		sc.gc.drawChar(y, x, asciidisplay[y][x]);
	    }
	}
    }

    instance.coral_split = function(y, x){
	var filled;

	filled = 0;
	
	//Randomly decide if we will split
	if(Math.random() < SPLIT_PROB){
	    for(var i = 0; i < Math.floor(Math.random() * 4) + 1; i++){
		filled = instance.coral(y, x) + filled;
	    }
	}
	//Return the number of filled squares
	return filled;
    }

    instance.coral = function(y,x){
	var r;
	var filled;

	//Pick a seed square
	if(x == -1 && y == -1){
	    console.log("creating seed");
	    x = Math.floor(Math.random() * NUM_MAP_COLUMN);
	    y = Math.floor(Math.random() * NUM_MAP_ROW);
	    console.log(y + ", " + x);
	    //Fill the seed square
	    mapBuffer[y][x] = "#";
	}

	checked = 0;
	filled  = 0;
	
	while(checked < 4){
	    //UP    - 0
	    //DOWN  - 1
	    //LEFT  - 2
	    //RIGHT - 3
	    r = Math.floor(Math.random() * 4);
	    switch(r){
	    case 0:
		if(fillMapSquare(y-1, x)){
		    checked += 4;
		    filled++;
		    filled = instance.coral(y-1, x) + filled;
		    
		    //Split the coral
		    filled = instance.coral_split(y, x) + filled;

		    return filled;
		    break;
		}else{
		    r = (r + 1) % 4;
		    checked++;
		}
	    case 1:
		if(fillMapSquare(y+1, x)){
		    checked += 4;
		    filled++;
		    filled = instance.coral(y+1, x) + filled;
		    
		    //Split the coral
		    filled = instance.coral_split(y, x) + filled;
		    
		    return filled;
		    break;
		}else{
		    r = (r + 1) % 4;
		    checked++;
		}
	    case 2:
		if(fillMapSquare(y, x-1)){
		    checked += 4;
		    filled++;
		    filled = instance.coral(y, x-1) + filled;

		    //Split the coral
		    filled = instance.coral_split(y, x) + filled;
		    
		    return filled;
		    break;
		}else{
		    r = (r + 1) % 4;
		    checked++;
		}
	    case 3:
		if(fillMapSquare(y, x+1)){
		    checked += 4;
		    filled++;
		    filled = instance.coral(y, x+1) + filled;
		    
		    //Split the coral
		    filled = instance.coral_split(y, x) + filled;
		    
		    return filled;
		    break;
		}else{
		    r = (r + 1) % 4;
		    checked++;
		}
	    }
	}
	return filled;
    }

    
    return instance;
}

//Behaviors
//////////////////////////////////////////////////

var walkBehavior = {
    execute: function(ent){
	if(jstick.up == true){
	    if(Math.floor(ent.gridY - 0.2) < Math.floor(ent.gridY)){
		//Check case for diagnol movement
		if(jstick.left == true){
		    ent.gridX -= 1;
		}
		if(jstick.right == true){
		    ent.gridX += 1;
		}
		//Set flag for changing the cell position
		ent.isMoving = true;
	    }
	    ent.gridY -= 0.2;
	    return;
	}
	if(jstick.down == true){
	    if(Math.floor(ent.gridY + 0.2) > Math.floor(ent.gridY)){
		//Check case for diagnol movement
		if(jstick.left == true){
		    ent.gridX -= 1;
		}
		if(jstick.right == true){
		    ent.gridX += 1;
		}
		//Set flag for changing the cell position
		ent.isMoving = true;
	    }
	    ent.gridY += 0.2;
	    return;
	}
	if(jstick.left == true){
	    if(Math.floor(ent.gridX - 0.2) < Math.floor(ent.gridX)){
		ent.isMoving = true;
	    }
	    ent.gridX -= 0.2;
	    return;
	}
	if(jstick.right == true){
	    if(Math.floor(ent.gridX + 0.2) > Math.floor(ent.gridX)){
		ent.isMoving = true;
	    }
	    ent.gridX += 0.2;
	    return;
	}
	//ent.map
    }
};

var runBehavior = {
    execute: function(ent){
	console.log("Executed the control behavior");
	if(jstick.up == true){
	    ent.gridY -= 2;
	    ent.isMoving = true;
	}
	if(jstick.down == true){
	    ent.gridY += 2;
	    ent.isMoving = true;
	}
	if(jstick.left == true){
	    ent.gridX -= 2;
	    ent.isMoving = true;
	}
	if(jstick.right == true){
	    ent.gridX += 2;
	    ent.isMoving = true;
	}
	//ent.map
    }
};

//class Fay extends Entity{
//	constructor(name){
//		super.constructor(name);
//	}
//}

//Grid functions
//////////////////////////////////////////////////

var addMultipleTile = function(start_y, start_x, end_y, end_x, tile){
    if(start_y == end_y && start_x <= end_x){
	for(var i = start_x; i < end_x; i++){
	    displayBuffer[start_y][i] = tile;
	}
    }else if(start_x == end_x && start_y <= end_y){
	for(var i = start_y; i < end_y; i++){
	    displayBuffer[i][start_x] = tile;
	}
    }else{
	throw new Error("add_multi_tile() invalid coordinates");
    }
}

var addSheetTile = function(start_y, start_x, end_y, end_x, tile){
    for(var i = start_x; i < end_x; i++){
	addMultipleTile(start_y, i, end_y, i, tile);
    }
}

//use a FIFO queue
//use queue.shift() to dequeue an item in FIFO order
//a[0] is the top of the queue
var drawBkg = function(entTable){
    console.log("Drawing... " + entTable["Fay"][1].mapY + ", " + entTable["Fay"][1].mapX);
    
    addSheetTile(3, 4, NUM_ROW - 3, NUM_COLUMN - 4, " ");

    if(entTable["Fay"][1].mapY - 1 > 0 && mapBuffer[entTable["Fay"][1].mapY - 1][entTable["Fay"][1].mapX] == '#'){
	addSheetTile(0, 4, 3, NUM_COLUMN - 4, " ");
	//Draw a north exit
    }
    if(entTable["Fay"][1].mapY + 1 < NUM_MAP_ROW && mapBuffer[entTable["Fay"][1].mapY + 1][entTable["Fay"][1].mapX] == '#'){
	addSheetTile(NUM_ROW - 3, 4, NUM_ROW, NUM_COLUMN - 4, " ");
	//Draw a south exit
    }
    if(entTable["Fay"][1].mapY - 1 > 0 && mapBuffer[entTable["Fay"][1].mapY][entTable["Fay"][1].mapX - 1] == '#'){
	addSheetTile(3, 0, NUM_ROW -3, NUM_COLUMN - 4, " ");
	//Draw a west exit
    }
    if(entTable["Fay"][1].mapY + 1 < NUM_MAP_COLUMN && mapBuffer[entTable["Fay"][1].mapY][entTable["Fay"][1].mapX + 1] == '#'){
	addSheetTile(3, NUM_COLUMN - 4, NUM_ROW - 3, NUM_COLUMN, " ");
	//Draw a east exit
    }
}

var checkCollide = function(entTable, entName){
    for(var key in entTable){
	if(displayBuffer[entTable[entName][1].getGridY()][entTable[entName][1].getGridX()] != " "){
	    console.log("Collided with " + displayBuffer[entTable[entName][1].getGridY()][entTable[entName][1].getGridX()] + "!!");
	    return true;
	}
	
	if(entTable[key][1].getGridY() == entTable[entName][1].getGridY() && entTable[key][1].getGridX() == entTable[entName][1].getGridX() && key != entName){
	    console.log("Collided with " + key + "!!!");
	    return true;
	}
    }
    return false;
}

//Should position 0 be the POTENTIAL new coordinates or the current coordinates??
var updateEnt = function(entTable){
    var isInBound = [false, false];
    
    for(var key in entTable){

	if(entTable[key][1].isMoving == true &&
	   (Math.abs(entTable[key][1].getGridY() - entTable[key][0].getGridY()) > 0 ||
	    Math.abs(entTable[key][1].getGridX() - entTable[key][0].getGridX()) > 0)
	  ){
	    //Set boolean so this function doesn't run again until the next position change
	    entTable[key][1].isMoving = false;
	    entTable[key][0].isMoving = false;

	    //Check which positions are in legal boundaries
	    isInBound[0] = entTable[key][0].getGridY() >= 0 && entTable[key][0].getGridY() < NUM_ROW &&
		entTable[key][0].getGridX() >= 0 && entTable[key][0].getGridX() < NUM_COLUMN;
	    isInBound[1] = entTable[key][1].getGridY() >= 0 && entTable[key][1].getGridY() < NUM_ROW &&
		entTable[key][1].getGridX() >= 0 && entTable[key][1].getGridX() < NUM_COLUMN;

	    //Detect collision
	    if(isInBound[1] && checkCollide(entTable, key)){
		entTable[key][1].gridY = entTable[key][0].getGridY();
		entTable[key][1].gridX = entTable[key][0].getGridX();
		continue;
	    }
	    
	    //We might want to refactor so that the default bkg tile is controlled
	    //by a variable....
	    if(isInBound[0]){
	    	displayBuffer[entTable[key][0].getGridY()][entTable[key][0].getGridX()] = " ";
	    }

	    //Update the displayBuffer so the character will be drawn in their destination cell
	    if(isInBound[1]){
		displayBuffer[entTable[key][1].getGridY()][entTable[key][1].getGridX()] = entTable[key][1].sigil;
	    }

	    //Update the characters position if there is no collision
	    entTable[key][0].gridY = entTable[key][1].gridY;
	    entTable[key][0].gridX = entTable[key][1].gridX;
	    // entTable[key][0].gridY = entTable[key][1].getGridY();
	    // entTable[key][0].gridX = entTable[key][1].getGridX();

	    //Room switch
	    if(!(isInBound[1])){
		sc.gc.switchRoom(entTable);
	    }
	}
    }
}

//map stuff
//////////////////////////////////////////////////
var initMap = function(){
    mapBuffer    = [];	
    mapRandArray = [];
    for(var y = 0; y < NUM_MAP_ROW; y++){
	mapBuffer[y] = new Array(NUM_MAP_ROW);
	for(var x = 0; x < NUM_MAP_COLUMN; x++){
	    mapBuffer[y][x] = " ";
	}
    }
}

//Fills the square and returns true
//otherwise does nothing and returns false
var fillMapSquare = function(y, x){
    if(y >= NUM_MAP_ROW || y < 0 || x >= NUM_MAP_COLUMN || x < 0){
	return false;
    }
    if(mapBuffer[y][x] != " "){
	return false;
    }
    mapBuffer[y][x] = "#";
    mapRandArray.push([y, x]);
    return true;
}

// function coral_split(y, x){
//     var filled;

//     filled = 0;
    
//     //Randomly decide if we will split
//     if(Math.random() < SPLIT_PROB){
// 	for(var i = 0; i < Math.floor(Math.random() * 4) + 1; i++){
// 	    filled = coral(y, x) + filled;
// 	}
//     }
//     //Return the number of filled squares
//     return filled;
// }

// function coral(y,x){
//     var r;
//     var filled;

//     //Pick a seed square
//     if(x == -1 && y == -1){
// 	console.log("creating seed");
// 	x = Math.floor(Math.random() * NUM_MAP_COLUMN);
// 	y = Math.floor(Math.random() * NUM_MAP_ROW);
// 	console.log(y + ", " + x);
// 	//Fill the seed square
// 	mapBuffer[y][x] = "#";
//     }

//     checked = 0;
//     filled  = 0;
    
//     while(checked < 4){
// 	//UP    - 0
// 	//DOWN  - 1
// 	//LEFT  - 2
// 	//RIGHT - 3
// 	r = Math.floor(Math.random() * 4);
// 	switch(r){
// 	case 0:
// 	    if(fillMapSquare(y-1, x)){
// 		checked += 4;
// 		filled++;
// 		filled = coral(y-1, x) + filled;
		
// 		//Split the coral
// 		filled = coral_split(y, x) + filled;

// 		return filled;
// 		break;
// 	    }else{
// 		r = (r + 1) % 4;
// 		checked++;
// 	    }
// 	case 1:
// 	    if(fillMapSquare(y+1, x)){
// 		checked += 4;
// 		filled++;
// 		filled = coral(y+1, x) + filled;
		
// 		//Split the coral
// 		filled = coral_split(y, x) + filled;
		
// 		return filled;
// 		break;
// 	    }else{
// 		r = (r + 1) % 4;
// 		checked++;
// 	    }
// 	case 2:
// 	    if(fillMapSquare(y, x-1)){
// 		checked += 4;
// 		filled++;
// 		filled = coral(y, x-1) + filled;

// 		//Split the coral
// 		filled = coral_split(y, x) + filled;
		
// 		return filled;
// 		break;
// 	    }else{
// 		r = (r + 1) % 4;
// 		checked++;
// 	    }
// 	case 3:
// 	    if(fillMapSquare(y, x+1)){
// 		checked += 4;
// 		filled++;
// 		filled = coral(y, x+1) + filled;
		
// 		//Split the coral
// 		filled = coral_split(y, x) + filled;
		
// 		return filled;
// 		break;
// 	    }else{
// 		r = (r + 1) % 4;
// 		checked++;
// 	    }
// 	}
//     }
    return filled;
}

//asciidisplay stuff
//////////////////////////////////////////////////
// var drawDisplay = function(){
//     for(var y = 0; y < NUM_ROW; y++){
// 	for(var x = 0; x < NUM_COLUMN; x++){
// 	    sc.gc.drawChar(y, x, asciidisplay[y][x]);
// 	}
//     }
// }

// var drawGridBuffer = function(){
//     for(var y = 0; y < NUM_ROW; y++){
// 	for(var x = 0; x < NUM_COLUMN; x++){
// 	    asciidisplay[y][x] = displayBuffer[y][x];
// 	}
//     }
// }

//Hopefully my child... the time will never come when
//you must use this shit
// var grid_delta_update_draw_hyper_drive_activate = function(){
//     for(var y = 0; y < NUM_ROW; y++){
// 	for(var x = 0; x < NUM_COLUMN; x++){
// 	    if(asciidisplay[y][x] != displayBuffer[y][x]){
// 		asciidisplay[y][x] = displayBuffer[y][x];
// 		sc.gc.drawChar(y, x, asciidisplay[y][x]);
// 	    }
// 	}
//     }
// }

// var drawChar = function(charY, charX, character, fColor = "#ffffff", bColor = "#000000"){
//     var origContext;
    
//     //origContext = context;
    
//     context.textAlign = "center";
//     context.font = FONT + "px sans-serif";

//     context.fillStyle = bColor;
    
//     //Draw the BKG
//     context.fillRect((charX * GRID_X_SPACING) + GRID_X_BUFFER,
// 		     (charY * GRID_Y_SPACING) + GRID_X_BUFFER,
// 		     GRID_X_SPACING - 1,
// 		     GRID_Y_SPACING - 1);

//     context.fillStyle = fColor;

//     //Draw the CHAR
//     context.fillText(character, 
// 		     (FONT_X_SPACING * charX) + FONT_X_BUFFER, 
// 		     (FONT_Y_SPACING * charY) + FONT_Y_BUFFER);

//     //context = origContext;
// }

//Controller
//////////////////////////////////////////////////
// var executeBehavior = function(entTable){
//     //TODO refactor this to account for arrays...
//     for (var key in entTable){
// 	//I think element [1] is supposed to be the
// 	//present element...
// 	if(entTable[key][0].behavior){
// 	    entTable[key][0].behavior[0].execute(entTable[key][1]);
// 	}
//     }
// }

// var switchRandomRoom = function(entTable){
//     //Pick a random spot on the game map
//     tempArr = mapRandArray[Math.floor(Math.random(mapRandArray.length))];
//     //mapPosTable["Fay"] = tempArr;

//     entTable["Fay"][0].mapY = tempArr[0];
//     entTable["Fay"][0].mapX = tempArr[1];
//     entTable["Fay"][1].mapY = tempArr[0];
//     entTable["Fay"][1].mapX = tempArr[1];
    
//     //Pick the center spot on the game grid
//     tempArr = [Math.floor(NUM_ROW / 2.0), Math.floor(NUM_COLUMN / 2.0)];
//     //gridPosTable["Fay"] = tempArr;

//     // entTable["Fay"][0].gridY = tempArr[0];
//     // entTable["Fay"][0].gridX = tempArr[1];
//     entTable["Fay"][1].gridY = tempArr[0];
//     entTable["Fay"][1].gridX = tempArr[1];

//     console.log("Fay moved to " + entTable["Fay"][0].mapY + ", " + entTable["Fay"][0].mapX);
// }

// var switchAdjRoom = function(entTable){
//     console.log("Switching to an adjacent room");

//     if(entTable["Fay"][0].gridX > NUM_COLUMN){
// 	//Exit east
// 	entTable["Fay"][1].gridX = 0;
// 	entTable["Fay"][1].mapX++;
//     }else if (entTable["Fay"][0].gridX < 0){
// 	//Exit west
// 	entTable["Fay"][1].gridX = NUM_COLUMN;
// 	entTable["Fay"][1].mapX--;
//     }else if (entTable["Fay"][0].gridY > NUM_ROW){
// 	//Exit south
// 	entTable["Fay"][1].gridY = 0;
// 	entTable["Fay"][1].mapY++;
//     }else if (entTable["Fay"][0].gridY < 0){
// 	//Exit north
// 	entTable["Fay"][1].gridY = NUM_ROW;
// 	entTable["Fay"][1].mapY--;
//     }

//     console.log("Moving from " + entTable["Fay"][0].mapY + ", " + entTable["Fay"][0].mapX +
// 		"... to " + entTable["Fay"][1].mapY + ", " + entTable["Fay"][1].mapX);
// }


// //TO DO
// //Make sure this method works for entities that are not Fay
// var switchRoom = function(entTable){
//     var tempArr;

//     console.log("Called switchRoom()");
//     if((entTable["Fay"][0].mapY == -1 && entTable["Fay"][0].mapX == -1) ||
//        (entTable["Fay"][1].mapY == -1 && entTable["Fay"][1].mapX == -1)){
// 	switchRandomRoom(entTable);
//     } else {
// 	switchAdjRoom(entTable);
//     }

//     //Draw the background
//     displayBuffer = init2dArray(NUM_ROW, NUM_COLUMN, "%");
//     drawBkg(entTable);
//     entTable["Fay"][1].isMoving = true;

//     // console.log(Math.abs(entTable["Fay"][1].getGridY() - entTable["Fay"][0].getGridY()));
//     // console.log(Math.abs(entTable["Fay"][1].getGridX() - entTable["Fay"][0].getGridX()));
    
//     // console.log("truth status of the update ent loop: " + (entTable["Fay"][1].isMoving == true &&
//     // 	   (Math.abs(entTable["Fay"][1].getGridY() - entTable["Fay"][0].getGridY()) > 0 ||
//     // 	    Math.abs(entTable["Fay"][1].getGridX() - entTable["Fay"][0].getGridX()) > 0)));
    
//     // entTable["Fay"][0].mapY = entTable["Fay"][1].mapY;
//     // entTable["Fay"][0].mapX = entTable["Fay"][1].mapX;
// }

//Game loop stuff
//////////////////////////////////////////////////

// //Dont forget that b is just a test variable
// //we can remove it later
// var update = function(time, entTable){
//     executeBehavior(entTable);

//     //drawBkg(entTable);
//     updateEnt(entTable);
//     grid_delta_update_draw_hyper_drive_activate();
//     //drawGridBuffer();
//     //drawDisplay();
    
//     //if(b){
//     //	drawChar(0, 0, "X", "#ff0000");
//     //}else{
//     //	drawChar(0, 0, "X");
//     //}
// }

//Init stuff
//////////////////////////////////////////////////

var initCanvas = function(){
    canvas.height = NUM_ROW * GRID_Y_SPACING * 1.0;
    canvas.width  = NUM_COLUMN * GRID_X_SPACING * 1.0 + 
	GRID_X_BUFFER;
}

var init2dArray = function(height, width, defaultVal){
    var arr;

    arr = [];
    
    for(var y = 0; y < height; y++){
	var newRow = [];
	for(var x = 0; x < width; x++){
	    newRow.push(defaultVal);
	}
	arr.push(newRow);
    }
    return arr;
}

// var loop = function(lastFrameTime, entTable){
//     var time;

//     //Update timer
//     // time = (new Date()).getTime();
//     //console.log(Math.floor(Math.pow((time - lastFrameTime), -1) * 1000));

//     //Update game state
//     update((time - lastFrameTime), entTable);
    
//     //TODO write this method and call it here....
//     //Update room if needed
    
//     //Get the next frame
//     requestAnimFrame(function(){
// 	loop(time, entTable);
//     });
// }


//This closure gets the valid requestAnim function
//and then runs it
window.requestAnimFrame = (function(callback){
    //Try out all the different animation
    //functions and see which on is compatible
    //with your browser
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function(callback){ window.setTimeout(callback, 1000/60); };
})();

//context.font = FONT + "px Courier";
//context.font = "40px Courier";
//drawChar(0, 0, "X", "#FF0000");

var sc = new SuperController();

sc.gcInit();

// var gc = new GridController();

// gc.init();

//console.log("testing if this works....");
