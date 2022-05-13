// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AmplifyUIAngularModule } from '@aws-amplify/ui-angular';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HttpClientModule }    from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { AmplifyService } from 'aws-amplify-angular';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { DeviceDetailsComponent } from './device-details/device-details.component';
import { ReplenishmentComponent } from './replenishment/replenishment.component';
import { ManageUserService } from './manage-user.service';
import { AddDeviceComponent } from './add-device/add-device.component';
import { NotFoundComponent } from './not-found/not-found.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    DeviceDetailsComponent,
    ReplenishmentComponent,
    AddDeviceComponent,
    NotFoundComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AmplifyUIAngularModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatSlideToggleModule,
    FontAwesomeModule,
    FormsModule,
    HttpClientModule,
    MatProgressSpinnerModule
  ],
  providers: [
    AmplifyService,
    ManageUserService
  ],
  exports: [
    MatSlideToggleModule,
    MatProgressSpinnerModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
