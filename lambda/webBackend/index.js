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

/**
 ************ Handler description *************
 *
 *  This handler is triggered from the front end on following events to
 *   -- Retrieve a list of devices under the user's account
 *   -- Add a new device
 *   -- Get device status
 *   -- Update device name
 *   -- Update device status
 *   -- Remove device
 *   -- Get skill status
 *   -- Enable skill
 *   -- Disable skill
 */

const https = require('https')
const thingsData = require('manageThings')

exports.handler = async (event, context, callback) => {
  const response = {
    statusCode: 500,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }

  const username = event.requestContext.authorizer.principalId

  console.log(event)

  if (event.queryStringParameters && event.queryStringParameters.messageType) {
    try {
      switch (event.queryStringParameters.messageType) {
        case 'getDevices': {
          // Get list of devices for the user
          const data = await thingsData.getDevices(username)
          console.log('Get devices data: ', data)
          response.statusCode = 200
          response.body = JSON.stringify(data)
          response.headers['Content-Type'] = 'application/json'
          response.headers['Content-Length'] = response.body.length
        }
          break

        case 'addDevice': {
          // Adds a device to user's account. This function calls the asyncUpdate API to send AddOrUpdateReport
          const endpointId = event.queryStringParameters.serialNumber
          const friendlyName = event.queryStringParameters.friendlyName
          const data = await thingsData.addDevice(username, endpointId, friendlyName)
          console.log('Add Device returned data: ', data)
          if (data) {
            const addOrUpdateResult = await sendAlexaMessage('newDevice', username, endpointId)
            console.log('AddOrUpdate API result: ', addOrUpdateResult)
            response.body = JSON.stringify(data)
            response.headers['Content-Type'] = 'application/json'
            response.headers['Content-Length'] = response.body.length
            response.statusCode = 200
          }
        }
          break

        case 'getStatus': {
          // Gets the updated status of the device
          const endpointId = event.queryStringParameters.serialNumber
          const data = await thingsData.getStatus(username, endpointId)
          console.log('Get status data: ', data)
          if (data) {
            response.statusCode = 200
            response.body = JSON.stringify(data)
            response.headers['Content-Type'] = 'application/json'
            response.headers['Content-Length'] = response.body.length
          }
        }
          break

        case 'updateDeviceName': {
          // Updates the device name
          const endpointId = event.queryStringParameters.serialNumber
          const friendlyName = event.queryStringParameters.friendlyName
          const data = await thingsData.updateDeviceName(username, endpointId, friendlyName)
          console.log('Update device name data: ', data)
          if (data) {
            response.body = JSON.stringify(data)
            response.headers['Content-Type'] = 'application/json'
            response.headers['Content-Length'] = response.body.length
            response.statusCode = 200
          }
        }
          break

        case 'updateStatus': {
          // Updates device status
          const state = event.queryStringParameters.value
          const endpointId = event.queryStringParameters.serialNumber
          const data = await thingsData.updateDevice(username, endpointId, state)
          console.log('Update device status data: ', data)
          if (data) {
            response.statusCode = 200
            response.body = JSON.stringify(data)
            response.headers['Content-Type'] = 'application/json'
            response.headers['Content-Length'] = response.body.length
          }
        }
          break

        case 'removeDevice': {
          // Removes a device from user's account. This function calls the asyncUpdate API to send DeleteReport
          const endpointId = event.queryStringParameters.serialNumber
          await thingsData.removeDevice(endpointId)
          const deleteReportResult = await sendAlexaMessage('deleteDevice', username, endpointId)
          console.log('Delete request result: ', deleteReportResult)
          response.headers['Content-Type'] = 'application/json'
          response.statusCode = 200
        }
          break

        case 'getSkillStatus':
        case 'disableSkill': {
          // Disable or get skill status. This function calls the asyncUpdate API to perform skill related functions
          const data = await sendAlexaMessage(event.queryStringParameters.messageType, username)
          console.log('Skill status result: ', data)
          if (data.statusCode === 200) {
            response.body = data.message
            response.headers['Content-Type'] = 'application/json'
            response.headers['Content-Length'] = response.body.length
            response.statusCode = 200
          }
        }
          break

        case 'updateSkillStatus': {
          // Updates the skill status - fetch token or enable the skill. This function calls the asyncUpdate API to perform the skill related tasks
          const data = await sendAlexaMessage(event.queryStringParameters.skillState, username, '', event.queryStringParameters.authCode)
          console.log('Update skill status result: ', data)
          if (data.statusCode === 200) {
            response.statusCode = 200
          }
        }
          break

        default:
          console.log('Unmatched request ', event.queryStringParameters.messageType)
      }
    } catch (err) {
      console.log(err)
    }
  }
  console.log(JSON.stringify(response))
  return response
}

/* HTTP API request to asyncUpdates API to perfom functions related to Alexa skill */
function sendAlexaMessage (messageType, userID, serialNumber, authCode) {
  const body = JSON.stringify('')
  const options = {
    host: process.env.API_GATEWAY_ENDPOINT,
    path: `/${process.env.ENV}/asyncupdates`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': 0,
      userID: userID,
      messageType: messageType
    }
  }

  console.log(`${messageType}, ${userID}, ${serialNumber}, ${authCode}`)

  switch (messageType) {
    case 'newDevice':
    case 'deleteDevice':
      options.headers.serialNumber = serialNumber
      break

    case 'LWA_AUTH':
    case 'COGNITO_AUTH':
      options.headers.authCode = authCode
      break

    default:
      break
  }

  return new Promise((resolve, reject) => {
    console.log(JSON.stringify(options))
    const req = https.request(options, (res) => {
      const data = {
        statusCode: res.statusCode,
        message: ''
      }
      console.log('Inside resolve: ', data)
      res.on('data', function (chunk) {
        data.message += chunk
        console.log('Inside data: ', data)
      })

      res.on('error', (e) => {
        reject(e.message)
      })

      res.on('close', function () {
        console.log('Inside close', data)
        resolve(data)
      })
    })

    req.write(body)

    req.end()
  })
}
