if (typeof VRFrameData === 'undefined')
{
   var VRFrameData = function(){
		this.leftProjectionMatrix=  [0.757, 0.000, 0.000, 0.000, 0.000, 0.681, 0.000, 0.000, -0.056, -0.002, -1.000, -1.000, 0.000, 0.000, -0.020, 0.000];
		this.leftViewMatrix= [0.938, -0.191, -0.288, 0.000, 0.215, 0.975, 0.052, 0.000, 0.271, -0.111, 0.956, 0.000, 0.667, -0.028, -0.361, 1.000];
		this.rightProjectionMatrix=  [0.757, 0.000, 0.000, 0.000, 0.000, 0.682, 0.000, 0.000, 0.056, 0.005, -1.000, -1.000, 0.000, 0.000, -0.020, 0.000];
		this.rightViewMatrix= [0.938, -0.191, -0.288, 0.000, 0.215, 0.975, 0.052, 0.000, 0.271, -0.111, 0.956, 0.000, 0.603, -0.028, -0.361, 1.000];
       
   } 
}

var VRDisplay = function()
{
    this.requestPresent = function()
    {
        var promise = new Promise(function(resolve, reject) {
            resolve();
        });

        return promise;
    }

    this.requestAnimationFrame = function(callback)
    {
        window.requestAnimationFrame(callback);
    }

    this.getFrameData = function(vrFrameData)
    {
        
    }

    this.submitFrame = function()
    {
    	
    }

    this.resetPose = function()
    {
    	
    }

}

var FakeWebVR = new function(){


    this.getVRDisplay = function()
    {
        return new VRDisplay;
    }
}