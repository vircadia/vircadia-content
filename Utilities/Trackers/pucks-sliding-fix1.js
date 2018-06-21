/*
Created by Robin Wilson June 2018

Script allows users in full body trackers to utilize High Fidelity's avatar 
movement animations. 

Instructions:
1. Load and run script before or after calibrating Hifi's full body tracking
2. Hold down any directional movement button on the controllers and the avatar 
will smoothly move into the default walk/run animation
3. Release and the avatar's hands will smoothly move back into your tracker positions
*/

(function () {

    Script.include("/~/system/libraries/utils.js");

    var enabled = false;

    var animStateHandlerID;
    var currentVal = 1;

    var lerpDelta = 0.01;
    var lerpInterval = null;
    var unlerpInterval = null;

    var ZERO = 0;
    var ONE = 1;
    var SECS_TO_MS = 1000;
    var START_FASTER = 2;

    var OVERRIDDEN_DRIVE_KEYS = [
        DriveKeys.TRANSLATE_X,
        DriveKeys.TRANSLATE_Y,
        DriveKeys.TRANSLATE_Z,
        DriveKeys.STEP_TRANSLATE_X,
        DriveKeys.STEP_TRANSLATE_Y,
        DriveKeys.STEP_TRANSLATE_Z
    ];

    function animStateHandler(props) {
        return { ikOverlayAlpha: currentVal };
    }

    function setUp() {

        animStateHandlerID = MyAvatar.addAnimationStateHandler(animStateHandler, ["ikOverlayAlpha"]);
    }

    function enable(dt) {
        currentVal = ONE;

        enabled = true;

        lerpInterval = Script.setInterval(function () {
            currentVal = currentVal - lerpDelta;
            if (currentVal <= ZERO) {
                currentVal = ZERO;
                cleanUpLerp();
            }
        }, dt * SECS_TO_MS / START_FASTER);
    }

    function disable(dt) {
        enabled = false;
        cleanUpLerp();

        unlerpInterval = Script.setInterval(function () {
            currentVal = currentVal + lerpDelta;
            if (currentVal >= ONE) {
                currentVal = ONE;
                cleanUpUnLerp();
            }
        }, dt * SECS_TO_MS);

    }

    function cleanUpLerp() {
        if (lerpInterval !== null) {
            Script.clearInterval(lerpInterval);
            lerpInterval = null;
        }
    }

    function cleanUpUnLerp() {
        if (unlerpInterval !== null) {
            Script.clearInterval(unlerpInterval);
            unlerpInterval = null;
        }
    }

    function update(dt) {

        var areHipsInPucks = Controller.getPoseValue(Controller.Standard.Hips).valid;

        if (areHipsInPucks) {

            var hasActiveDriveKey = false;

            for (var i in OVERRIDDEN_DRIVE_KEYS) {
                if (MyAvatar.getRawDriveKey(OVERRIDDEN_DRIVE_KEYS[i]) !== 0.0) {
                    hasActiveDriveKey = true;
                    break;
                }
            }

            if (hasActiveDriveKey && enabled) {
                // pressing drive key and mappings enabled
                // do nothing
                return;
            } else if (hasActiveDriveKey && !enabled) {
                // pressing drive key and mappings NOT enabled
                // enable mappings
                enable(dt);
            } else if (!hasActiveDriveKey && enabled) {
                // NOT pressing drive key and mappings enabled
                // disable mappings
                disable(dt);
            }
        }
    }

    setUp();
    Script.update.connect(update);

    Script.scriptEnding.connect(function () {
        MyAvatar.removeAnimationStateHandler(animStateHandlerID);
        cleanUpLerp();
    });

})();