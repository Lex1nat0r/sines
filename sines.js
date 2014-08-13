// Sines of the Father: Adventures in Triggernometry
// by Alex Thornton-Clark

// based on sines_of_python.py

// Now set up your game (most games will load a separate .js file)
// note we override the location of the image paths because fuck the police
var Q = Quintus({imagePath: "Assets/", audioPath: "Assets/", audioSupported: ['wav', 'ogg']})   // create a new engine instance
	  .include("Sprites, Anim, Scenes, Input, 2D, Touch, UI, Audio") // Load any needed modules
	  .setup({width: 640, height: 480})  // add a canvas element onto the page, size 480 x 640
	  .controls()                        // Add in default controls (keyboard, buttons)
	  .touch()                           // Add in touch support (for the UI)
          .enableSound()
	  
// set up sweet custom inputs
// arrows and space are already done for us
Q.input.keyboardControls({
	16: "UpAmp",
	17: "DownAmp",
	18: "Anchor",
	82: "Reset"
});
	   
Q.Sprite.extend("Sky", {
    init: function(p) {
		this._super(p, {
		    asset: "the_sky.jpg",
		    x: 0,
		    // set the sky's collision type to Q.SPRITE_NONE so that nothing considers colliding with it
		    type: Q.SPRITE_NONE,
		    //collisionMask: Q.SPRITE_NONE
		});
	},
	
   step: function(dt) {
        this.p.x -= 5;
        if (this.p.x < -320) {
            this.p.x = Q.width + 315;
		}
	}
});

Q.Sprite.extend("Player",{

  // the init constructor is called on creation
  // it sets up a lot of stuff that will be used in the future
  init: function(p) {
  
    // You can call the parent's constructor with this._super(..)
    this._super(p, {
		asset: "THEGUY.png",  // give player an image asset
		x: 60,           			// set player position
		y: Q.height / 2, 
		h: 26, // sprite width for ease of collisions
		w: 83,  // sprite height for ease of collisions
	lastShot: 0,
    });
	
	var spawn = this.leftEchelon;
	
	// adjust amplitude
	// LCTRL decreases amplitude
	Q.input.on("DownAmp", this, function () {
		// ignore negative amp, and make sure we're done moving to a new amp
		if (new_amp > 10 && new_amp == amp) {
			new_amp = amp - 10;
		}
	});
	
	// LSHIFT increases amplitude
	Q.input.on("UpAmp", this, function () {
		// absolute max amp is 250, don't change amp if we're moving to a new amp
		// make sure we don't go too far outside the canvas
		if (new_amp < 250 && new_amp == amp && offset - new_amp > 0 && new_amp + offset <= Q.height) {
			new_amp = amp + 10;
		}
	});
	
	// change y = 0 for the sine wave
    Q.input.on("Anchor", this, function() {
		new_offset = this.p.y;
		if (new_offset < 0) {
			new_offset = 0;
		}
		else if (new_offset > Q.height) {
			new_offset = Q.height;
		}
		new_offset += 10 - (new_offset % 10)
		// adjust amplitude based on how far we are from the edges of the screen
		if (new_offset <= Q.height / 2) {
			new_amp = Math.floor(Math.min(new_offset, amp));
		}
		else {
			new_amp = Math.floor(Math.min(Q.height - new_offset, amp));
		}
	});
	
	// UP 'n' DOWN change direction
	Q.input.on("up", this, function() {
		rection *= -1;
	});
		
	Q.input.on("down", this, function() {
		rection *= -1;
	});
    
	// reset position stuff
	Q.input.on("Reset", this, function() {
		new_offset = Math.floor(Q.height/2);
		new_amp = 70;
	});
					
    // space makes shoot
	Q.input.on("fire", this, function() {

		var d = new Date();
		// no constant shooting for you
		if (d.getTime() > this.p.lastShot + 200) {
			// "spawn" the shot, put it at our y and offset our x with an offset so we don't collide with the shot
			var shot = this.stage.insert(new Q.PlayerShot({x: this.p.x + 43, y: this.p.y}));
		        Q.audio.play("THEGUY_Shoot.ogg");
			this.p.lastShot = d.getTime();
		}
	});
  },
  
  step: function(dt) {
	// calculate sine wave
	// amp - amplitude: the highest/lowest point
	this.p.y = Math.floor((amp * Math.sin(2*Math.PI*step)) + offset);
	
	// put down a blip to trace sine wave if we need to
	if (blips < 60) {
		this.stage.insert(new Q.Blip({x: this.p.x, y: this.p.y}));
		blips++;
	}
	
    // make sure step doesn't get too large
	if (step >= 2 * Math.PI) {
		step = -3 * Math.PI/2;
	}
	else if (step <= -2 * Math.PI) {
		step = 3 * Math.PI/2;
	}
            
    // hande changing directions
	if (rection > 0) {
		step += 0.01;
	}
	else {
		step -= 0.01;
	}
            
	// smooth out amp transitions
	if (amp < new_amp) {
		amp += 2;
	}
	if (amp > new_amp) {
		amp -= 2;
	}

	// smooth out offset transitions
	if (offset < new_offset) {
		offset += 2;
	}
	if (offset > new_offset) {
		offset -= 2;
	}
	
	frame += 1;
	
	// spawn more enemies if we have no enemies currently
	if (enemies == 0) {
		// should produce a random integer between 0 and 1
		// as if by magic
		var choice = Math.floor(Math.random() * 2);
		secs = 0;
		if (choice == 0) {
			this.spawn = this.left_echelon;
		}
		else {
			this.spawn = this.right_echelon;
		}
	}
	
	// maken them bad guys
	if (secs < 7 && frame >= FPS) {
		this.spawn(secs);
		secs += 1;
		frame = 0;
	}
  },
  
	// deploy badguys in left echelon formation(?)
	left_echelon: function(secs) {
		var badguy = this.stage.insert(new Q.Badguy({x: Q.width + 32, y: 64 * secs + 31}));
		enemies++;
	},
	
	// deploy badguys in right echelon formation(?)
	right_echelon: function(secs) {
		var badguy = this.stage.insert(new Q.Badguy({x: Q.width + 32, y: Q.height - 64 * secs - 31}));
		enemies++;
	}
});

Q.Sprite.extend("PlayerShot", {
	// constructor!
    init: function(p) {
        this._super(p, {
		asset: "SINEPROJECTILE.png",  // give shot an image asset
		x: 30,           			// set shot position
		y: 30, 
		h: 32, // sprite width for ease of collisions
		w: 32,  // sprite height for ease of collisions
		// set the shot's collision type to Q.SPRITE_PARTICLE so that nothing considers colliding with it
		type: Q.SPRITE_PARTICLE,
		// set the shot's collision mask so it only collides with things that have default collisions on
	    collisionMask: Q.SPRITE_DEFAULT | Q.SPRITE_ACTIVE
		});
	},
	
    // got to call this each frame
    step: function(dt) {
        this.p.x += 5;
		// clean up if we've gone too far
        if (this.p.x > Q.width) {
			this.destroy();
		}
		
		// manually check for collisions because I don't like how Quintus' 2d component does it
		// plus this is closer to how I did it in the original python
		while((collided = this.stage.search(this))) {
			if(collided) {
				if (collided.obj.isA("Badguy")) {
					enemies--;
					bacons++;
					var splosion = this.stage.insert(new Q.Splosion({x: collided.obj.p.x, y: collided.obj.p.y}));
  				        Q.audio.play("Explosion.ogg");
					collided.obj.destroy();
					this.destroy();
				}
				else {
				    // ignore the collision if it's not an important thing (i.e. an BADGUY)
				    return;
				}
			}
		}
	}
});

Q.Sprite.extend("Badguy", {
	// constructor!
    init: function(p) {
        this._super(p, {
		asset: "BADGUY.png",  // give player an image asset
		x: 30,           			// set player position
		y: 30, // extraneous calculation, take it out if we can
		h: 62, // sprite width for ease of collisions
		w: 58,  // sprite height for ease of collisions
		angle: 270, // rotate sprite by 90 degrees
		goback: false,
		shot: false
		});
	},
	
    // got to call this each frame
    step: function(dt) {
		// clean up if we've gone too far
        if (this.p.goback && this.p.x > Q.width) {
			enemies--;
			this.destroy();
		}
		
		if (!this.p.shot) {
            // ~10% chance of shottage every 10 frames
            if (frame % 10 == 0 && Math.random() < 0.1) {
		                Q.audio.play("BADGUY_Shoot.ogg");
				var laser = this.stage.insert(new Q.BadguyShot({x: this.p.x, y: this.p.y}));
				this.p.shot = true;
			}
		}
		
		 // fly towards the center of the screen, then back off
        if (this.p.x < Q.width / 2) {
            this.p.goback = true;
		}

        if (this.p.goback) {
            this.p.x += 3;
		}
        else {
            this.p.x -= 3;
		}
	}
});

Q.Sprite.extend("BadguyShot", {
	// constructor!
    init: function(p) {
        this._super(p, {
		asset: "THELASER.png",  // give player an image asset
		x: 30,           			// set player position
		y: 30, // extraneous calculation, take it out if we can
		h: 6, // sprite width for ease of collisions
		w: 32,  // sprite height for ease of collisions
		// set the shot's collision type to Q.SPRITE_PARTICLE so that nothing considers colliding with it
	    type: Q.SPRITE_PARTICLE,
	    // set the shot's collision mask so it only collides with things that have default collisions on
		collisionMask: Q.SPRITE_DEFAULT | Q.SPRITE_ACTIVE
	});
	},
	
    // got to call this each frame
    step: function(dt) {
        this.p.x -= 5;
		// clean up if we've gone too far
        if (this.p.x < 0) {
			this.destroy();
		}
		
		// manually check for collisions because I don't like how Quintus' 2d component does it
		// plus this is closer to how I did it in the original python
		while((collided = this.stage.search(this))) {
			if(collided) {
				if (collided.obj.isA("Player")) {
					// switch scenes on player death
					collided.obj.destroy();
					
					// RESET EVERYTHING
					step = 0;
					rection = 1;
					score = 0;
					amp = 70;
					new_amp = 70;
					offset = Math.floor(Q.height/2);
					new_offset = Math.floor(Q.height/2);
					frame = 0;
					secs = 0;
					enemies = 0;
					blips = 0;
					
					//Q.clearStages();
					Q.stageScene("menu");
				}
				else {
				    // ignore collision if it's not an important thing (i.e. the player)
				    return; 
				}
			}
		}
	}
});

Q.Sprite.extend("Splosion", {
	// constructor!
    init: function(p) {
        this._super(p, {
		sprite: "splosion", 
		sheet: "splosion",
		angle: 270, // rotate because I'm dumb
		type: Q.SPRITE_NONE
		});
		
		this.add("animation");
		
		this.on("exploded", this, "explode");
	},
	
	explode: function() {
		this.destroy();
	},
	
    // got to call this each frame
    step: function(dt) {
		// play the animation named 'splode', presumably from this object's sprite sheet
        this.play("splode");
	}
});

// bacon doesn't do much
Q.Sprite.extend("Bacon", {
	// constructor!
    init: function(p) {
        this._super(p, {
		asset: "GOLDENREWARD.png",  // give player an image asset
		});
	},
});

// blips show the sine wave
Q.Sprite.extend("Blip", {
	init: function(p) {
		this._super(p, {
		asset: "Blip.png",
		type: Q.SPRITE_NONE,
		});
	},
	
	step: function(dt) {
		this.p.x -= 1;
		
		if (this.p.x < 0) {
			// reset blip position if it gets off the screen
			this.p.x = 60;
			this.p.y = Math.floor((amp * Math.sin(2*Math.PI*step)) + offset);
		}
	}
});

Q.Sprite.extend("Splash", {
	// constructor!
    init: function(p) {
        this._super(p, {
		x: 40,
		y: Q.height - 30,
		asset: "Hatepixel.png",
		});
	},
});

// front matter

// FPS?
var FPS = 60;

// nope, no gravity here	  
Q.gravityX = 0;
Q.gravityY = 0;

// player movement vars (some of these could be moved to player but like I give a fuck)
var step = 0;
var rection = 1;
var score = 0;
var amp = 70;
var new_amp = 70;
var offset = Math.floor(Q.height/2);
var new_offset = Math.floor(Q.height/2);
var blips = 0;

// control vars (some of these could be moved to player but see above)
var frame = 0;
var secs = 0;
var enemies = 0;
var bacons = 0;

// game loops start here

// regular game scene
Q.scene("game",function(stage) {

	// need to be sure to put the skies in the right place so it looks like the background is scrolling
	var sky1 = stage.insert(new Q.Sky({x: Q.width/2, y: Q.height / 2}));
	var sky2 = stage.insert(new Q.Sky({x:3 * Q.width/2, y: Q.height / 2}));
	
	// put our guy in the place
	var player = stage.insert(new Q.Player());
	
	
	stage.add("viewport")
		.centerOn(Math.floor(Q.width/2), Math.floor(Q.height/2));
});

// I dunno, game over menu or something
Q.scene("menu", function(stage) {
	var box = stage.insert(new Q.UI.Container({
		x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
	}));

	var button = box.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC",
										   label: "I'm Not Done Yet" }))         
	var label = box.insert(new Q.UI.Text({x:10, y: -10 - button.p.h, 
										label: "Work's Over" }));
	var button2 = box.insert(new Q.UI.Button({ x: 0, y: 50, fill: "#CCCCCC",
										   label: "Take Me To Reward" })) 									

	button.on("click",function() {
	        Q.audio.play("Blip_Select.ogg");
		Q.clearStages();
		bacons = 0;
		Q.stageScene('game');
	});
	
	button2.on("click",function() {
		Q.audio.play("Blip_Select.ogg");
	        Q.clearStages();
		Q.stageScene('done_game');
	});
	
	box.fit(50);
});

// splash screen, whatever
Q.scene("splash", function(stage) {
	stage.insert(new Q.Sky({x: Q.width/2, y: Q.height / 2}));
	stage.insert(new Q.Sky({x:3 * Q.width/2, y: Q.height / 2}));
	stage.insert(new Q.Splash());

	var box = stage.insert(new Q.UI.Container({
		x: Q.width/2, y: 300, fill: "rgba(0,0,0,0.5)"
	}));

	var button = box.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC",
										   label: "Go to Work" }))         
	var label = stage.insert(new Q.UI.Text({x:Q.width/2, y: Q.height/2, 
						label: "Sines of The Father: Adventures in Triggernometry" }));	

	button.on("click",function() {
	        Q.audio.play("Blip_Select.ogg");
		Q.clearStages();
		bacons = 0;
		Q.stageScene('game');
	});
	
	box.fit();
});

// screen with dem bacons
Q.scene("done_game", function(stage) {

	for (var i = 0; i < bacons; i++) {
		stage.insert(new Q.Bacon({x: Math.floor(Math.random() * Q.width-300) + 300, y: Math.floor(Math.random() * (Q.height-150)) + 150, angle: Math.floor(Math.random() * 360)}));
	}

	var box = stage.insert(new Q.UI.Container({
		x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
	}));

	var button = box.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC",
										   label: "Play Again" }))    
	
	button.on("click",function() {
	        Q.audio.play("Blip_Select.ogg");
		Q.clearStages();
		bacons = 0;
		Q.stageScene('game');
	});
});

// no story scene because that goes right on the web page
// (and I'm lazy)

// loaden all them assets and get everything rolling
Q.load(["Hatepixel.png", "THEGUY.png", "MANPROJECTILE.png", "SINEPROJECTILE.png", "THELASER.png", "the_sky.jpg", "BADGUY.png", "EMSPLOSION.png", "GOLDENREWARD.png", "Blip.png", "THEGUY_Shoot.ogg", "BADGUY_Shoot.ogg", "Explosion.ogg", "Blip_Select.ogg"], function () {
	// set up sprite sheet for explosion
	Q.sheet("splosion", "EMSPLOSION.png", {tilew:62, tileh:64});
	// note to you: need to have loop set to false in order for the trigger event to actually trigger
	Q.animations("splosion",  {splode: {frames: [0,1,2,3,4,5,6,7,8,9], loop: false, rate: 1/10, trigger: "exploded"}});
	Q.stageScene("splash");
});