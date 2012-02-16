var artificialHorizon = (function() {
  
	var TWO_PI = 2 * Math.PI, 
      HALF_PI = Math.PI / 2,
      MAX_ACC_BY_2 = 9.81 / 2,
      KAPPA = 0.5522847498,
      RADIUS_MUL_KAPPA;
	
	var canvas, context;
	
	var width = 0, height = 0;
	var diameter = 0, radius = 0; 
	
	var azimuth = 0, pitch = 0, roll = 0;
	
	var startAngle, endAngle, horizon, nextAcceleration = 0, aspectRatio = 0;
	
	var accX = 0, accY = 0, accZ = 0;
	var accelerationsX = [], accelerationsY = [], accelerationsZ = [];
	
	var hasOrientation = false, _rawRoll = 0;
	
	var rotationCorrection = 0;
	
	var GROUND_COLOR = "#323232", LINE_COLOR = "#ffffff", SKY_COLOR = "#72cde4";

	function repaint() {

		init();
		
		roll = Math.atan2(accX, accY);
		pitch = -Math.atan2(accZ, accX * Math.sin(roll) + accY * Math.cos(roll));
		
		//alert(roll + " / " + pitch );
		context.save();

		context.translate(radius, radius);
		context.rotate(roll - rotationCorrection); // apply manual correction factor

		context.beginPath();
		context.arc(0, 0, radius, 0, 2 * Math.PI, false);
		context.fill();
		
		horizon = getHorizon(pitch);

		context.beginPath();
		context.fillStyle = SKY_COLOR;
		context.moveTo(-radius, 0);
		context.arcTo(-radius, 0, radius, 0, radius);
		context.bezierCurveTo(radius, horizon * KAPPA, radius * KAPPA, horizon, 0, horizon);
		context.bezierCurveTo(-radius * KAPPA, horizon, -radius, horizon * KAPPA, -radius, 0);
		context.closePath();
		context.stroke();
		context.fill();

		context.lineWidth = 2;

		drawScale(36, radius * 0.8);
		drawScale(30, radius * 0.1);
		drawScale(24, radius * 0.6);
		drawScale(18, radius * 0.1);
		drawScale(12, radius * 0.4);
		drawScale(6, radius * 0.1);

		context.restore();
		
		requestAnimationFrame( repaint );

	}

	function drawScale(offset, scaleWidth) {

		context.save();

		context.beginPath();
		context.rect(-scaleWidth / 2, -diameter, scaleWidth, 2 * diameter);
		context.clip();

		horizon = getHorizon(pitch + offset * Math.PI / 180);
		context.beginPath();
		context.moveTo(radius, 0);
		context.bezierCurveTo(radius, horizon * KAPPA, RADIUS_MUL_KAPPA, horizon, 0, horizon);
		context.bezierCurveTo(-RADIUS_MUL_KAPPA, horizon, -radius, horizon * KAPPA, -radius, 0);
		context.stroke();

		horizon = getHorizon(pitch - offset * Math.PI / 180);
		context.beginPath();
		context.moveTo(radius, 0);
		context.bezierCurveTo(radius, horizon * KAPPA, RADIUS_MUL_KAPPA, horizon, 0, horizon);
		context.bezierCurveTo(-RADIUS_MUL_KAPPA, horizon, -radius, horizon * KAPPA, -radius, 0);
		context.stroke();
		context.restore();

	}

	function updateAccelerations( evt ) {
	  
		var accelData = evt.accelerationIncludingGravity;
		
		var aX = accelData.x;
		var aY = accelData.y;
		var aZ = accelData.z;
		
		if (aspectRatio > 1 && _rawRoll > 0) {
		  
		  accelerationsX[nextAcceleration] = aY;
  		accelerationsY[nextAcceleration] = -aX;
  		
		} else if (aspectRatio > 1 && _rawRoll <= 0) {
		  
  		accelerationsX[nextAcceleration] = -aY;
			accelerationsY[nextAcceleration] = aX;
			
		}	else {
		  
			accelerationsX[nextAcceleration] = aX;
			accelerationsY[nextAcceleration] = aY;
			
		}
		
		accelerationsZ[nextAcceleration] = aZ;
		
		nextAcceleration = (nextAcceleration + 1) % 5;
		
		accX = sumAccelerations(accelerationsX) / accelerationsX.length;
		accY = sumAccelerations(accelerationsY) / accelerationsY.length;
		accZ = sumAccelerations(accelerationsZ) / accelerationsZ.length;

	}

	function getHorizon(pitch) {
	  
		return Math.sin(pitch) * radius;

	}
	
	function sumAccelerations(accelerationsArr) {
	  
	  if(typeof Array.prototype.reduce === "function") {
	    
	    return accelerationsArr.reduce(function(x,y) { return x+y });

	  } else {
	    
	    var sum = 0;
	    for(var i = 0, l = accelerationsArr.length; i<l; i++) {
	      sum += accelerationsArr[i];
	    }
	    return sum;

	  }
	  
	}
	
	function updateOrientations(evt) {
	  
	  if(!evt || evt.alpha == null || evt.beta == null || evt.gamma == null) {
      return;
    }

    hasOrientation = true;

    azimuth = 360 - evt.alpha;

    // store _device_ gamma for internal use in devicemotion callback
    _rawRoll = evt.gamma;
	  
	}
	
	function init() {

		aspectRatio = document.body.clientWidth / document.body.clientHeight;
		
    if(rotationCorrection !== 0 && (rotationCorrection % HALF_PI) == 0) {
      
      aspectRatio = document.body.clientHeight / document.body.clientWidth;

    }
		
		width = canvas.width;
		height = canvas.height;
		diameter = Math.min(width, height);
		radius = diameter / 2;
		
		RADIUS_MUL_KAPPA = radius * KAPPA;

	}

	function run() {
	  
		context.fillStyle = GROUND_COLOR;
		context.strokeStyle = LINE_COLOR;
		context.lineWidth = 3;

		init();
		
		drawRotationCorrectionButton();
		
		window.addEventListener('devicemotion', updateAccelerations, true);
		window.addEventListener('deviceorientation', updateOrientations, true);
		
		repaint();
		
	}
	
	function drawRotationCorrectionButton() {
	  
	  var rotationCorrectButton = document.createElement('div');
	  rotationCorrectButton.style.position = "fixed";
	  rotationCorrectButton.style.display = "block";
	  rotationCorrectButton.style.top = "10px";
	  rotationCorrectButton.style.right = "10px";
	  rotationCorrectButton.style.width = "32px";
	  rotationCorrectButton.style.height = "32px";
	  rotationCorrectButton.style.padding = "10px";
	  rotationCorrectButton.textContent = "Rotate";
	  rotationCorrectButton.style.backgroundImage = "url('images/rotate.png')";
	  rotationCorrectButton.style.backgroundPosition = "center";
	  rotationCorrectButton.style.backgroundRepeat = "no-repeat";
	  rotationCorrectButton.style.border = "3px solid #030303";
	  rotationCorrectButton.style.textIndent = "-9999px";
	  
	  rotationCorrectButton.addEventListener('click', function(e) {
	    rotationCorrection -= HALF_PI;
	  }, true);
	  
	  document.body.appendChild(rotationCorrectButton);
	  
	}

	return {
	  
		initAndRun : function() {
		  
		  canvas = document.getElementById("canvas");
      context = canvas.getContext("2d");
		  
			var backgroundLoaded = false, topLoaded = false;
			var backgroundImage = new Image();
			backgroundImage.onload = function() {
				backgroundLoaded = true;
				if (topLoaded) {
					run();
				}
			}
			backgroundImage.src = "images/bg.jpg";

			var topImage = new Image();
			topImage.onload = function() {
				topLoaded = true;
				if (backgroundLoaded) {
					run();
				}
			}
			topImage.src = "images/tool_320.png";
		
		}
		
	};

})();

window.addEventListener("load", function() {
  
	artificialHorizon.initAndRun();

}, false);
