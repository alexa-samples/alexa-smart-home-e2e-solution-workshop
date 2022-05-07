// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ManageUserService } from '../manage-user.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-add-device',
  templateUrl: './add-device.component.html',
  styleUrls: ['./add-device.component.css']
})
export class AddDeviceComponent implements OnInit {
  addDeviceForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    public manageService: ManageUserService,
    private router: Router
  ) { 
    this.addDeviceForm = this.formBuilder.group ({
      serialNumber: '', 
      name: ''
    });
  }

  ngOnInit(): void {

  }

  onSubmit() {
    let name = this.addDeviceForm.get('name').value;
    let serialNumber = this.addDeviceForm.get('serialNumber').value;

    console.log(`${name}, ${serialNumber}`);
    this.manageService.addDevice(name, serialNumber)
      .then (submitted => {
       window.alert("Device successfully created");
       this.router.navigate(['/device']);
      })
      .catch (err => {
        console.log(err)
        window.alert("Unable to create the device");
      });
  }
}
