## Objective

In this lab, you’ll be setting up a virtual device, web app and the backend infrastructure. To do the setup, we'll use the CloudFormation to setup all the AWS services (Amplify, API Gateway, Cognito, DynamoDB, Lambda, CloudWatch & IAM) automatically. 

## Lab Scope Architecture

![image](https://user-images.githubusercontent.com/83840078/167214929-05c96196-4afa-45dc-906b-1ff95d20e1e9.png)

## Lab Details

#### Setup the Backend Infrastructure

In this section, we’ll use AWS CloudFormation service to setup all the services in the backend. To configure the services, we’ll use a template file available in the S3 bucket.
1.	In the [AWS CloudFormation console](https://console.aws.amazon.com/cloudformation/home) and ensure on the top right corner, the region is selected as **N.Virginia (us-east-1)** 
 
 ![image](https://user-images.githubusercontent.com/83840078/167215069-c767c496-66cf-456b-9c8f-46851b590312.png)

2.	Click on the **Create stack** button and select **With new resources (standard)**
3.	Keep all the settings as is and in the **Amazon S3 URL**, paste the following URL https://test-ref-implementation-smart-home-solution.s3.amazonaws.com/cfn-templates/Root.yaml and click **Next**
4.	Enter a stack name of your choice
5.	Enter the following parameters:

| Parameter | Description | Recommended value
| --- | --- | ---
| DeviceName | Name for your simulated device | smartLight
| DeviceSerialNumber | Serial number for your simulated device | myDevice001	
| GithubRepo | URL for the web app github repo | [Git Repository URL](pre-requisites.md#create-a-web-app-repository)
| GitHubToken | Github access token | [GitHub Token](pre-requisites.md#generate-github-access-token)	
| MQTT Endpoint | AWS IoT MQTT endpoint | [MQTT Endpoint](pre-requisites.md#install-aws-cli)	
| environment |	Your webapp environment name | dev

6.	Click **Next**
7.	Scroll down and click **Next**
8.	Scroll to the bottom and **select the checkboxes** to provide CloudFormation access to create resources on your behalf and click on the **Create Stack button**.

>Note: CloudFormation will now use AWS Amplify to create the web app from the Github URL you provided, AWS Cognito to setup authentication, API gateway to create an API endpoint for your web app / Alexa Smart Home skill to access your backend resources, AWS Lambda functions to create a serverless backend infrastructure and DynamoDB for token storage. This complete setup will take a few minutes.

9.	You can refresh the page to see the progress. Once all the resources are created (it’ll take about 3 minutes), you’ll see a message like below:
 
![image](https://user-images.githubusercontent.com/83840078/167216016-f244f957-0d7f-440f-bbc5-b81b5b9c3b13.png)

10.	Navigate to the Outputs tab and make a note of these parameters. We’ll need these in the next section and labs 2-4.

![image](https://user-images.githubusercontent.com/83840078/167216038-5dc85e55-e83e-4321-99e2-9c7e36856a12.png)

#### Setup a Virtual device

###### Create Device Certificate

In this section, we’ll create a device certificate for the virtual device to be able to communicate with the Shadow topic in the AWS IoT cloud.

1. In the [AWS IoT console](https://console.aws.amazon.com/iot), in the navigation pane, choose **Manage**, and then choose **Things**
2. Click on the thing name which got created in the previous section. 
3. Under the Attributes tab, you'll see the DeviceSerialNumber you provided in the previous is assigned to the serialNumber attribute of the thing.
4. Click on **Certifcates** tab and then select **Create certificate**.
5. Click on **Activate certificate** to activate the certificate.
6. Click on **Download** button in front of Device Certitificate, Publick key file, private key file and Root CA certificate (Amaxon Root CA 1)
> Note: This is the only time you can download the key files, so remember to download all of these files at this time.
7. Store all of these files - certificate, key files (both public and private) and Root CA certificate in the thing folder (downloaded in the pre-requisites lab).
8. Click on the certificate name and select **Attach policies**
9. You should see a policy <thingName>-Policy-<env>, select the policy and click on **Attach policies**

###### Update the Virtual Device

In this section, we’ll update the virtual device code to refer to use the certificates created in previous section.

1.	Navigate to the Thing directory downloaded in the Pre-requisites lab
2.	Open index.js with a text editor of your choice
3.	Update the following code from line 10 to 16 with the following values:
- **keypath** – name of your private key file downloaded while creating the device
- **certPath** – name of your cert file downloaded while creating the device
- **clientID** – a value of your choice
- **host** – MQTT endpoint

```
var thingShadows = awsIot.thingShadow({
   keyPath: "./certs/xxxxxxxxxx-private.pem.key",
   // Some browser might convert this file into a text document. In such cases, add .txt at the end of the cert path
   certPath: "./certs/xxxxxxxxxx-certificate.pem.crt.txt",
   caPath: "./certs/AmazonRootCA1.pem",
   clientId: "xxxxxxxxxx",
   host: "xxxxxxxxxx-ats.iot.xxxxxxxxxx.amazonaws.com"
});
```

4.	Final code should look something like below:
```
var thingShadows = awsIot.thingShadow({
  keyPath: "./certs/c3cb1ce16f-private.pem.key",
  // Mac users - please remove the .txt at the end of the cert path
  certPath: "./certs/c3cb1ce16f-certificate.pem.crt.txt",
  caPath: "./certs/AmazonRootCA1.pem",
  clientId: "SmartLight",
  host: "xxxxxxxxxx-ats.iot.us-east-1.amazonaws.com"
```

5.	Update the `thingname` on line 25 with the Thing Name value from the Key Parameters.xlsx file

`var thingName = ‘xxxxxxxxxxxxx’;`


6.	Hit save and close the file.

#### Build the Web App

In this section, we’ll update and build the web app using the values obtained from the previous section. Once the build is finished, we’ll be able to access the web app using the WebAppURL available in the CloudFormation’s Output window. 

1.	Navigate to the repository which you cloned.
2.	Navigate to the src folder and then select aws-params.js
3.	Edit this file to update the following parameters:

| Parameter name | Values 
| --- | ---
| `aws_cloud_logic_custom.endpoint` |	API Gateway Enpoint (CloudFormation Output Window)
| `aws_user_pools_id` |	Cognito User Pool ID (CloudFormation Output Window)
| `aws_user_pools_web_client_id` | Cognito Web Client ID (CloudFormation Output Window)

We’ll update the app_linking parameters in lab 5.

4.	Once done, scroll down and click on **Commit Changes** button to apply the changes
5.	Open the [AWS Amplify console](https://console.aws.amazon.com/amplify/home), select your web app and click on **Run Build**.
6.	This will start building the web app. It should take approx. three minutes. Once your WebApp is successfully built and deployed, it’ll be available via the web app URL (available in CloudFormation output window). You can also access the link from the Amplify console by clicking on the URL shown on the deployment page. 

![image](https://user-images.githubusercontent.com/83840078/167218353-17cc9128-5dcf-46e6-914d-dd2e5c548d57.png)

## Test the Solution

#### Test the Virtual Device

1.	Open command prompt and navigate to the Thing directory downloaded in the Pre-requisites lab.
2.	Type the following command: `node index.js`
 
![image](https://user-images.githubusercontent.com/83840078/167218473-947a6b0a-0fe0-4961-b942-4dc9b911fd35.png)

This will start your virtual device and you should see a message as per the snapshot above indicating that the data submitted got successfully accepted.
3.	In the [AWS IoT console](https://console.aws.amazon.com/iot), in the navigation pane, choose **Manage**, and then choose **Things**
4.	Click on the thing you created and in the navigation pane, choose **Device Shadows**, and then click on **Classic Shadow**
5.	You should see the Shadow State document with the following information 

![image](https://user-images.githubusercontent.com/83840078/167218577-8c1e683c-ff9e-4eaa-910f-97ef62428c68.png)

#### Test the Web App

1.	Use the URL to open your web app
2.	Login window should appear automatically, if it doesn’t then click on **Login** link and **Create user** account
3.	Verify your account by entering the password sent to your email
4.	Once logged in, click on **Manage Devices** and select **Add a device**
5.	Enter the serial number of the device which you assigned while creating your thing and provide a name you want to refer it with.

> Note: Ensure that the device simulation is running. If not, then open command prompt and navigate to Things directory and type in the following command: `node index.js`

6.	Click **Submit** 
7.	You’ll get a message that the device is successfully created.
8.	The device should now appear in the navigation pane on the left-hand side. You can click on it to view or control the device settings.
9.	If you have the simulated device running in the command line, you’ll see the device power status will get updated as per the controls in the web app. 
10.	If the device is powered ON, the battery value will decrement by 1% every 10s.

 
## Summary & Next steps

Congratulations! You’ve now created a simulated device and a web app to register and control the device (very cool!). 

In the next lab, we’ll set up a Smart Home skill and modify components (AWS Cognito) of this lab to implement account linking and update the backend code (syncUpdates lambda function) to control the device using Alexa.

[Lab 2: Setup Smart Home Skill](Lab%202.md)
