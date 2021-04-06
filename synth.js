// web synth author: Greg M

var audio = new window.AudioContext();

var SITE_VOLUME = .5;
var TET = 12; //tone equal temperament

class OscModel {
    constructor(type, dest, frequency, attack, decay) {
        this.type = type;
        this.dest = dest;
        this.freq = frequency; //null if tied to input
        this.attack = attack;
        this.decay = decay;
        this.destprop = null; //null if tied to output
    }
}

var oscillators = []; //each osc: [model, view]

function createOscillator(model, userfreq) {
    var attack = model.attack,
        decay = model.decay,
        gain = audio.createGain(),
        osc = audio.createOscillator();

    if (model.dest == "out") {
        gain.gain.setValueAtTime(0, audio.currentTime);
        gain.gain.linearRampToValueAtTime(.15 * SITE_VOLUME, audio.currentTime + attack / 1000);
        gain.gain.linearRampToValueAtTime(0, audio.currentTime + decay / 1000);

        gain.connect(audio.destination);

        if(model.freq == null) {
            osc.frequency.value = userfreq;
        } else {
            osc.frequency.value = model.freq;
        }
    }

    
    osc.type = model.type;
    osc.connect(gain);
    osc.start(0);

    setTimeout(function() {
        osc.stop(0);
        try {
            osc.disconnect(gain);
            gain.disconnect(audio.destination);
        } catch(err) {}
    }, decay)

    return [osc, gain, model.dest, model.destprop];
}

function createOscs(oscillators, userfreq) {
    oscs = [] //list of lists [osc, gain, destination, destproperty]
    //create list of oscillators
    for (const osc of oscillators) {
        oscs.push(createOscillator(osc[0], userfreq));
    }
    //assign their gains to given output
    for (const osc of oscs) {
        if (osc[3] == "f") {
            osc[1].gain.value = 100;
            osc[0].frequency.value = 1;
            osc[1].connect(oscs[osc[2]][0].frequency);
        } else if (osc[3] == "a") {
            osc[1].gain.value = .1;
            osc[0].frequency.value = 1;
            osc[1].connect(oscs[osc[2]][1].gain);
        }
    }

}

function createOscTemplate() {
    const idx = oscillators.length;
    //create osc model
    var model = new OscModel("sine", "out", null, "0.001", "999");

    //create menu
    var oscDiv = document.getElementById('oscs');
    var view = oscDiv.appendChild(document.createElement('div'));
    view.id = "osc"+idx;

    //write html
    s = `<h2>Oscillator ${idx+1}</h2><br>`;
    s +=
    `<p>Oscillator Type:</p>
    <input type="radio" id="square${idx}" name="osc${idx}" value="square">
    <label for="square">Square</label><br>
    <input type="radio" id="sine${idx}" name="osc${idx}" value="sine" checked>
    <label for="sine">Sine</label><br>
    <input type="radio" id="triangle${idx}" name="osc${idx}" value="triangle">
    <label for="triangle">Triangle</label><br>
    <input type="radio" id="sawtooth${idx}" name="osc${idx}" value="sawtooth">
    <label for="sawtooth">Sawtooth</label><br><br>`;
    s += 
    `<div class="dropdown">
    <p>Oscillator Output:</p>
    <button class="dropbtn" id="dropbtn${idx}">Output</button>
    <div id="dc${idx}" class="dropdown-content">
    <button class="dropdown-button" id=${idx}outputout>Output</button>`
    for (i=0;i<oscillators.length+1;i++) {
        if (i != idx) {
            s += `<button class="dropdown-button" id=${idx}output${i}>Osc ${i+1} Frequency</button>` 
            //name format: {this}output{type}{dest}
            s += `<button class="dropdown-button" id=${idx}outputa${i}>Osc ${i+1} Amplitude</button>`
        }
    }
    s += 
    `</div>
    </div>`

    view.innerHTML = s;

    //create button event handlers
    document.getElementById(`square${idx}`).onclick = function() {model.type = "square"};
    document.getElementById(`sine${idx}`).onclick = function() {model.type = "sine"};
    document.getElementById(`triangle${idx}`).onclick = function() {model.type = "triangle"};
    document.getElementById(`sawtooth${idx}`).onclick = function() {model.type = "sawtooth"};
    document.getElementById(`${idx}outputout`).onclick = function() {
        model.dest = "out";
        model.destprop = null;
        document.getElementById(`dropbtn${idx}`).innerHTML = "Output";
    };
    for (i=0;i<oscillators.length+1;i++) {
        if (i != idx) {
            const num = i;
            document.getElementById(idx + `output${i}`).onclick = function() {
                model.dest = num;
                model.destprop = "f"; 
                document.getElementById("dropbtn" + idx).innerHTML = `Osc ${num+1} Frequency`;
            };
            document.getElementById(idx + `outputa${i}`).onclick = function() {
                model.dest = num;
                model.destprop = "a"; 
                document.getElementById("dropbtn" + idx).innerHTML = `Osc ${num+1} Amplitude`;
            };        
        }
    }

    oscillators[idx] = [model, view]
}
document.getElementById("makeosc").onclick = function() {
    createOscTemplate();
}

function deleteOsc() {
    var div = document.getElementById("osc"+(oscillators.length-1));
    div.parentNode.removeChild(div); //remove html
    oscillators.pop(); //remove object
}
document.getElementById("remosc").onclick = function() {
    deleteOsc();
}


var keys = ["q", "2", "w", "3", "e", "r", "5", "t", "6", "y", "7", "u", "i", "9", "o", "0", "p"];
var keyValues = {};

function setKeys() {
    var i = 0;
    for(const key of keys) {
        keyValues[key] = 262.0 * Math.pow(2, (i/TET));
        i++;
    }
}
setKeys();

window.addEventListener('keydown', function(event) {
    if (event.key in keyValues) {
        createOscs(oscillators, keyValues[event.key]);
    };
});



document.getElementById("volume").oninput = function() {
  SITE_VOLUME = this.value * .01;
}

document.getElementById("tetplus").onclick = function() {
    TET++;
    document.getElementById("tet").innerHTML = "TET: " + String(TET);
    setKeys();
}

document.getElementById("tetminus").onclick = function() {
    TET--;
    document.getElementById("tet").innerHTML = "TET: " + String(TET);
    setKeys();
}

document.getElementById("tetreset").onclick = function() {
    TET = 12;
    document.getElementById("tet").innerHTML = "TET: " + String(TET);
    setKeys();
}