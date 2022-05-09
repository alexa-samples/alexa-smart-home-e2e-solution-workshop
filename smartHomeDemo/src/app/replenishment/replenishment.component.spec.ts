// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReplenishmentComponent } from './replenishment.component';

describe('ReplenishmentComponent', () => {
  let component: ReplenishmentComponent;
  let fixture: ComponentFixture<ReplenishmentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReplenishmentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReplenishmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
