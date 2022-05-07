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
 * This handler is triggered to process the directives received by the SmartHomeSkill
 * lambda. It performs the following function:
 *  -- Handles AccessGrant Directive - retrieves and stores token in the DynamoDB
 *  -- Handles ReportState Directive - retrieves device power status
 *  -- Handles TurnOn or TurnOff Directive - updates the device status
 *  -- Handles Discovery Directive - discovers the list of endpoints and capabilities for the user
 *
 */

const thingsData = require('manageThings')
const lwa = require('lwa')

exports.handler = async (event) => {
  const response = {
    statusCode: 500,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }

  // Retrieve the username from lambdaAuthorizer's response
  const username = event.requestContext.authorizer.principalId

  try {
    if (event.headers && event.headers.messageType && event.headers.bearerToken) {
      // Process incoming messages based on the request type
      switch (event.headers.messageType) {
        case 'AccessGrant':
          await lwa.storePsuToken(username, event.headers.authorizationCode)
          response.statusCode = 200
          break

        case 'getStatus': {
          // Call the getStatus API from manageThings layer to retrieve things status.
          const data = await thingsData.getStatus(username, event.headers.endpointID)
          response.statusCode = 200
          response.body = JSON.stringify(data)
          response.headers['Content-Type'] = 'application/json'
          response.headers['Content-Length'] = response.body.length
        }
          break

        case 'updateStatus': {
          const state = event.headers.value === 'TurnOn' ? 'on' : 'off'
          // Call the updateDevice API from manageThings layer to update device status
          const data = await thingsData.updateDevice(username, event.headers.endpointID, state)
          if (data) {
            response.statusCode = 200
            response.body = JSON.stringify(data)
            response.headers['Content-Type'] = 'application/json'
            response.headers['Content-Length'] = response.body.length
          } else {
            console.log('********* Update Status Error State *********')
            console.log(JSON.stringify(data))
          }
        }
          break

        case 'discovery': {
          // Call the getDevices API from manageThings layer to get the list of devices
          const devicesTable = await thingsData.getDevices(username)
          // Return the response to the calling function with the data
          response.statusCode = 200
          response.body = JSON.stringify(devicesTable)
          response.headers['Content-Type'] = 'application/json'
          response.headers['Content-Length'] = response.body.length
        }
          break
      }
    }
  } catch (e) {
    console.log(e)
    response.statusCode = 500
  }
  console.log('*********** syncUpdates Response ***********')
  console.log(JSON.stringify(response))
  return (response)
}
