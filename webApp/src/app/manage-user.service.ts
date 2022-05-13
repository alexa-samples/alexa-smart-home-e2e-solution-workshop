// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '@aws-amplify/auth';
import { API } from 'aws-amplify';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import awsparams from '../aws-params';

@Injectable({
  providedIn: 'root'
})
export class ManageUserService {
  public user: any;
  public devices: any;
  public device: any;
  public currentSkillState: string = 'DISABLED';
  public skillState: string;
  public authCode: any;

  private LWA_URL: string = 'https://www.amazon.com/ap/oa'
  private COGNITO_URL: string = awsparams.app_linking.COGNITO_AUTH_URL;
  private LWA_CLIENT_ID: string = awsparams.app_linking.LWA_CLIENT_ID;
  private LWA_SCOPE: string = 'alexa::skills:account_linking';
  private COGNITO_CLIENT_ID: string = awsparams.app_linking.COGNITO_ALEXA_APP_CLIENT_ID;
  private COGNITO_SCOPE: string = 'profile';
  private RESPONSE_TYPE: string = 'code';
  private REDIRECT_URI: string = awsparams.app_linking.WEB_APP_URL;

  apiName = 'AmplifyWebApp';
  path = '/devices'; 
  myInit = { 
    headers: {}, 
    response: true,
    queryStringParameters: {}
  };
  
  constructor(
    private router: Router,
    private http: HttpClient
  ) { }

  getUser (): Promise<boolean> {
    return new Promise ((resolve, reject) => {
      Auth.currentAuthenticatedUser({bypassCache: false})
      .then ( (user) => {
        this.user = user.attributes;
        this.user['token']=user.signInUserSession.accessToken.jwtToken;
        console.log(this.user.token);
        console.log (user);
        console.log (this.user);
        return resolve(true);
      })
      .catch (err => {
        console.log(err);
        return reject(false);
      });
    })
  }

  getDevices(): Promise<boolean> {
    console.log(awsparams.app_linking);
    console.log(awsparams.app_linking.REDIRECT_URI);
    return new Promise ((resolve, reject) => {
      this.myInit.queryStringParameters = {
        "messageType": "getDevices"
      };
      this.myInit.headers['Authorization']=this.user.token;
  
      console.log("getting devices: ", this.myInit);
      API.get(this.apiName, this.path, this.myInit)
      .then ( (response) => {
        if (response.status === 200) {
          this.devices = response.data;
          console.log(this.devices);
          return resolve (true);
        } else {
          console.log(response);
          return reject(false);
        }
      })
      .catch (err => {
        console.log (err);
        return reject (false);
      });
    })
  }

  getDevice(id: string): Promise<boolean> {
    return new Promise ((resolve, reject) => {
      if (id) {
        this.myInit.queryStringParameters = {
          "messageType":"getStatus",
          "serialNumber":id
        };
        this.myInit.headers['Authorization']=this.user.token;
        API.get(this.apiName, this.path, this.myInit)
        .then ( (response) => {
          if (response.status === 200) {
            this.device = response.data;
            console.log(this.device);
            return resolve (true);
          } else {
            console.log(response);
            return reject(false);
          }
        })
        .catch (err => {
          console.log (err);
          return reject (false);
        });
      } else {
        return reject (false);
      }
    })
  }

  addDevice(name, id): Promise<boolean> {
    return new Promise ((resolve, reject) => {
      if (id) {
        this.myInit.queryStringParameters = {
          "messageType":"addDevice",
          "serialNumber": id,
          "friendlyName": name,
        };
        this.myInit.headers['Authorization']=this.user.token;
        API.get(this.apiName, this.path, this.myInit)
        .then ( (response) => {
          if(response.status === 200) {
            this.device = response.data;
            console.log(this.device);
            return resolve (true);
          } else {
            console.log(response);
            return reject (false);
          }        
        })
        .catch (err => {
          console.log (err);
          return reject (false);
        });
      } else {
        return reject (false);
      }
    })
  }

  removeDevice(): Promise<boolean> {
    return new Promise ((resolve, reject) => {
      this.myInit.queryStringParameters = {
        "messageType":"removeDevice",
        "serialNumber": this.device.serialNumber
      };
      this.myInit.headers['Authorization']=this.user.token;
      API.get(this.apiName, this.path, this.myInit)
      .then ( (response) => {
        if (response.status === 200) {
          this.device = undefined;
          return resolve (true);
        } else {
          console.log(response);
          return reject (false);
        }
      })
      .catch (err => {
        console.log (err);
        return reject (false);
      });
    })
  }

  updateDevice(friendlyName): Promise<boolean> {
    return new Promise ((resolve, reject) => {
      this.myInit.queryStringParameters = {
        "messageType":"updateDeviceName",
        "serialNumber": this.device.serialNumber,
        "friendlyName": friendlyName
      };
      this.myInit.headers['Authorization']=this.user.token;
      console.log(this.myInit);
      API.get(this.apiName, this.path, this.myInit)
      .then ( (response) => {
        if (response.status === 200) {  
            console.log(response.data);
            this.device.friendlyName = response.data.friendlyName;
            console.log(this.device);
            return resolve (true);
        } else {
          console.log(response);
          return reject (false);
        }
      })
      .catch (err => {
        console.log (err);
        return reject (false);
      });
    })
  }

  updateStatus(status): Promise<boolean> {
    return new Promise ((resolve, reject) => {
      this.myInit.queryStringParameters = {
        "messageType":"updateStatus",
        "serialNumber": this.device.serialNumber,
        "value": status
      };
      this.myInit.headers['Authorization']=this.user.token;
      console.log(this.myInit);
      API.get(this.apiName, this.path, this.myInit)
      .then ( (response) => {
        if (response.status === 200) {
          console.log(response.data);
          this.device.status = response.data.status;
          console.log(this.device);
          return resolve (true);
        } else {
          console.log(response);
          return reject (false);
        }
      })
      .catch (err => {
        console.log (err);
        return reject (false);
      });
    })
  }

  skillStatus(mode): Promise<boolean> {
    return new Promise ((resolve, reject) => {
      this.myInit.queryStringParameters = {
        "messageType": mode
      };
      this.myInit.headers['Authorization']=this.user.token;
      if (mode === 'updateSkillStatus') {
        this.myInit.queryStringParameters['skillState'] = this.skillState;
        this.myInit.queryStringParameters['authCode'] = this.authCode;
      }
      API.get(this.apiName, this.path, this.myInit)
      .then ( (response) => {
        if (response.status === 200) {  
            console.log(response.data);
            return resolve (true);
        } else {
          console.log(response);
          return reject (false);
        }
      })
      .catch (err => {
        console.log (err);
        return reject (false);
      });
    })
  }

  logout () {
    Auth.signOut()
      .then ((response) => {
        this.devices = undefined
        this.device = undefined;
        this.user = undefined;
        this.router.navigate(['/home']);
      });
  }

  getAlexaAuth() {
    let url = this.LWA_URL+'?client_id='+this.LWA_CLIENT_ID+'&response_type='+this.RESPONSE_TYPE+'&redirect_uri='+this.REDIRECT_URI+'&scope='+this.LWA_SCOPE;
    console.log(url);
    sessionStorage.setItem('currentUser', JSON.stringify(this.user));
    sessionStorage.setItem('userDevices', JSON.stringify(this.devices));
    this.router.navigate(['/externalRedirect', { externalUrl: url }]);
  }

  getCognitoAuth() {
    let cognitoUrl = this.COGNITO_URL+'?client_id='+this.COGNITO_CLIENT_ID+'&response_type='+this.RESPONSE_TYPE+'&redirect_uri='+this.REDIRECT_URI+'&scope='+this.COGNITO_SCOPE;
    console.log(cognitoUrl);
    sessionStorage.setItem('currentUser', JSON.stringify(this.user));
    sessionStorage.setItem('userDevices', JSON.stringify(this.devices));
    this.router.navigate(['/externalRedirect', { externalUrl: cognitoUrl }]);
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
  
      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead
  
      // TODO: better job of transforming error for user consumption
      console.log(`${operation} failed: ${error.message}`);
  
      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}


