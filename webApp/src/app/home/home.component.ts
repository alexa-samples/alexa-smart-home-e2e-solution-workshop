// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { Component, OnInit } from '@angular/core';
import { ManageUserService } from '../manage-user.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  pageLoadingComplete: boolean = false;
  pageLoadError: boolean = false;

  constructor(
    public manageUser: ManageUserService
  ) { }

  ngOnInit(): void {
      this.manageUser.getUser()
      .then (signedIn => {
        if (signedIn) {
          this.manageUser.getDevices()
          .then ((data) => {
            if (data) {
              this.pageLoadingComplete = true;
              this.pageLoadError = false;
            }
          })
          .catch((err) => {
            console.log(err);
            this.pageLoadError = true;
            this.pageLoadingComplete = true;
          })
        }
      });
  }
}
