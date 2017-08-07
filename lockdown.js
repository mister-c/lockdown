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

// var NUM_MAP_ROW    = 40;
// var NUM_MAP_COLUMN = 80;
var NUM_MAP_ROW    = 15;
var NUM_MAP_COLUMN = 30;

var WALL_THICKNESS_Y = 3;
var WALL_THICKNESS_X = 4;

// This value prevents you from accidentally jumping ahead
// by one square every time you move from room to room
//
// Its an amount of distance thats arbitrarily added to
// the players position when you change rooms
var MAP_SWITCH_CUSHION = 0.55;

// For coral algorithm...

var SPLIT_PROB     = 0.1;

var canvas  = document.getElementById("my_canvas");
var context = canvas.getContext("2d");

var jstick;
var asciidisplay;
var displayBuffer;
var mapBuffer;
var mapRandArray;

var debugGlobal;

//And so it begins...
//An endless flood of unneeded classes
//You suck
class Joystick{
    constructor(){
	this.up    = false;
	this.down  = false;
	this.left  = false;
	this.right = false;

	this.mapKey = false;
    }
}

//We will define an entity class here
//This should allow us to make a SIMPLE
//struct with no methods that contains a series of 
//values to represent state and behaviors...
class Entity{
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
	this.sigil = "%";
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
    instance.mc = new MapController();

    instance.activeControllerLoop = instance.gc.loop;
    instance.controllerLoop = [instance.mc.loop, instance.gc.loop];
    instance.isCleanSlate = false;

    // Controller calls the loop for GridController
    // so we can stop events from occuring on the grid at
    // will....
    instance.loop = function(lastFrameTime, entTable){
	var time;

	// instance.gc.loop(lastFrameTime, entTable);
	
	instance.activeControllerLoop(lastFrameTime, entTable);

	instance.isCleanSlate = false;

	debugGlobal.frameCount++;

	time = lastFrameTime;

	if(debugGlobal.frameCount > 500){
	    time = new Date().getTime()
;
	    // console.log("FPS: " + Math.floor(500.0 / Math.pow((time - lastFrameTime), -1) * 1000));
	    debugGlobal.fps = Math.floor((500.0 / ((time - lastFrameTime) / 1000.0)));
	    if(debugGlobal.fps < 10){
		debugGlobal.fps = "0" + debugGlobal.fps;
	    }else if(debugGlobal.fps > 100){
		debugGlobal.fps = "99";
	    }
	    console.log("FPS: " + debugGlobal.fps);
	    debugGlobal.frameCount = 0;
	}
	
	if(jstick.mapKey == true){
	    instance.activeControllerLoop = instance.controllerLoop.shift();
	    instance.controllerLoop.push(instance.activeControllerLoop);

	    // This is a vile vile hack
	    jstick.mapKey = false;
	    instance.isCleanSlate = true;
	    // console.log("mapKey!");
	    // console.log(instance.controllerLoop);
	}
	
	requestAnimFrame(function(){
	    instance.loop(time, entTable);
	});

    }

    instance.gcInit = function(){
	var entTable;
	
	entTable = instance.gc.init();

	// This debug statement is to add stuff to the inital
	// game state for the purpose of testing
	if(debugGlobal.isDebugMode){
	    // For now do nothing
	}
	
	instance.loop(new Date().getTime(), entTable);
	// instance.loop
    }
    return instance;
}

function MapController(){
    var instance;

    MapController = function(){
	return instance;
    }

    MapController.prototype = this;

    instance = new MapController;

    instance.constructor = MapController;

    instance.fayPos = {};
    instance.fayPos.x = -1;
    instance.fayPos.y = -1;

    instance.scale = 0.7;
    instance.cleanSlate = function(bColor = "#000000"){
	context.fillStyle = bColor;
	context.fillRect(0, 0, canvas.width, canvas.height);
    }

    instance.drawChar = function(charY, charX, character, fColor = "#ffffff", bColor = "#000000"){
	var origContext;
	
	origContext = context;
	
	context.textAlign = "center";
	context.font      = (FONT * instance.scale) + "px sans-serif";

	context.fillStyle = bColor;
	
	//Draw the BKG
	context.fillRect(((charX * GRID_X_SPACING * instance.scale) + GRID_X_BUFFER),
			 ((charY * GRID_Y_SPACING * instance.scale) + GRID_X_BUFFER),
			 (GRID_X_SPACING * instance.scale) - 1,
			 (GRID_Y_SPACING * instance.scale) - 1);

	context.fillStyle = fColor;

	//Draw the CHAR
	context.fillText(character, 
			 (FONT_X_SPACING * charX * instance.scale) + FONT_X_BUFFER * instance.scale,
			 (FONT_Y_SPACING * charY * instance.scale) + FONT_Y_BUFFER * instance.scale);
	context = origContext;
    }

    instance.drawFayPos = function(){
	instance.drawChar(instance.fayPos.y, instance.fayPos.x, "F", "#000000", "#ff0066");
    }
    
    instance.drawDisplay = function(){
    	for(var y = 0; y < NUM_MAP_ROW; y++){
    	    for(var x = 0; x < NUM_MAP_COLUMN; x++){
    		instance.drawChar(y, x, mapBuffer[y][x]);
    	    }
    	}
    }

    instance.loop = function(){
	if(sc.isCleanSlate == true){
	    instance.cleanSlate();

	    canvas.height = NUM_MAP_ROW * GRID_Y_SPACING * instance.scale;
	    canvas.width  = NUM_MAP_COLUMN * GRID_X_SPACING * instance.scale + 
		GRID_X_BUFFER;

	    // canvas.width  = 800;
	    // canvas.height = 600;

	    instance.drawDisplay();
	    instance.drawFayPos();
	    // instance.drawChar(0, 0, "F");
	}
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

	if(sc.isCleanSlate == true){
	    canvas.height = NUM_ROW * GRID_Y_SPACING * 1.0;
	    canvas.width  = NUM_COLUMN * GRID_X_SPACING * 1.0 + 
		GRID_X_BUFFER;
	    instance.drawDisplay();
	}
	
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
	instance.updateEnt(entTable);
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
	    instance.initMap();
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
	    entTable["Fay"][i].sigil = "F";
	    entTable["Fay"][i].defineBehavior([instance.walkBehavior]);
	}
	//entTable["Fay"][0] = new Entity("Fay");
	//entTable["Fay"][0].defineBehavior([instance.walkBehavior]);
	//entTable["Fay"][0].defineBehavior([instance.runBehavior]);

	console.log("Fay was placed at map location..." + 
		    entTable["Fay"][0].mapY + ", " + entTable["Fay"][0].mapX);

	//Init asciidisplay stuff
	initCanvas();
	asciidisplay  = init2dArray(NUM_ROW, NUM_COLUMN, "" );
	displayBuffer = init2dArray(NUM_ROW, NUM_COLUMN, "%");

	//Get set up in the inital room
	instance.switchRoom(entTable, "Fay");

	// This debug statement is to add stuff to the inital
	// game state for the purpose of testing
	if(debugGlobal.isDebugMode){
	    // entTable["TestBox0"] = [];
	    // for(var i=0; i<2; i++){
	    // 	entTable["TestBox0"][i] = {};
	    // 	entTable["TestBox0"][i] = new Entity("TestBox0");
	    // 	entTable["TestBox0"][i].mapY = entTable["Fay"][1].mapY;
	    // 	entTable["TestBox0"][i].mapX = entTable["Fay"][1].mapX;
	    // 	entTable["TestBox0"][i].gridY = 10;
	    // 	entTable["TestBox0"][i].gridX = 20;
	    // }

	    // instance.addMultipleEnt(entTable["Fay"][1].mapY,
	    // 			    entTable["Fay"][1].mapX,
	    // 			    10, 20, 10, 23, entTable);

	    instance.addSheetEnt(entTable["Fay"][1].mapY,
				 entTable["Fay"][1].mapX,
				 10, 20, 12, 22, entTable);
	    
	    instance.entTable = entTable;
	    // instance.switchRoom(entTable, "TestBox0");
	}

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
	    }else if(event.keyCode == 77){
		jstick.mapKey = true;
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
	    }else if(event.keyCode == 77){
		jstick.mapKey = false;
	    }
	});
	return entTable;
	// //Start the game loop
	// instance.loop(new Date().getTime(), entTable);
    }

    //TO DO
    //Make sure this method works for entities that are not Fay
    instance.switchRoom = function(entTable, key){
	var tempArr;

	console.log("Called switchRoom()");
	if((entTable[key][0].mapY == -1 && entTable[key][0].mapX == -1) ||
	   (entTable[key][1].mapY == -1 && entTable[key][1].mapX == -1)){
	    instance.switchRandomRoom(entTable, key);
	}else{
	    instance.switchAdjRoom(entTable);
	}

	//Draw the background
	displayBuffer = init2dArray(NUM_ROW, NUM_COLUMN, "%");
	instance.drawBkg(entTable);
	entTable[key][1].isMoving = true;

	// Check for entities in the same room as you and
	// update them
	for(var e in entTable){
	    if(entTable[e][1].mapX == entTable[key][1].mapX &&
	       entTable[e][1].mapY == entTable[key][1].mapY){
		entTable[e][1].isMoving = true;
	    }
	}

	// Remove this later, since its a kludge
	sc.mc.fayPos.y = entTable[key][1].mapY;
	sc.mc.fayPos.x = entTable[key][1].mapX;

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
	}else if(entTable["Fay"][0].gridX < 0){
	    //Exit west
	    entTable["Fay"][1].gridX = NUM_COLUMN - MAP_SWITCH_CUSHION;
	    entTable["Fay"][1].mapX--;
	}else if(entTable["Fay"][0].gridY > NUM_ROW){
	    //Exit south
	    entTable["Fay"][1].gridY = 0;
	    entTable["Fay"][1].mapY++;
	}else if(entTable["Fay"][0].gridY < 0){
	    //Exit north
	    entTable["Fay"][1].gridY = NUM_ROW - MAP_SWITCH_CUSHION;
	    entTable["Fay"][1].mapY--;
	}

	console.log("Moving from " + entTable["Fay"][0].mapY + ", " + entTable["Fay"][0].mapX +
		    "... to " + entTable["Fay"][1].mapY + ", " + entTable["Fay"][1].mapX);
    }

    instance.switchRandomRoom = function(entTable, key, dest = [Math.floor(NUM_ROW / 2.0), Math.floor(NUM_COLUMN / 2.0)]){
	//Pick a random spot on the game map
	tempArr0 = mapRandArray[Math.floor(Math.random(mapRandArray.length))];
	//mapPosTable["Fay"] = tempArr;

	entTable[key][0].mapY = tempArr0[0];
	entTable[key][0].mapX = tempArr0[1];
	entTable[key][1].mapY = tempArr0[0];
	entTable[key][1].mapX = tempArr0[1];
	
	//Pick the center spot on the game grid
	// tempArr = [Math.floor(NUM_ROW / 2.0), Math.floor(NUM_COLUMN / 2.0)];
	tempArr1 = dest;
	//gridPosTable[key] = tempArr;

	entTable[key][0].gridY = tempArr1[0];
	entTable[key][0].gridX = tempArr1[1];
	entTable[key][1].gridY = tempArr1[0];
	entTable[key][1].gridX = tempArr1[1];

	displayBuffer[entTable[key][0].getGridY()][entTable[key][0].getGridX()] = entTable[key][0].sigil;

	console.log(key + " moved to " + entTable[key][0].mapY + ", " + entTable[key][0].mapX);

	console.log(key + " at " + entTable[key][0].getGridY() + ", " + entTable[key][0].getGridX());

	instance.grid_delta_update_draw_hyper_drive_activate();
	
    }

    instance.executeBehavior = function(entTable){
	//TODO refactor this to account for arrays...
	for(var key in entTable){
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
	if(debugGlobal.isDebugMode){
	    sc.gc.drawChar(0, 0, debugGlobal.fps.toString()[0]);
	    sc.gc.drawChar(0, 1, debugGlobal.fps.toString()[1]);
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
		if(instance.fillMapSquare(y-1, x)){
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
		if(instance.fillMapSquare(y+1, x)){
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
		if(instance.fillMapSquare(y, x-1)){
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
		if(instance.fillMapSquare(y, x+1)){
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

    //Fills the square and returns true
    //otherwise does nothing and returns false
    instance.fillMapSquare = function(y, x){
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

    //map stuff
    //////////////////////////////////////////////////
    instance.initMap = function(){
	mapBuffer    = [];	
	mapRandArray = [];
	for(var y = 0; y < NUM_MAP_ROW; y++){
	    mapBuffer[y] = new Array(NUM_MAP_ROW);
	    for(var x = 0; x < NUM_MAP_COLUMN; x++){
		mapBuffer[y][x] = " ";
	    }
	}
    }

    //Should position 0 be the POTENTIAL new coordinates or the current coordinates??
    instance.updateEnt = function(entTable){
	var isInBound;
	
	// isInBound = [false, false];
	
	for(var key in entTable){

	    isInBound = [false, false];
	    
	    // Only perform update operations if Fays future cell and her present cell
	    // are not the same.
	    // We can check if those cells are the same with subtraction
	    // if(entTable[key][1].isMoving == true &&
	    //    (Math.abs(entTable[key][1].getGridY() - entTable[key][0].getGridY()) > 0 ||
	    // 	Math.abs(entTable[key][1].getGridX() - entTable[key][0].getGridX()) > 0)
	    //   ){
	    if(entTable[key][1].isMoving == true &&
	       (entTable[key][1].getGridY() != entTable[key][0].getGridY() > 0 ||
		entTable[key][1].getGridX() != entTable[key][0].getGridX() > 0)
	      ){
		//Set boolean so this function doesn't run again until the next position change
		entTable[key][1].isMoving = false;
		entTable[key][0].isMoving = false;

		//Check which positions are in legal boundaries
		//applies for both present Fay and future Fay
		isInBound[0] = entTable[key][0].getGridY() >= 0 && entTable[key][0].getGridY() < NUM_ROW &&
		    entTable[key][0].getGridX() >= 0 && entTable[key][0].getGridX() < NUM_COLUMN;
		isInBound[1] = entTable[key][1].getGridY() >= 0 && entTable[key][1].getGridY() < NUM_ROW &&
		    entTable[key][1].getGridX() >= 0 && entTable[key][1].getGridX() < NUM_COLUMN;

		//Detect collision
		if(isInBound[1] && instance.checkCollide(entTable, key, 1)){
		    entTable[key][1].gridY = entTable[key][0].getGridY();
		    entTable[key][1].gridX = entTable[key][0].getGridX();

		    //Detect reverting across a room change
		    // if(entTable[key][0].getGridX() < 0 || entTable[key][0].getGridX() >= NUM_COLUMN ||
		    //    entTable[key][0].getGridY() < 0 || entTable[key][0].getGridY() >= NUM_ROW){
		    if(!isInBound[0]){
			if(entTable[key][0].getGridY() >= NUM_ROW){
			    entTable[key][0].gridY = 0;
			    entTable[key][0].gridX = Math.floor(NUM_COLUMN / 2.0);
			} else if(entTable[key][0].getGridY() < 0){
			    entTable[key][0].gridY = NUM_ROW - 1;
			    entTable[key][0].gridX = Math.floor(NUM_COLUMN / 2.0);
			} else if(entTable[key][0].getGridX() >= NUM_COLUMN){
			    entTable[key][0].gridX = 0;
			    entTable[key][0].gridY = Math.floor(NUM_ROW / 2.0);
			} else if(entTable[key][0].getGridX() < 0){
			    entTable[key][0].gridX = NUM_COLUMN - 1;
			    entTable[key][0].gridY = Math.floor(NUM_ROW / 2.0);
			}
			// entTable[key][0].gridX = Math.abs(entTable[key][0].gridX);
			// entTable[key][0].gridY = Math.abs(entTable[key][0].gridY);
			displayBuffer[entTable[key][0].getGridY()][entTable[key][0].getGridX()] = entTable[key][0].sigil;

			entTable[key][1].gridY = entTable[key][0].getGridY();
			entTable[key][1].gridX = entTable[key][0].getGridX();
			
			console.log("oh shit!");
			
			console.log("oh shit - Fay Position 0: " + entTable[key][0].getGridY() + ", " + entTable[key][0].getGridX());
			console.log("oh shit - Fay Position 1: " + entTable[key][1].getGridY() + ", " + entTable[key][1].getGridX());

		    }
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
		    sc.gc.switchRoom(entTable, key);
		}
	    }
	}
    }

    // fayState refers to if this is "present" Fay or "future" Fay
    // "future" Fay refers to the frame that is about to be rendered
    // We keep track of Fay's position in the future frame while performing
    // checks.
    // We keep track of Fay's position in the present frame, so if Fay needs
    // to move relative to her previous position, we have a reference
    // ie if we deterine that Fay is being pushed we might want to move her
    // backward by 1 tile RELATIVE to her present position
    instance.checkCollide = function(entTable, entName, fayState){
	for(var key in entTable){
	    if(displayBuffer[entTable[entName][fayState].getGridY()][entTable[entName][fayState].getGridX()] != " "){
		
		// Display debug message to indicate there was a collision detected
		// The debug message displays the sigil that represents the tile you collided with
		
		// We get the sigil from the display buffer. There are 2 values put into the display buffer
		// array to get the sigil
		// 1 - entTable[entName][fayState].getGridY()]
		// 2 - entTable[entName][fayState].getGridX()]
		console.log("Collided with " + displayBuffer[
		    entTable[entName][fayState].getGridY()][
			entTable[entName][fayState].getGridX()] + "!!");
		return true;
	    }
	    
	    if( entTable[key][fayState].mapY == entTable[entName][fayState].mapY &&
		entTable[key][fayState].mapX == entTable[entName][fayState].mapX &&
		entTable[key][fayState].getGridY() == entTable[entName][fayState].getGridY() &&
		entTable[key][fayState].getGridX() == entTable[entName][fayState].getGridX() &&
		key != entName){

		// Display debug message to indicate there was a collision detected
		// The debug message displays the sigil that represents the entity you collided with
		
		console.log("Collided with " + key + "!!!");
		return true;
	    }
	}
	return false;
    }

    instance.checkStuck = function(entTable, entName, fayState){
	var stuck;

	stuck = true;

	// if(displayBuffer[entTable[entName]][fayState])
    }

    // Returns true if the exit should be drawn
    instance.checkWall = function(y, x, dir){
	if(      dir == "N" && (y - 1) >= 0             && mapBuffer[y - 1][x] == '#'){
	    return true;
	}else if(dir == "S" && (y + 1) < NUM_MAP_ROW    && mapBuffer[y + 1][x] == '#'){
	    return true;
	}else if(dir == "W" && (x - 1) >= 0             && mapBuffer[y][x - 1] == '#'){
	    return true;
	}else if(dir == "E" && (x + 1) < NUM_MAP_COLUMN && mapBuffer[y][x + 1] == '#'){
	    return true;
	}
	return false;
    }

    // Return true if a corner should be erased
    instance.checkCorner = function(y, x, dir){
	if(dir == "NE"){
	    if((y - 1) >= 0 && mapBuffer[y-1][x] == "#" &&
	       (x + 1) < NUM_MAP_COLUMN && mapBuffer[y][x+1] == "#" &&
	       mapBuffer[y-1][x+1] == "#"){
		return false;
	    } 
	} else if(dir == "SE"){
	    if((y + 1) < NUM_MAP_ROW && mapBuffer[y+1][x] == "#" &&
	       (x + 1) < NUM_MAP_COLUMN && mapBuffer[y][x+1] == "#" &&
	       mapBuffer[y+1][x+1] == "#"){
		return false;
	    } 
	} else if(dir == "NW"){
	    if((y - 1) >= 0 && mapBuffer[y-1][x] == "#" &&
	       (x - 1) >= 0 && mapBuffer[y][x-1] == "#" &&
	       mapBuffer[y-1][x-1] == "#"){
		return false;
	    } 
	} else if(dir == "SW"){
	    if((y + 1) < NUM_MAP_ROW && mapBuffer[y+1][x] == "#" &&
	       (x - 1) >= 0 && mapBuffer[y][x-1] == "#" &&
	       mapBuffer[y+1][x-1] == "#"){
		return false;
	    } 
	}
	return true;
    }

    //use a FIFO queue
    //use queue.shift() to dequeue an item in FIFO order
    //a[0] is the top of the queue
    instance.drawBkg = function(entTable){
	console.log("Drawing... " + entTable["Fay"][1].mapY + ", " + entTable["Fay"][1].mapX);
	
	instance.addSheetTile(WALL_THICKNESS_Y, WALL_THICKNESS_X, NUM_ROW - WALL_THICKNESS_Y, NUM_COLUMN - WALL_THICKNESS_X, " ");
	// instance.addSheetTile(3, 4, NUM_ROW - 3, NUM_COLUMN - 4, " ");


	if(instance.checkWall(entTable["Fay"][1].mapY, entTable["Fay"][1].mapX, "N")){
	    instance.addSheetTile(0, WALL_THICKNESS_X, WALL_THICKNESS_Y, NUM_COLUMN - WALL_THICKNESS_X, " ");
	    //Draw a north exit
	}
	if(instance.checkWall(entTable["Fay"][1].mapY, entTable["Fay"][1].mapX, "S")){
	    instance.addSheetTile(NUM_ROW - WALL_THICKNESS_Y, WALL_THICKNESS_X, NUM_ROW, NUM_COLUMN - WALL_THICKNESS_X, " ");
	    //Draw a south exit
	}
	if(instance.checkWall(entTable["Fay"][1].mapY, entTable["Fay"][1].mapX, "W")){
	    instance.addSheetTile(WALL_THICKNESS_Y, 0, NUM_ROW - WALL_THICKNESS_Y, NUM_COLUMN - WALL_THICKNESS_X, " ");
	    //Draw a west exit
	}
	if(instance.checkWall(entTable["Fay"][1].mapY, entTable["Fay"][1].mapX, "E")){
	    instance.addSheetTile(WALL_THICKNESS_Y, NUM_COLUMN - WALL_THICKNESS_X, NUM_ROW - WALL_THICKNESS_Y, NUM_COLUMN, " ");
	    //Draw a east exit
	}

	// Erase corners if needed
	if(!instance.checkCorner(entTable["Fay"][1].mapY, entTable["Fay"][1].mapX, "NE")){
	    // console.log("Erasing NE corner...");
	    instance.addSheetTile(0, NUM_COLUMN - WALL_THICKNESS_X, WALL_THICKNESS_Y, NUM_COLUMN, " ");
	}
	if(!instance.checkCorner(entTable["Fay"][1].mapY, entTable["Fay"][1].mapX, "SE")){
	    // console.log("Erasing SE corner...");
	    instance.addSheetTile(NUM_ROW - WALL_THICKNESS_Y, NUM_COLUMN - WALL_THICKNESS_X, NUM_ROW, NUM_COLUMN, " ");
	}
	if(!instance.checkCorner(entTable["Fay"][1].mapY, entTable["Fay"][1].mapX, "SW")){
	    // console.log("Erasing SW corner...");
	    instance.addSheetTile(NUM_ROW - WALL_THICKNESS_Y, 0, NUM_ROW, WALL_THICKNESS_X, " ");
	}
	if(!instance.checkCorner(entTable["Fay"][1].mapY, entTable["Fay"][1].mapX, "NW")){
	    // console.log("Erasing NW corner...");
	    instance.addSheetTile(0, 0, WALL_THICKNESS_Y, WALL_THICKNESS_X, " ");
	}
    }

    instance.addSheetTile = function(start_y, start_x, end_y, end_x, tile){
	for(var i = start_x; i < end_x; i++){
	    instance.addMultipleTile(start_y, i, end_y, i, tile);
	}
    }
    
    instance.addMultipleTile = function(start_y, start_x, end_y, end_x, tile){
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


    // TODO: Update these 2 functions so that we can create sheets
    // of many different kinds of entities not just Boxes
    instance.addSheetEnt = function(map_y, map_x,
				    start_y, start_x,
				    end_y, end_x, entTable){
	for(var i = start_x; i < end_x; i++){
	    instance.addMultipleEnt(map_y, map_x,
				    start_y, i,
				    end_y, i, entTable);
	}
    }
    
    instance.addMultipleEnt = function(map_y, map_x,
				       start_y, start_x,
				       end_y, end_x, entTable){
	var key;
	
	if(start_y == end_y && start_x <= end_x){
	    for(var i = start_x; i < end_x; i++){
		key = "Box_m" + map_y + "." + map_x + "_g";
		key += start_y + "." + i;
		entTable[key] = [];
		for(var j=0; j<2; j++){
		    entTable[key][j] = {};
		    entTable[key][j] = new Entity(key);
		    // entTable[key][i].sigil = "F";
		    entTable[key][j].mapY = map_y;
		    entTable[key][j].mapX = map_x;
		    entTable[key][j].gridY = start_y;
		    entTable[key][j].gridX = i;
		}
		instance.switchRoom(entTable, key);
	    }
	}else if(start_x == end_x && start_y <= end_y){
	    for(var i = start_y; i < end_y; i++){
		key = "Box_m" + map_y + "." + map_x + "_g";
		key += i + "." + start_x;
		entTable[key] = [];
		for(var j=0; j<2; j++){
		    entTable[key][j] = {};
		    entTable[key][j] = new Entity(key);
		    // entTable[key][i].sigil = "F";
		    entTable[key][j].mapY = map_y;
		    entTable[key][j].mapX = map_x;
		    entTable[key][j].gridY = i;
		    entTable[key][j].gridX = start_x;
		}
		instance.switchRoom(entTable, key);
	    }
	}else{
	    throw new Error("addMultipleEnt() invalid coordinates");
	}
    }
    
    instance.walkBehavior = {
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

    instance.runBehavior = {
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

    
    return instance;
}


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


//This closure gets the valid requestAnim function
//and then runs it
window.requestAnimFrame = (function(callback){
    //Try out all the different animation
    //functions and see which on is compatible
    //with your browser
    return window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.msRequestAnimationFrame ||
	function(callback){ window.setTimeout(callback, 1000/60);
			  };
})();




// Rev up that SuperController....

var sc = new SuperController();

debugGlobal = {};
debugGlobal.frameCount = 0;
debugGlobal.fps = "00";
debugGlobal.isDebugMode = true;
sc.gcInit();

