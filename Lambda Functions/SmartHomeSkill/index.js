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
 * This handler is triggered by the directives from Alexa.
 * On receiving any directive, this function calls the manufacturer backend
 * (syncUpdates using sendMessage function) to process the directive and return
 * with the device information. This function then processes that device
 * information in the schema as per Alexa responses and sends a response to Alexa.
 *
 *                       (sendMessage)                      (Directive)
 *    syncUpdates            <---         smartHomeSkill       <---    Alexa
 *  Manufacturer Cloud       --->          skill lambda        --->
 *                       (device data)                       (Response)
 */

const https = require('https')
const AlexaResponse = require('./alexa/skills/smarthome/AlexaResponse')

exports.handler = async function (event, context, callback) {
  // Check the type of Alexa directive and call the corresponding handler
  console.log(JSON.stringify(event))
  let response = {}
  switch (event.directive.header.namespace) {
    case 'Alexa.Authorization':
      response = await authorizationHandler(event)
      break

    case 'Alexa.PowerController':
      response = await powerControllerHandler(event)
      break

    case 'Alexa.Discovery':
      response = await discoveryHandler(event)
      break

    case 'Alexa':
      if (event.directive.header.name === 'ReportState') {
        response = await reportStateHandler(event)
      } else {
        console.log('Unhandled directive')
      }
      break

    default:
      console.log('Unhandled directive')
      break
  }

  console.log(JSON.stringify(response))
  callback(null, response)
}

/* Function to handle AccessGrant directive
 * Details about AccessGrant directive can be found here:
 * https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-authorization.html#acceptgrant
 */
async function authorizationHandler (event) {
  const authorizationCode = event.directive.payload.grant.code
  const bearerToken = event.directive.payload.grantee.token
  const data = await sendMessage('AccessGrant', bearerToken, authorizationCode, '')
  if (data.statusCode !== 200) {
    // Creates an error response
    // https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-errorresponse.html
    const response = new AlexaResponse({ 
      namespace: 'Alexa.Authorization', 
      name: 'ErrorResponse', 
      payload: { 
        type: 'ACCEPT_GRANT_FAILED', 
        message: 'Failed to handle the AcceptGrant directive' 
      } 
    }).get()
    return response
  } else {
    // Creates an Alexa response for AcceptGrant directive
    // https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-authorization.html
    const response = new AlexaResponse({ 
      namespace: 'Alexa.Authorization', 
      name: 'AcceptGrant.Response' 
    }).get()
    return response
  }
}

/* Function to handle PowerController directive
 * Details about PowerController interface can be found here:
 * https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-powercontroller.html
 */
async function powerControllerHandler (event) {
  const bearerToken = event.directive.endpoint.scope.token
  const endpointId = event.directive.endpoint.endpointId
  const correlationToken = event.directive.header.correlationToken
  const data = await sendMessage('updateStatus', bearerToken, endpointId, event.directive.header.name)
  if (data.statusCode !== 200) {
    // Creates an error response
    // https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-errorresponse.html
    const response = new AlexaResponse({ 
      name: 'ErrorResponse', 
      payload: { 
        type: 'ENDPOINT_UNREACHABLE', 
        message: 'Unable to reach the endpoint' 
      } 
    }).get()
    return response
  } else {
    const result = JSON.parse(data.message)
    const powerStatus = result.status === 'on' ? 'ON' : 'OFF'
    // Creates an Alexa TurnOn/TurnOff response event
    // https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-powercontroller.html#turnoff-response-event
    const apr = new AlexaResponse({ 
      correlationToken: correlationToken, 
      token: bearerToken, 
      endpointId: endpointId 
    })
    // Adds the Context Property
    apr.addContextProperty({ 
      namespace: 'Alexa.PowerController', 
      name: 'powerState', 
      value: powerStatus 
    })
    const response = apr.get()
    return response
  }
}

/* Function to handle Discovery directive
 * Details about Discover directive can be found here:
 * https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-discovery.html
 */
async function discoveryHandler (event) {

  const powerControllerCapability = { 
    interface: 'Alexa.PowerController', 
    supported: [{ 
      name: 'powerState' 
    }] 
  }

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

  const bearerToken = event.directive.payload.scope.token
  const data = await sendMessage('discovery', bearerToken, '', '')
  if (data.statusCode !== 200) {
    // Creates an error response
    // https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-errorresponse.html
    const response = new AlexaResponse({ 
      name: 'ErrorResponse', 
      payload: { 
        type: 'ENDPOINT_UNREACHABLE', 
        message: 'Unable to reach the endpoint' 
      } 
    }).get()
    return response
  } else {
    const result = JSON.parse(data.message)

    // Creates an Alexa Discovery Response
    // https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-discovery.html
    const adr = new AlexaResponse({ 
      namespace: 'Alexa.Discovery', 
      name: 'Discover.Response' 
    })

    result.forEach(device => {
      console.log('Device under processing: ', device)

      // Creates the capability object and add the Alexa interface
      // https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-interface.html
      const capabilityAlexa = adr.createPayloadEndpointCapability()
      
      // Creates the Alexa.PowerController Interface
      // https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-powercontroller.html
      const capabilityAlexaPowerController = adr.createPayloadEndpointCapability(powerControllerCapability)
      if (process.env.DASH_REPLENISHMENT === 'ENABLED') {
        // Creates the Alexa.InventoryLevelSensor Interface
        // https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-inventorylevelsensor.html
        const capabilityDashReplenishment = adr.createPayloadEndpointCapability(inventoryLevelSensorCapability)

        // Pushes the endpoint and its capabilities in the payload
        // See Alexa Discovery Response - https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-discovery.html
        adr.addPayloadEndpoint({ 
          friendlyName: device.friendlyName, 
          endpointId: device.serialNumber, 
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
        adr.addPayloadEndpoint({ 
          friendlyName: device.friendlyName, 
          endpointId: device.serialNumber, 
          displayCategories: ['LIGHT'], 
          description: 'Smart Light (battery powered)', 
          manufacturerName: 'Smart Home Demo', 
          capabilities: [
            capabilityAlexa, 
            capabilityAlexaPowerController
          ] 
        })
      }
    })
    const response = adr.get()
    return response
  }
}

/* Function to hand reportState directive
 * Details about ReportState directive can be found here:
 * https://developer.amazon.com/en-US/docs/alexa/smarthome/state-reporting-for-a-smart-home-skill.html#reportstate-directive
 */
async function reportStateHandler (event) {
  const bearerToken = event.directive.endpoint.scope.token
  const endpointId = event.directive.endpoint.endpointId
  const correlationToken = event.directive.header.correlationToken

  const data = await sendMessage('getStatus', bearerToken, endpointId, '')
  if (data.statusCode !== 200) {
    // Create an error response
    // https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-errorresponse.html
    const response = new AlexaResponse({ 
      name: 'ErrorResponse', 
      payload: { 
        type: 'ENDPOINT_UNREACHABLE', 
        message: 'Unable to reach the endpoint' 
      } 
    }).get()
    return response
  } else {
    const result = JSON.parse(data.message)
    const powerStatus = result.status === 'on' ? 'ON' : 'OFF'

    // Creates an Alexa response for state reporting
    // https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-powercontroller.html#state-report
    const asr = new AlexaResponse({ 
      name: 'StateReport', 
      correlationToken: correlationToken, 
      token: bearerToken, 
      endpointId: endpointId 
    })
    // Adds the Context Property
    asr.addContextProperty({ 
      namespace: 'Alexa.PowerController', 
      name: 'powerState', 
      value: powerStatus 
    })
    const response = asr.get()
    return response
  }
}

/* Function to send message to syncUpdates API to retrieve device data */
function sendMessage (messageType, bearerToken, code, data) {
  const body = JSON.stringify('')
  const options = {
    host: process.env.API_GATEWAY_ENDPOINT,
    path: `/${process.env.ENV}/syncupdates`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: bearerToken,
      'Content-Length': 0
    }
  }

  return new Promise((resolve, reject) => {
    options.headers.bearerToken = bearerToken
    options.headers.messageType = messageType

    switch (messageType) {
      case 'AccessGrant':
        options.headers.authorizationCode = code
        break

      case 'getStatus':
        options.headers.endpointID = code
        break

      case 'updateStatus':
        options.headers.endpointID = code
        options.headers.value = data
        break

      case 'discovery':
        break

      default:
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
