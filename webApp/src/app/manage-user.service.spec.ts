// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { TestBed } from '@angular/core/testing';

import { ManageUserService } from './manage-user.service';

describe('ManageUserService', () => {
  let service: ManageUserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ManageUserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
