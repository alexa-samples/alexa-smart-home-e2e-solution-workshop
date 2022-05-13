// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { FormFieldTypes } from '@aws-amplify/ui-components';
import { AmplifyService } from 'aws-amplify-angular';
import { ManageUserService } from '../manage-user.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  signUpFormFields: FormFieldTypes;
  signInFormFields: FormFieldTypes;
  signedIn: boolean;

  constructor(
    private amplifyService: AmplifyService,
    private router: Router,
    private ngZone: NgZone,
    public manageUser: ManageUserService
  ) { 
    console.log("Printing in construct");
  }

  ngOnInit(): void {
    console.log("Printing in init");
    this.signInFormFields = [
      { type: "email", label: "E-mail", placeholder: "john.doe@abc.com", required: true,},
      { type: "password", label: "Password", placeholder: "password", required: true,}
    ];

    this.signUpFormFields = [
      { type: "email", label: "E-mail", placeholder: "john.doe@abc.com", required: true, },
      { type: "password", label: "Password", placeholder: "password", required: true,},
      { type: "name", label: "Name", placeholder: "John Doe", required: true,}
    ];

    this.amplifyService.authStateChange$
    .subscribe(authState => {
      console.log(authState);
      if (authState.state === 'signedIn') {
        this.ngZone.run(() => this.router.navigate(['/home'])).then();
      }
    });
  }
}
