// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { ManageUserService } from './manage-user.service';
import { Auth } from 'aws-amplify';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean> {
      return new Promise ((resolve) => {
        Auth.currentAuthenticatedUser({bypassCache: false})
        .then ((user) => {
        if (user) { 
          return resolve (true); 
          }
        })
        .catch (() => {
          this.router.navigate(['/login']);
          return resolve (false);
        });
    })
  }
  
  constructor (
    private manageUser: ManageUserService,
    private router: Router
  ) {}
}