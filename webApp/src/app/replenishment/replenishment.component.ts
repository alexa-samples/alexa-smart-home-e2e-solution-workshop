// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ManageUserService } from '../manage-user.service';

@Component({
  selector: 'app-replenishment',
  templateUrl: './replenishment.component.html',
  styleUrls: ['./replenishment.component.css']
})
export class ReplenishmentComponent implements OnInit {
  pageLoadingComplete: boolean = false;

  constructor(
    private router: Router,
    public manageUser: ManageUserService
  ) { 
    console.log("Inside constructor");
    console.log(this.manageUser.skillState, this.manageUser.authCode);
  }

  ngOnInit(): void {
    console.log(this.manageUser.skillState);
    switch (this.manageUser.skillState) {
      case 'LWA_AUTH':
        this.manageUser.skillStatus('updateSkillStatus')
          .then ((data) => {
            if (data) {
              this.manageUser.getCognitoAuth();
            }
          })
          .catch ((err) => {
            window.alert("Unable to enable skill, please try again later");
            this.manageUser.skillState = undefined;
            this.manageUser.currentSkillState = 'DISABLED';
            this.pageLoadingComplete = true;
          })
        break;

      case 'COGNITO_AUTH':
        this.manageUser.skillStatus('updateSkillStatus')
          .then ((data) => {
            if (data) {
              this.manageUser.currentSkillState = 'ENABLED'
              this.manageUser.skillState = undefined;
              this.pageLoadingComplete = true;
            }
          })
          .catch ((err) => {
            window.alert("Unable to enable skill, please try again later");
            this.manageUser.skillState = undefined;
            this.manageUser.currentSkillState = 'DISABLED';
            this.pageLoadingComplete = true;
          })
        break;

        default:
          this.manageUser.skillStatus('getSkillStatus')
            .then ((data) => {
              if (data) {
                console.log(data);
                this.manageUser.currentSkillState = 'ENABLED';
                this.pageLoadingComplete = true;
              }
            })
            .catch ((err) => {
              console.log(err);
              this.manageUser.currentSkillState = 'DISABLED';
             this.pageLoadingComplete = true;
            })
          break;
    }
  }

  onAllow() {
    console.log("Calling auth");
    console.log(this.manageUser.currentSkillState);
    if (this.manageUser.currentSkillState === 'DISABLED') {
      this.manageUser.getAlexaAuth();
    } else if (this.manageUser.currentSkillState === 'ENABLED') {
      this.manageUser.skillState = undefined;
      this.manageUser.skillStatus('disableSkill')
        .then ((data) => {
          if (data) {
            this.manageUser.currentSkillState = 'DISABLED';
            this.pageLoadingComplete = true;
          }
        })
    }
  }

}
