// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ManageUserService } from '../manage-user.service';
import { faEdit, faTrashAlt, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { FormBuilder, FormGroup } from '@angular/forms';
import {MatSlideToggleChange} from '@angular/material/slide-toggle';

@Component({
  selector: 'app-device-details',
  templateUrl: './device-details.component.html',
  styleUrls: ['./device-details.component.css']
})

export class DeviceDetailsComponent implements OnInit {
  device: any;
  routeID: any;
  editable: boolean = true;
  @Input() checked: boolean;
  @Input() name: string;
  pageLoadingComplete: boolean = false;

  editIcon = faEdit;
  delIcon = faTrashAlt;
  check = faCheckCircle;
  cancel = faTimesCircle;
  inputControl: string = "inherit";

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private router: Router,
    private manageUser: ManageUserService
  ) {
    console.log("inside constructor");
  }
  

  ngOnInit(): void {
    console.log("inside init");
    this.manageUser.getUser();
    this.manageUser.getDevices();
    this.routeID = this.route.snapshot.paramMap.get("id");
    if (this.routeID) {
      this.getDevice();
    } else {
      this.pageLoadingComplete = true;
    }
  }

  getDevice() {
    this.pageLoadingComplete = false;
    this.manageUser.getDevice(this.routeID)
    .then ((data) => {
      this.pageLoadingComplete = true;
      this.device = this.manageUser.device;
      this.checked = this.device.status === "on" ? true : false;
      this.name = this.device.friendlyName;
    })
    .catch ((e) => {
      this.pageLoadingComplete = true;
      this.router.navigate(['/device']);
    })
  }

  onRemove() {
    let feedback = window.confirm("Do you want to delete this device");
    if (feedback === true) {
      this.pageLoadingComplete = false;
      this.manageUser.removeDevice()
      .then (data => {
        if (data) {
          this.pageLoadingComplete = true;
          this.device = undefined;
          this.router.navigate(['/home']);
        }
      })
      .catch (err => {
        console.log(err);
        this.pageLoadingComplete = true;
        window.alert("Unable to delete the device");
      });
    }
  }

  onEdit() {
    if  (this.editable) {
      this.editable = false;
      this.inputControl = "white";
    } else {
      this.editable = true;
      this.inputControl = "inherit";
    }
  }

  onStatusChange() {
    let devStatus = this.checked ? "on" : "off";
    console.log(this.checked);

    this.manageUser.updateStatus(devStatus)
    .then ((data) => {
      this.router.navigate([`/device/${this.manageUser.device.serialNumber}`]);
    })
    .catch (e => {
      window.alert("Unable to update the device parameter");
      this.checked = this.device.status === "on"?true:false;
    });
  }

  onValueChange() {
    this.editable = true;
    this.inputControl = "inherit";
    let friendlyName = this.name;
    this.manageUser.updateDevice(friendlyName)
    .then ((data) => {
      this.router.navigate([`/device/${this.manageUser.device.serialNumber}`]);
    })
    .catch (e => {
      window.alert("Unable to update the device parameter")
      this.name = this.device.friendlyName;
    });
 
  }

}
