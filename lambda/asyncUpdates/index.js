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

/*
 ************ Handler description *************
 *
 * This handler is triggered based on following conditions:
 *    --  AWS IoT - Device state (power status or battery level) is updated
 *    --  CloudWatch - triggers the function every 24 hours to proactively report inventory level sensor data
 *    --  WebApp
 *        --  A new device is added - to proactively discover the device to Alexa
 *        --  A device is deleted - to delete the device from user's Alexa account
 *        --  App to app account linking
 *            --  Retrieve skill status
 *            --  Handle the auth code received for skill enablement
 *            --  Enable skill
 *        --  Disable skill
 *
 */

const thingsData = require('manageThings')
const lwa = require('lwa')
const AlexaAsyncUpdates = require('./alexa/skills/smarthome/AlexaAsyncUpdate')
const https = require('https')

exports.handler = async (event) => {
  const response = {
    statusCode: 500
  }

  console.log('********* Event ***********')
  console.log(JSON.stringify(event))
  try {
    // Check the trigger source for the function
    if (event.thingName && (event.state.reported.battery || event.state.reported.status)) {
      // Function is triggered by device status being updated
      // Get device details using the thingName. It assumes that no two things share the same name
      response.statusCode = await changeReportHandler(event)
    } else if (event['detail-type'] === 'Scheduled Event' && process.env.DASH_REPLENISHMENT === 'ENABLED') {
      // Triggered by a cloud watch event
      response.statusCode = await dailyUpdateHandler(event)
    } else {
      // Event triggered by user interaction from the webApp
      switch (event.headers.messageType) {
        case 'newDevice':
          // Triggered if a new device is added
          response.statusCode = await addOrUpdateReportHandler(event)
          break

        case 'deleteDevice':
          // Triggered if the device is deleted from user's account
          response.statusCode = await deleteReportHandler(event)
          break

        case 'LWA_AUTH':
          // Received as a part of app-to-app account linking. Use the auth code to retrieve and store access
          // and refresh tokens.
          // Details for exchaning auth code for access and refresh token are available here:
          // https://developer.amazon.com/en-US/docs/alexa/account-linking/app-to-app-account-linking-starting-from-your-app.html#step-5
          await lwa.storeSkillsToken(event.headers.userID, event.headers.authCode)
          response.statusCode = 200
          break

        case 'COGNITO_AUTH':
          // Received as a part of app-to-app account linking. Send a message to the Alexa backend to
          // enable the skill
          response.statusCode = await cognitoAuthHandler(event)
          break

        case 'getSkillStatus':
          // Retrieve skill status
          response.statusCode = await skillStatusHandler(event)
          break

        case 'disableSkill':
          // Disable skill
          response.statusCode = await disableSkillHandler(event)
          break
      }
    }
  } catch (e) {
    console.log('********* Error details ***********')
    console.log(e)
  }

  console.log('********* Lambda response ***********')
  return response
}

/* Handler for sending change report
 * Details for change report are available here:
 * https://developer.amazon.com/en-US/docs/alexa/smarthome/state-reporting-for-a-smart-home-skill.html#changereport-event
 *
 * Details for InventoryLevelSensor are available here:
 * https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-inventorylevelsensor.html
 */
async function changeReportHandler (event) {
  const things = await thingsData.getDeviceInfo(event.thingName)

  console.log('********* Things Information ***********')
  console.log(JSON.stringify(things))

  const thingData = await thingsData.getStatus(things.attributes.userID, things.attributes.serialNumber)
  console.log('******** GetStatus ***********')
  console.log(JSON.stringify(thingData))

  // Retrieve the refresh token and use it to get an access token
  const accessToken = await lwa.getPsuToken(things.attributes.userID)

  // Retrieve change report JSON structure
  const acr = new AlexaAsyncUpdates({ endpointId: things.attributes.serialNumber, token: accessToken })

  if (event.state.reported.status) {
    acr.addPayloadProperty({ 
      namespace: 'Alexa.PowerController', 
      name: 'powerState', 
      value: event.state.reported.status === 'on' ? 'ON' : 'OFF' 
    })
  } else {
    acr.addContextProperty({ 
      namespace: 'Alexa.PowerController', 
      name: 'powerState', 
      value: thingData.status === 'on' ? 'ON' : 'OFF' 
    })
  }
  if (process.env.DASH_REPLENISHMENT === 'ENABLED') {
    if (event.state.reported.battery) {
      acr.addPayloadProperty({ 
        namespace: 'Alexa.InventoryLevelSensor', 
        name: 'level', 
        instance: 'InventoryLevelSensor-1', 
        value: { 
          '@type': 'Percentage', 
          value: event.state.reported.battery 
        } 
      })
    } else {
      acr.addContextProperty({ 
        namespace: 'Alexa.InventoryLevelSensor', 
        name: 'level', 
        instance: 'InventoryLevelSensor-1', 
        value: { 
          '@type': 'Percentage', 
          value: thingData.battery 
        } 
      })
    }
  }
  const report = acr.get()
  console.log('**************** CHANGE REPORT ***************')
  console.log(JSON.stringify(report))

  const data = await sendProactiveUpdate(report, accessToken)
  console.log(JSON.stringify(data))
  return 200
}

/* Handler for sending daily updates
 * Sends InventoryLevel sensor update every 24 hours
 * Details for InventoryLevelSensor are available here:
 * https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-inventorylevelsensor.html
 */
async function dailyUpdateHandler (event) {
  // Gets all users from DynamoDB.
  const users = await lwa.getAllUsers()

  console.log('**************** List of Users ***************')
  console.log(users)
  // Get devices for each user and send battery information as proactive updates
  for (const user of users) {
    const things = await thingsData.getDevices(user.userID)
    for (const thing of things) {
      // Retrieve change report JSON structure
      const acr = new AlexaAsyncUpdates({ 
        endpointId: thing.serialNumber, 
        token: user.access_token 
      })
      acr.addPayloadProperty({ 
        namespace: 'Alexa.InventoryLevelSensor', 
        name: 'level', 
        instance: 'InventoryLevelSensor-1', 
        value: { 
          '@type': 'Percentage', 
          value: thing.battery 
        } 
      })
      acr.addContextProperty({ 
        namespace: 'Alexa.PowerController', 
        name: 'powerState', 
        value: thing.status === 'on' ? 'ON' : 'OFF' 
      })
      const report = acr.get()
      console.log('**************** CHANGE REPORT CLOUD WATCH ***************')
      console.log(JSON.stringify(report))

      const data = await sendProactiveUpdate(report, user.access_token)
      console.log(JSON.stringify(data))
    }
  }
  return 200
}

/* Handler for sending AddOrUpdate report
 * Details about AddOrUpdate report are available here:
 * https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-discovery.html#add-or-update-report
 */
async function addOrUpdateReportHandler (event) {

  // Definition for Alexa.PowerController Interface
  // https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-powercontroller.html
  const powerControllerCapability = { 
    interface: 'Alexa.PowerController', 
    supported: [{ 
      name: 'powerState' 
    }] 
  }

  // Definition for Alexa.InventoryLevelSensor Interface
  // https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-inventorylevelsensor.html
  const inventoryLevelSensorCapability = { 
    interface: 'Alexa.InventoryLevelSensor', 
    instance: 'InventoryLevelSensor-1', 
    supported: [{ 
      name: 'level' 
    }], 
    replenishment: { 
      '@type': 'DashReplenishmentId', 
      value: process.env.DASH_REPLENISHMENT_ID 
    }, 
    friendlyNames: [{ 
      '@type': 'text', 
      value: { 
        locale: 'en-US', 
        text: 'Battery' 
      } 
    }] 
  }

  // Get things details and send an AddOrUpdate Report to proactively discover the device to Alexa
  const things = await thingsData.getDevice(event.headers.serialNumber)
  console.log('********* Things Information ***********')
  console.log(things)
  const accessToken = await lwa.getPsuToken(event.headers.userID)

  // Creates an Alexa AddOrUpdate Report
  // https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-discovery.html#add-or-update-report
  const aur = new AlexaAsyncUpdates({ 
    namespace: 'Alexa.Discovery', 
    name: 'AddOrUpdateReport', 
    token: accessToken 
  })

  // Creates the capability object and add the Alexa interface
  // https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-interface.html    
  const capabilityAlexa = aur.createPayloadEndpointCapability()

  // Creates the Alexa.PowerController Interface
  // https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-powercontroller.html    
  const capabilityAlexaPowerController = aur.createPayloadEndpointCapability(powerControllerCapability)
  
  if (process.env.DASH_REPLENISHMENT === 'ENABLED') {
    // Creates the Alexa.InventoryLevelSensor Interface
    // https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-inventorylevelsensor.html
    const capabilityDashReplenishment = aur.createPayloadEndpointCapability(inventoryLevelSensorCapability)

    // Pushes the endpoint and its capabilities in the payload
    // See Alexa Discovery Response - https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-discovery.html
    aur.addPayloadEndpoint({ 
      friendlyName: things.friendlyName, 
      endpointId: event.headers.serialNumber, 
      displayCategories: ['LIGHT'], 
      description: 'Smart Light (battery powered)', 
      manufacturerName: 'Smart Home Demo', 
      capabilities: [
        capabilityAlexa, 
        capabilityAlexaPowerController, 
        capabilityDashReplenishment
      ] 
    })
  } else {
    aur.addPayloadEndpoint({ 
      friendlyName: things.friendlyName, 
      endpointId: event.headers.serialNumber, 
      displayCategories: ['LIGHT'], 
      description: 'Smart Light (battery powered)', 
      manufacturerName: 'Smart Home Demo', 
      capabilities: [
        capabilityAlexa, 
        capabilityAlexaPowerController
      ] 
    })
  }
  const report = aur.get()
  console.log('**************** AddOrUpdate Report *****************')
  console.log(JSON.stringify(report))

  const data = await sendProactiveUpdate(report, accessToken)
  console.log(JSON.stringify(data))
  return 200
}

/* Handler for sending Delete report
 * Details about Delete report are available here:
 * https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-discovery.html#deletereport-event
 */
async function deleteReportHandler (event) {
  // Triggered if the device is deleted from user's account. Sends a Delete report to delete device
  // from user's Alexa account
  const accessToken = await lwa.getPsuToken(event.headers.userID)
  
  // Creates an Alexa Delete Report 
  const adr = new AlexaAsyncUpdates({ 
    namespace: 'Alexa.Discovery', 
    name: 'DeleteReport' 
  })

  // Adds the payload object
  adr.addPayloadEndpoint({ endpointId: event.headers.serialNumber })
  const report = adr.get()
  console.log('**************** Delete Report **************')
  console.log(JSON.stringify(report))
  
  const data = await sendProactiveUpdate(report, accessToken)
  console.log(JSON.stringify(data))
  return 200
}

/* Handler for Cognito Auth - enable skill */
async function cognitoAuthHandler (event) {
  const accessToken = await lwa.getSkillsToken(event.headers.userID)
  const skillObject = {
    stage: process.env.SMART_HOME_SKILL_STAGE,
    accountLinkRequest: {
      redirectUri: process.env.REDIRECT_URI,
      authCode: event.headers.authCode,
      type: 'AUTH_CODE'
    }
  }
  const data = await skillStatus('enable', accessToken, skillObject)
  console.log('**************** Enable Skill Handler **************')
  console.log(JSON.stringify(data))
  if (data.statusCode < 400) {
    return 200
  } else {
    return 500
  }
}

/* Handler for getting skill status */
async function skillStatusHandler (event) {
  // Get skill status
  const accessToken = await lwa.getSkillsToken(event.headers.userID)
  const data = await skillStatus('check', accessToken, '')
  console.log('**************** Skill Status Handler **************')
  console.log(JSON.stringify(data))
  if (data.statusCode < 400) {
    return 200
  } else {
    return 500
  }
}

/* Handler for disabling skill */
async function disableSkillHandler (event) {
  // Disable skill
  const accessToken = await lwa.getSkillsToken(event.headers.userID)
  const data = await skillStatus('disable', accessToken, '')
  console.log('**************** Disable Skill Handler **************')
  console.log(JSON.stringify(data))
  if (data.statusCode < 400) {
    return 200
  } else {
    return 500
  }
}

/* Send proactive updates to Alexa Event Gateway
 * In this workshop, all the development and testing is done with an assumption that user is located in the NA region.
 * If the users of your device and skill are across multiple regions, then you'll have to send proactive updates
 * to the region of the user. This can be determined based on the lambda which gets the AccessGrant directive. Details
 * on how to send Events to the Alexa Event Gateway, along with the details of multiple region are available here:
 * https://developer.amazon.com/en-US/docs/alexa/smarthome/send-events-to-the-alexa-event-gateway.html
 */
function sendProactiveUpdate (template, token) {
  const body = JSON.stringify(template)
  const options = {
    host: 'api.amazonalexa.com',
    path: '/v3/events',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': body.length,
      Authorization: `Bearer ${token}`
    }
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const data = {
        statusCode: res.statusCode,
        message: ''
      }
      res.on('data', function (chunk) {
        data.message += chunk
      })

      res.on('error', (e) => {
        reject(e.message)
      })

      res.on('close', function () {
        resolve(data)
      })
    })

    req.write(body)

    req.end()
  })
}

/* Get or update skill status
 * In this workshop, all the development is done with the NA accounts. Thus, we're using
 * api.amazonalexa.com as the host. If your skill is deployed across multiple regions then
 * you must get user's region endpoint before calling the skill enablement API.
 * User's region can be obtained by calling the AlexaEndpoint API, details are available here:
 * https://developer.amazon.com/en-US/docs/alexa/account-linking/skill-activation-api.html#get-endpoint
 *
 * Additional details about skill enablement API - to enable, get status or disable are available here:
 * https://developer.amazon.com/en-US/docs/alexa/account-linking/skill-activation-api.html
 */
function skillStatus (mode, token, payload) {
  const body = JSON.stringify(payload)
  const options = {
    host: 'api.amazonalexa.com',
    path: `/v1/users/~current/skills/${process.env.SMART_HOME_SKILL_ID}/enablement`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  }

  return new Promise((resolve, reject) => {
    switch (mode) {
      case 'check':
        options.method = 'GET'
        options.headers['Content-Length'] = 0
        break

      case 'disable':
        options.method = 'DELETE'
        options.headers['Content-Length'] = 0
        break

      case 'enable':
        options.method = 'POST'
        options.headers['Content-Length'] = body.length
        break
    }
    const req = https.request(options, (res) => {
      const data = {
        statusCode: res.statusCode,
        message: ''
      }
      res.on('data', function (chunk) {
        data.message += chunk
      })

      res.on('error', (e) => {
        reject(e.message)
      })

      res.on('close', function () {
        resolve(data)
      })
    })

    req.write(body)

    req.end()
  })
}
