// Copyright Amazon.com, Inc. and its affiliates. All Rights Reserved.
 
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0

// Licensed under the Amazon Software License (the "License").
// You may not use this file except in compliance with the License.
// A copy of the License is located at

//   http://aws.amazon.com/asl/

// or in the "license" file accompanying this file. This file is distributed
// on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
// express or implied. See the License for the specific language governing
// permissions and limitations under the License.


/************* Description *************
*
* This example creates a virtual battery-powered device with ON/OFF capability.
* This virtual device reports the device status and the battery level remaining
* to the AWS IoT cloud. When the device is switched ON, the battery level decrements
* by 1% every 10s. Once the battery level drops to 0%, it stays at 0%.
*
* To reset the battery level, user will have to stop the simulation and start again.
*
*/

var awsIot = require('aws-iot-device-sdk');

/* Replace the values from "Update the Virtual Device section of the lab manual" */
var thingShadows = awsIot.thingShadow({
  keyPath: "./certs/xxxxxxxxxx-private.pem.key",
  // Some browser might convert this file into a text document. In such cases, add .txt at the end of the cert path
  certPath: "./certs/xxxxxxxxxx-certificate.pem.crt",
  caPath: "./certs/AmazonRootCA1.pem",
  clientId: "xxxxxxxxxx",
  host: "xxxxxxxxxx-ats.iot.xxxxxxxxxx.amazonaws.com"
});

/* Client token value returned from thingShadows.update() operation */
const defaultName = "Light"
var deviceName = "";
var clientTokenUpdate;

/* Update the thing name */
var thingName = 'xxxxxxxxxx';

/* Simulated device values */
var status = 'off';
var batteryVal = 100;
var publishInterval = 10000;
var timeout;

/* Decrement battery level by 1% every publishInterval milli seconds */
setInterval(function() {

  if (status === 'on' && batteryVal > 0){
    batteryVal--;
    let shadowState = {"state":{"reported":{"battery":batteryVal}}};
    clientTokenUpdate = thingShadows.update(thingName, shadowState  );
  }
}, publishInterval);

/* Connect with the shadow */
thingShadows.on('connect', function() {
  /* Register interest in the shadow */
  thingShadows.register( thingName, {}, function() {
    /* Create the shadow document with the latest thing state */
    let shadowState = {"state":{"reported":{"status":status, "battery":batteryVal, "friendlyName":deviceName === '' ? defaultName:deviceName }}};

    clientTokenUpdate = thingShadows.update(thingName, shadowState  );
    if (clientTokenUpdate === null) {
      console.log('update shadow failed, operation still in progress');
    }
  });
});

/* Log the status updates */
thingShadows.on('status', function(thingName, stat, clientToken, stateObject) {
  console.log('received '+stat+' on '+thingName+': '+ JSON.stringify(stateObject));
});

/* Process if the delta topic gets updated */
thingShadows.on('delta', function(thingName, stateObject) {
  if(stateObject.state.status) {
    let desiredState = stateObject.state.status === "on" ? "on" : "off";

    let shadowState = {"state":{"reported":{"status":desiredState}}};
    clientTokenUpdate = thingShadows.update(thingName, shadowState);
    status = desiredState;
  } else if(stateObject.state.friendlyName) {
    deviceName = stateObject.state.friendlyName;
    console.log("New Friendly Name: ",deviceName);

    let shadowState = {"state":{"reported":{"friendlyName":deviceName===""?defaultName:deviceName}}};
    clientTokenUpdate = thingShadows.update(thingName, shadowState);
  }
  console.log('received delta on '+thingName+': '+ JSON.stringify(stateObject));
});

/* Process event if the shadow operation timesout */
thingShadows.on('timeout', function(thingName, clientToken) {
  console.log('received timeout on '+thingName+' with token: '+ clientToken);
});
