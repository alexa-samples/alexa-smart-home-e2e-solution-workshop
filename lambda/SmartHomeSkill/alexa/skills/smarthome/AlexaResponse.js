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

'use strict'

const { v4: uuidv4 } = require('uuid')
const DEFAULT_DESCRIPTION = 'Battery powered smart light'
const DEFAULT_DISPLAY_CATEGORIES = ['LIGHT']
const DEFAULT_FRIENDLY_NAME = 'Smart Light'
const DEFAULT_MANUFACTURER_NAME = 'Smart Home Workshop'
const DEFAULT_ENDPOINT_ID = 'endpoint-001'
const DEFAULT_TOKEN_ERROR = 'ERROR: A valid token is required'
const DEFAULT_ENDPOINT_ID_ERROR = 'ERROR: A valid endpoint ID is required'
const DEFAULT_NAMESPACE_ERROR = 'ERROR: A valid namespace is required'
const DEFAULT_NAME_ERROR = 'ERROR: A valid name is required'
const DEFAULT_VALUE_ERROR = 'ERROR: A valid value property is required'


/**
* Helper class to generate an AlexaResponse.
* @class
*/
class AlexaResponse {
  /**
   * Check a value for validity or return a default.
   * @param value The value being checked
   * @param defaultValue A default value if the passed value is not valid
   * @returns {*} The passed value if valid otherwise the default value.
   */
  getValueOrDefault (value, defaultValue) {
    if (value === undefined || value === {} || value === '') {
      return defaultValue
    }
    return value
  }

  /**
   * Constructor for an Alexa Response.
   * @constructor
   * @param opts Contains initialization options for the response
   */
  constructor (opts) {
    if (opts === undefined) {
      opts = {}
    }
    if (opts.context !== undefined) {
      this.context = this.getValueOrDefault(opts.context, undefined)
    }
    if (opts.event !== undefined) {
      this.event = this.getValueOrDefault(opts.event, undefined)
    } else {
      this.event = {
        header: {
          namespace: this.getValueOrDefault(opts.namespace, 'Alexa'),
          name: this.getValueOrDefault(opts.name, 'Response'),
          messageId: this.getValueOrDefault(opts.messageId, uuidv4()),
          correlationToken: this.getValueOrDefault(opts.correlationToken, undefined),
          payloadVersion: this.getValueOrDefault(opts.payloadVersion, '3')
        },
        endpoint: {
          scope: {
            type: 'BearerToken',
            token: this.getValueOrDefault(opts.token, DEFAULT_TOKEN_ERROR)
          },
          endpointId: this.getValueOrDefault(opts.endpointId, DEFAULT_ENDPOINT_ID_ERROR)
        },
        payload: this.getValueOrDefault(opts.payload, {})
      }
    }

    // No endpoint in an AcceptGrant or Discover request
    if (this.event.header.name === 'AcceptGrant.Response' || this.event.header.name === 'Discover.Response') {
      delete this.event.endpoint
    }
  }

  /**
   * Add a property to the context.
   * @param opts Contains options for the property.
   */
  addContextProperty (opts) {
    if (this.context === undefined) {
      this.context = { properties: [] }
    }
    this.context.properties.push(this.createContextProperty(opts))
  }

  /**
   * Add an endpoint to the payload.
   * @param opts Contains options for the endpoint.
   */
  addPayloadEndpoint (opts) {
    if (this.event.payload.endpoints === undefined) {
      this.event.payload.endpoints = []
    }
    this.event.payload.endpoints.push(this.createPayloadEndpoint(opts))
  }

  /**
   * Creates a property for the context.
   * @param opts Contains options for the property.
   */
  createContextProperty (opts) {
    return {
      namespace: this.getValueOrDefault(opts.namespace, 'Alexa.EndpointHealth'),
      name: this.getValueOrDefault(opts.name, 'connectivity'),
      value: this.getValueOrDefault(opts.value, { value: 'OK' }),
      timeOfSample: new Date().toISOString(),
      uncertaintyInMilliseconds: this.getValueOrDefault(opts.uncertaintyInMilliseconds, 0)
    }
  }

  /**
   * Creates an endpoint for the payload.
   * @param opts Contains options for the endpoint.
   */
  createPayloadEndpoint (opts) {
    if (opts === undefined) {
      opts = {}
    }

    // Return the proper structure expected for the endpoint
    const endpoint = {
      capabilities: this.getValueOrDefault(opts.capabilities, []),
      description: this.getValueOrDefault(opts.description, DEFAULT_DESCRIPTION),
      displayCategories: this.getValueOrDefault(opts.displayCategories, DEFAULT_DISPLAY_CATEGORIES),
      endpointId: this.getValueOrDefault(opts.endpointId, DEFAULT_ENDPOINT_ID),
      friendlyName: this.getValueOrDefault(opts.friendlyName, DEFAULT_FRIENDLY_NAME),
      manufacturerName: this.getValueOrDefault(opts.manufacturerName, DEFAULT_MANUFACTURER_NAME)
    }

    if (opts.hasOwnProperty('cookie')) {
      endpoint.cookie = this.getValueOrDefault('cookie', {})
    }

    return endpoint
  }

  /**
   * Creates a capability for an endpoint within the payload.
   * @param opts Contains options for the endpoint capability.
   */
  createPayloadEndpointCapability (opts) {
    if (opts === undefined) {
      opts = {}
    }

    const capability = {
      type: this.getValueOrDefault(opts.type, 'AlexaInterface'),
      interface: this.getValueOrDefault(opts.interface, 'Alexa'),
      version: this.getValueOrDefault(opts.version, '3'),
      instance: this.getValueOrDefault(opts.instance, undefined)
    }
    const supported = this.getValueOrDefault(opts.supported, false)
    if (supported) {
      capability.properties = {
        supported: supported,
        proactivelyReported: this.getValueOrDefault(opts.proactivelyReported, true),
        retrievable: this.getValueOrDefault(opts.retrievable, true)
      }
    }
    const replenishment = this.getValueOrDefault(opts.replenishment, false)
    if (replenishment) {
      capability.configuration = {
        measurement: this.getValueOrDefault(opts.measurement, { '@type': 'Percentage' }),
        replenishment: replenishment
      }
    }
    const friendlyNames = this.getValueOrDefault(opts.friendlyNames, false)
    if (friendlyNames) {
      capability.capabilityResources = {
        friendlyNames: friendlyNames
      }
    }
    if (capability.instance === undefined) {
      delete capability.instance
    }
    return capability
  }

  /**
   * Get the composed Alexa Response.
   * @returns {AlexaResponse}
   */
  get () {
    return this
  }
}

module.exports = AlexaResponse
