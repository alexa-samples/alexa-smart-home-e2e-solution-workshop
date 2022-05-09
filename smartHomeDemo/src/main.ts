// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import Amplify from 'aws-amplify';
import awsparams from './aws-params';

Amplify.configure(awsparams);

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
