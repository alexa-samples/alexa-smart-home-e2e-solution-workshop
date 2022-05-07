// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { InjectionToken, NgModule } from '@angular/core';
import { Routes, RouterModule, ActivatedRouteSnapshot } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { ReplenishmentComponent } from './replenishment/replenishment.component';
import { DeviceDetailsComponent } from './device-details/device-details.component';
import { AuthGuard } from './auth.guard';
import { AddDeviceComponent } from './add-device/add-device.component';
import { NotFoundComponent } from './not-found/not-found.component'

const externalUrlProvider = new InjectionToken('externalUrlRedirectResolver');

const routes: Routes = [
//  { path: '', redirectTo: '/home', pathMatch: 'full'},
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard]},
  { path: 'replenishment', component: ReplenishmentComponent, canActivate: [AuthGuard] },
  { path: 'device/:id', component: DeviceDetailsComponent, canActivate: [AuthGuard]},
  { path: 'device', component: DeviceDetailsComponent, canActivate: [AuthGuard]},
  { path: 'addDevice', component: AddDeviceComponent, canActivate: [AuthGuard]},
  { path: 'externalRedirect', component: NotFoundComponent, canActivate: [externalUrlProvider]},
//  { path: '*', component: NotFoundComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    {
      provide: externalUrlProvider,
      useValue: (route: ActivatedRouteSnapshot) => {
        const externalUrl = route.paramMap.get('externalUrl');
        window.open(externalUrl, '_self');
      }
    }
  ]
})
export class AppRoutingModule { }
