// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { Component, OnInit } from '@angular/core';
import { ManageUserService } from './manage-user.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Smart Home Demo';
  regex = /[?&]([^=]+)\=([^&]+)/g;
  param1: string;
  param2: string;

  constructor (
    public manageUser: ManageUserService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    let params = {
      scope: '',
      code: ''
    };
    let match: any;
    let url = window.location.href;
    console.log(url);
    if(url.search(this.regex) > -1) {
      while (match = this.regex.exec(url)) {
        if( match[1] === 'code') {
          params.code = match[2];
        } else if (match[1] === 'scope') {
          params.scope = match[2];
        }
      }
      if(params.scope && (params.scope === 'alexa::skills:account_linking' || params.scope === 'alexa%3A%3Askills%3Aaccount_linking')) {
        this.manageUser.authCode = params.code;
        manageUser.skillState = 'LWA_AUTH';
      } else {
        this.manageUser.authCode = params.code;;
        manageUser.skillState = 'COGNITO_AUTH';
      }
      console.log(params);
      this.manageUser.user = JSON.parse(sessionStorage.getItem('currentUser'));
      this.manageUser.devices = JSON.parse(sessionStorage.getItem('userDevices'));
      this.router.navigate(['/replenishment']);
    } else {
      console.log("routing to home");
      this.router.navigate(['/home']);
    }
  }
}
