var mraa  = require('mraa');
var bleno = require('bleno');

var bleServiceName  = 'Edison';
var bleServiceUUIDs = ['5B9631B5587640AA9C39A6A07FCC1537'];
var bleCharacteristicUUID = '3FA7ABD1DEE54206B4F5F182187F7A1A';

var r = new mraa.Pwm(5);
var g = new mraa.Pwm(3);
var b = new mraa.Pwm(6);

r.enable(true);
r.period_us(2000);
r.write(0.5);

g.enable(true);
g.period_us(2000);
g.write(0.5);

b.enable(true);
b.period_us(2000);
b.write(0.5);

/// LED bilnk cycle
var ledRColor = 1;
var ledGColor = 1;
var ledBColor = 1;

periodicActivity(); //call the periodicActivity function

function periodicActivity()
{
    setTimeout(periodicActivity,100); //call the indicated function after 1 second (1000 milliseconds)
    
    var rcolor = ledRColor;
    var gcolor = ledGColor;
    var bcolor = ledBColor;
    
    r.write(rcolor);
    g.write(gcolor);
    b.write(bcolor);
}

/// BLE
var lastReceivedTs = 0;
var primaryService = new bleno.PrimaryService({
    uuid : bleServiceUUIDs[0],
    characteristics : [
        new bleno.Characteristic({
            uuid : bleCharacteristicUUID,
            properties : ['write', 'writeWithoutResponse'],
            onWriteRequest : function(data, offset, withoutResponse, callback) {
                /// timestamp,acceleration.x,acceleration.y,acceleration.z
                var csv = data.toString("utf-8");
                var d = csv.split(',');
                //console.log(d);
                if(d.length > 0) {
                    var ts = +d[0];
                    if(lastReceivedTs < ts){ // if newer values, update colors
                        lastReceivedTs = ts;
                        ledRColor = +d[1];
                        ledGColor = +d[2];
                        ledBColor = +d[3];
                    }
                }
            }
        })
    ]
})
bleno.on('stateChange', function(state){
    console.log('stateChange : ' + state);
    if(state === 'poweredOn') {
        bleno.startAdvertising(bleServiceName, bleServiceUUIDs);
    } else {
        bleno.stopAdvertising();
    }
});
bleno.on('advertisingStart', function(err){
   if(!err){
       console.log('start advertising ...');
       bleno.setServices([primaryService]);
   } else {
       console.error(err);
   }
});