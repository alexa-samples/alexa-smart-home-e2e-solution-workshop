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
 * This function is triggered when any request is sent to API gateway.
 * This function authorizes the request. If the token is valid, it updates
 * the request header with the userID for the lambda fucntion.
 *
 */

const jwt = require('jsonwebtoken')
const request = require('request')
const jwkToPem = require('jwk-to-pem')

const userPoolId = process.env.USER_POOL_ID
const region = process.env.REGION // e.g. us-east-1
const iss = 'https://cognito-idp.' + region + '.amazonaws.com/' + userPoolId
let pems

exports.handler = function (event, context) {
  // Download PEM for your UserPool if not already downloaded
  if (!pems) {
    // Download the JWKs and save it as PEM
    request({
      url: iss + '/.well-known/jwks.json',
      json: true
    }, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        pems = {}
        const keys = body.keys
        for (let i = 0; i < keys.length; i++) {
          // Convert each key to PEM
          const keyId = keys[i].kid
          const modulus = keys[i].n
          const exponent = keys[i].e
          const keyType = keys[i].kty
          const jwk = { kty: keyType, n: modulus, e: exponent }
          const pem = jwkToPem(jwk)
          pems[keyId] = pem
        }
        // Now continue with validating the token
        ValidateToken(pems, event, context)
      } else {
        // Unable to download JWKs, fail the call
        context.fail('error')
      }
    })
  } else {
    // PEMs are already downloaded, continue with validating the token
    ValidateToken(pems, event, context)
  }
}

function ValidateToken (pems, event, context) {
  const token = event.authorizationToken
  // Fail if the token is not jwt
  const decodedJwt = jwt.decode(token, { complete: true })
  console.log(decodedJwt)
  if (!decodedJwt) {
    console.log('Not a valid JWT token')
    context.fail('Unauthorized')
    return
  }

  // Fail if token is not from your UserPool
  if (decodedJwt.payload.iss !== iss) {
    console.log('invalid issuer')
    context.fail('Unauthorized')
    return
  }

  // Reject the jwt if it's not an 'Access Token'
  if (decodedJwt.payload.token_use !== 'access') {
    console.log('Not an access token')
    context.fail('Unauthorized')
    return
  }

  // Get the kid from the token and retrieve corresponding PEM
  const kid = decodedJwt.header.kid
  const pem = pems[kid]
  if (!pem) {
    console.log('Invalid access token')
    context.fail('Unauthorized')
    return
  }

  // Verify the signature of the JWT token to ensure it's really coming from your User Pool
  jwt.verify(token, pem, { issuer: iss }, function (err, payload) {
    if (err) {
      context.fail('Unauthorized')
    } else {
      // Valid token. Generate the API Gateway policy for the user
      // Always generate the policy on value of 'sub' claim and not for 'username' because username is reassignable
      // sub is UUID for a user which is never reassigned to another user.
      const principalId = payload.sub

      // Get AWS AccountId and API Options
      const apiOptions = {}
      const tmp = event.methodArn.split(':')
      const apiGatewayArnTmp = tmp[5].split('/')
      const awsAccountId = tmp[4]
      apiOptions.region = tmp[3]
      apiOptions.restApiId = apiGatewayArnTmp[0]
      apiOptions.stage = apiGatewayArnTmp[1]
      const method = apiGatewayArnTmp[2]
      let resource = '/' // root resource
      if (apiGatewayArnTmp[3]) {
        resource += apiGatewayArnTmp[3]
      }
      // For more information on specifics of generating policy, refer to blueprint for API Gateway's Custom authorizer in Lambda console
      const policy = new AuthPolicy(principalId, awsAccountId, apiOptions)
      policy.allowAllMethods()
      const result = policy.build()
      console.log(JSON.stringify(result))
      context.succeed(result)
    }
  })
}

/**
 * AuthPolicy receives a set of allowed and denied methods and generates a valid
 * AWS policy for the API Gateway authorizer. The constructor receives the calling
 * user principal, the AWS account ID of the API owner, and an apiOptions object.
 * The apiOptions can contain an API Gateway RestApi Id, a region for the RestApi, and a
 * stage that calls should be allowed/denied for. For example
 * {
 *   restApiId: "xxxxxxxxxx",
 *   region: "us-east-1",
 *   stage: "dev"
 * }
 *
 * var testPolicy = new AuthPolicy("[principal user identifier]", "[AWS account id]", apiOptions);
 * testPolicy.allowMethod(AuthPolicy.HttpVerb.GET, "/users/username");
 * testPolicy.denyMethod(AuthPolicy.HttpVerb.POST, "/pets");
 * context.succeed(testPolicy.build());
 *
 * @class AuthPolicy
 * @constructor
 */
function AuthPolicy (principal, awsAccountId, apiOptions) {
  /**
    * The AWS account id the policy will be generated for. This is used to create
    * the method ARNs.
    *
    * @property awsAccountId
    * @type {String}
    */
  this.awsAccountId = awsAccountId

  /**
    * The principal used for the policy, this should be a unique identifier for
    * the end user.
    *
    * @property principalId
    * @type {String}
    */
  this.principalId = principal

  /**
    * The policy version used for the evaluation. This should always be "2012-10-17"
    *
    * @property version
    * @type {String}
    * @default "2012-10-17"
    */
  this.version = '2012-10-17'

  /**
    * The regular expression used to validate resource paths for the policy
    *
    * @property pathRegex
    * @type {RegExp}
    * @default '^\/[/.a-zA-Z0-9-\*]+$'
    */
  this.pathRegex = new RegExp('^[/.a-zA-Z0-9-\*]+$')

  /* these are the internal lists of allowed and denied methods. These are lists
   * of objects and each object has 2 properties: A resource ARN and a nullable
   * conditions statement.
   * the build method processes these lists and generates the approriate
   * statements for the final policy */
  this.allowMethods = []
  this.denyMethods = []

  if (!apiOptions || !apiOptions.restApiId) {
    this.restApiId = '*'
  } else {
    this.restApiId = apiOptions.restApiId
  }
  if (!apiOptions || !apiOptions.region) {
    this.region = '*'
  } else {
    this.region = apiOptions.region
  }
  if (!apiOptions || !apiOptions.stage) {
    this.stage = '*'
  } else {
    this.stage = apiOptions.stage
  }
}

/**
 * A set of existing HTTP verbs supported by API Gateway. This property is here
 * only to avoid spelling mistakes in the policy.
 *
 * @property HttpVerb
 * @type {Object}
 */
AuthPolicy.HttpVerb = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  HEAD: 'HEAD',
  DELETE: 'DELETE',
  OPTIONS: 'OPTIONS',
  ALL: '*'
}

AuthPolicy.prototype = (function () {
  /**
    * Adds a method to the internal lists of allowed or denied methods. Each object in
    * the internal list contains a resource ARN and a condition statement. The condition
    * statement can be null.
    *
    * @method addMethod
    * @param {String} The effect for the policy. This can only be "Allow" or "Deny".
    * @param {String} he HTTP verb for the method, this should ideally come from the
    *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
    * @param {String} The resource path. For example "/pets"
    * @param {Object} The conditions object in the format specified by the AWS docs.
    * @return {void}
    */
  const addMethod = function (effect, verb, resource, conditions) {
    if (verb !== '*' && !AuthPolicy.HttpVerb.hasOwnProperty(verb)) {
      throw new Error('Invalid HTTP verb ' + verb + '. Allowed verbs in AuthPolicy.HttpVerb')
    }

    if (!this.pathRegex.test(resource)) {
      throw new Error('Invalid resource path: ' + resource + '. Path should match ' + this.pathRegex)
    }

    let cleanedResource = resource
    if (resource.substring(0, 1) === '/') {
      cleanedResource = resource.substring(1, resource.length)
    }
    const resourceArn = 'arn:aws:execute-api:' +
            this.region + ':' +
            this.awsAccountId + ':' +
            this.restApiId + '/' +
            this.stage + '/' +
            verb + '/' +
            cleanedResource

    if (effect.toLowerCase() === 'allow') {
      this.allowMethods.push({
        resourceArn: resourceArn,
        conditions: conditions
      })
    } else if (effect.toLowerCase() === 'deny') {
      this.denyMethods.push({
        resourceArn: resourceArn,
        conditions: conditions
      })
    }
  }

  /**
    * Returns an empty statement object prepopulated with the correct action and the
    * desired effect.
    *
    * @method getEmptyStatement
    * @param {String} The effect of the statement, this can be "Allow" or "Deny"
    * @return {Object} An empty statement object with the Action, Effect, and Resource
    *                  properties prepopulated.
    */
  const getEmptyStatement = function (effect) {
    effect = effect.substring(0, 1).toUpperCase() + effect.substring(1, effect.length).toLowerCase()
    const statement = {}
    statement.Action = 'execute-api:Invoke'
    statement.Effect = effect
    statement.Resource = []

    return statement
  }

  /**
    * This function loops over an array of objects containing a resourceArn and
    * conditions statement and generates the array of statements for the policy.
    *
    * @method getStatementsForEffect
    * @param {String} The desired effect. This can be "Allow" or "Deny"
    * @param {Array} An array of method objects containing the ARN of the resource
    *                and the conditions for the policy
    * @return {Array} an array of formatted statements for the policy.
    */
  const getStatementsForEffect = function (effect, methods) {
    const statements = []

    if (methods.length > 0) {
      const statement = getEmptyStatement(effect)

      for (let i = 0; i < methods.length; i++) {
        const curMethod = methods[i]
        if (curMethod.conditions === null || curMethod.conditions.length === 0) {
          statement.Resource.push(curMethod.resourceArn)
        } else {
          const conditionalStatement = getEmptyStatement(effect)
          conditionalStatement.Resource.push(curMethod.resourceArn)
          conditionalStatement.Condition = curMethod.conditions
          statements.push(conditionalStatement)
        }
      }

      if (statement.Resource !== null && statement.Resource.length > 0) {
        statements.push(statement)
      }
    }

    return statements
  }

  return {
    constructor: AuthPolicy,

    /**
      * Adds an allow "*" statement to the policy.
      *
      * @method allowAllMethods
      */
    allowAllMethods: function () {
      addMethod.call(this, 'allow', '*', '*', null)
    },

    /**
      * Adds a deny "*" statement to the policy.
      *
      * @method denyAllMethods
      */
    denyAllMethods: function () {
      addMethod.call(this, 'deny', '*', '*', null)
    },

    /**
      * Adds an API Gateway method (Http verb + Resource path) to the list of allowed
      * methods for the policy
      *
      * @method allowMethod
      * @param {String} The HTTP verb for the method, this should ideally come from the
      *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
      * @param {string} The resource path. For example "/pets"
      * @return {void}
      */
    allowMethod: function (verb, resource) {
      addMethod.call(this, 'allow', verb, resource, null)
    },

    /**
      * Adds an API Gateway method (Http verb + Resource path) to the list of denied
      * methods for the policy
      *
      * @method denyMethod
      * @param {String} The HTTP verb for the method, this should ideally come from the
      *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
      * @param {string} The resource path. For example "/pets"
      * @return {void}
      */
    denyMethod: function (verb, resource) {
      addMethod.call(this, 'deny', verb, resource, null)
    },

    /**
      * Adds an API Gateway method (Http verb + Resource path) to the list of allowed
      * methods and includes a condition for the policy statement. More on AWS policy
      * conditions here: http://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html#Condition
      *
      * @method allowMethodWithConditions
      * @param {String} The HTTP verb for the method, this should ideally come from the
      *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
      * @param {string} The resource path. For example "/pets"
      * @param {Object} The conditions object in the format specified by the AWS docs
      * @return {void}
      */
    allowMethodWithConditions: function (verb, resource, conditions) {
      addMethod.call(this, 'allow', verb, resource, conditions)
    },

    /**
      * Adds an API Gateway method (Http verb + Resource path) to the list of denied
      * methods and includes a condition for the policy statement. More on AWS policy
      * conditions here: http://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html#Condition
      *
      * @method denyMethodWithConditions
      * @param {String} The HTTP verb for the method, this should ideally come from the
      *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
      * @param {string} The resource path. For example "/pets"
      * @param {Object} The conditions object in the format specified by the AWS docs
      * @return {void}
      */
    denyMethodWithConditions: function (verb, resource, conditions) {
      addMethod.call(this, 'deny', verb, resource, conditions)
    },

    /**
      * Generates the policy document based on the internal lists of allowed and denied
      * conditions. This will generate a policy with two main statements for the effect:
      * one statement for Allow and one statement for Deny.
      * Methods that includes conditions will have their own statement in the policy.
      *
      * @method build
      * @return {Object} The policy object that can be serialized to JSON.
      */
    build: function () {
      if ((!this.allowMethods || this.allowMethods.length === 0) &&
                    (!this.denyMethods || this.denyMethods.length === 0)) {
        throw new Error('No statements defined for the policy')
      }

      const policy = {}
      policy.principalId = this.principalId
      const doc = {}
      doc.Version = this.version
      doc.Statement = []

      doc.Statement = doc.Statement.concat(getStatementsForEffect.call(this, 'Allow', this.allowMethods))
      doc.Statement = doc.Statement.concat(getStatementsForEffect.call(this, 'Deny', this.denyMethods))

      policy.policyDocument = doc

      return policy
    }
  }
})()
