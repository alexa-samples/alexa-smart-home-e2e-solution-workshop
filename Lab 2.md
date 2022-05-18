## Objective

In this lab, we’ll be creating a Smart Home Skill with PowerController capability to control the device using voice. To do this, we’ll be going through the following sections: 

- Create a Smart Home Skill
- Update the backend code
- Setup Account Linking
- Test your skill

## Lab Architecture

![image](https://user-images.githubusercontent.com/83840078/167219414-ab5fb503-79ec-4f5c-b297-432be49760c2.png)
 
## Lab Details

#### Create a Smart Home Skill

In this section, we’ll create a Smart Home Skill using the Alexa developer console. Alexa developer console provides a simple and convenient way to create and configure the skill. Another method is to use ASK CLI, not covered in this tutorial. ASK CLI provides additional options to developers like subscribe to events such as skill enabled, skill disabled etc.

1.	Open the [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask) and click the **Create Skill** button.
2.	Enter the **Skill name**. For this solution, keep the default language as English (US). 
3.	Under **Choose a model to add to your skill** page, select **Smart Home**, which is a pre-built voice interaction model, and click **Create skill**.
4.	Copy **Your Skill ID** to the clipboard. The ID will be in a format similar to the following: `amzn1.ask.skill.xxxxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
5.	Make a note of this skill ID. This will be used in future sections.

#### Update the Backend Code

In this section, we’ll setup the lambda function for the Smart Home Skill and link it with the Smart Home skill. The lambda function will receive directives from Alexa and will respond with actions taken as responses.

1.	Login to [AWS Lambda console](https://console.aws.amazon.com/lambda/home) 
2.	You should see five lambda functions which got created in the previous step. Select **smartHomeSkill** function

![image](https://user-images.githubusercontent.com/83840078/167219771-b3b27848-5018-42a5-aadd-496614da5117.png)

3.	Click on **Add trigger** and select **Alexa Smart Home** from the drop-down menu.
 
![image](https://user-images.githubusercontent.com/83840078/167219852-0c068218-fd21-4185-ad18-056d7a9bfc50.png)

4.	In the **Application ID** text box, paste the skill ID obtained in the previous section and click on the **Add** button

<img width="500" src=https://user-images.githubusercontent.com/83840078/168931810-0c9205d2-37c8-4be7-b6ba-cec1c59190b7.png>
 
5.	Scroll down, select **Code** and double click on index.js

![image](https://user-images.githubusercontent.com/83840078/167219939-d88be852-f86b-460b-b98e-b79f493f66da.png)
 
6.	Replace the code in the lambda function from the index.js file in the smartHomeSkill folder of the lambda directory

![image](https://user-images.githubusercontent.com/83840078/167219987-d4c5831b-6e2b-4592-918c-3ddb8c8ba564.png)
 
7.	Click **Deploy** 
8.	Scroll to the top and click on **Copy ARN** to copy the lambda function ARN

![image](https://user-images.githubusercontent.com/83840078/167220041-17f7f22f-b34c-435d-80f0-899ccecfca31.png)

9.	Go back to the Smart Home Skill window in the Alexa Developer Console and paste this ARN in the **Default endpoint** and click **Save**

#### Setup Account Linking

In this section, we’ll enable account linking. A mechanism where user gives permission to Alexa to control their devices. Once user ia authenticated, your backend will share Access and Refresh tokens for the user with Alexa. Alexa will use these tokens to identify the user and control their devices.

###### Creating an Alexa Client in Cognito

1.	Sign in to the [AWS Cognito console](https://console.aws.amazon.com/cognito). Choose **Manage User Pools** and then select **webAppAuth** pool. This is the user pool which was created for you in Lab 1.
2.	From the **General settings** menu, choose **App clients** to set up applications that will connect to your Amazon Cognito user pool.
3.	Choose **Add another app client**, and provide the App client name. In this example, I have chosen “Alexa.” 
4.	Update the **Refresh token expiration** to 3650 days, maximum allowed time such that refresh token will not expire for approx. 10 years. Leave the rest of the options set to default and choose **Create App Client** to generate the client record for Alexa to use. This process creates an app client ID and a secret.
 
 ![image](https://user-images.githubusercontent.com/83840078/167220407-aa90895d-18fd-49e7-9baa-ccfe6223d5cf.png)

5.	Click on **Show Details** and copy the **App client id** and **App client secret** values and take a note of them.

![image](https://user-images.githubusercontent.com/83840078/167220498-3ebf9267-55fc-4f54-bdab-1f78707542c4.png)
 
6.	From the App integration menu, choose Domain name. 
7.	For this example, let’s use the Amazon Cognito domain. Provide a **subdomain** name and choose **Check Availability**. If the option is available, choose **Save Changes**.

![image](https://user-images.githubusercontent.com/83840078/167220576-4d9fb08e-da70-4afe-96b6-616648333b97.png)

8.	Make a note of this subdomain name and the region value. 

| Parameter | Value 
| --- | ---
| URL |	https://smart-home-demo.auth.us-east-1.amazoncognito.com 
| Subdomain | smart-home-demo
| Region | us-east-1

###### Linking Alexa with Cognito

1.	Navigate to https://developer.amazon.com/mycid.html and note the Vendor ID parameter
2.	Navigate to your smart home skill in the [Alexa Developer console](https://developer.amazon.com/alexa/console/ask)
3.	Click on your smart home skill name and scroll down and click on Setup Account Linking

![image](https://user-images.githubusercontent.com/83840078/167220859-b53254e6-f1fa-4be7-b201-fc4d470552f7.png)

4. Your Web Authorization URL will be of the following format (constructed URL – Web Authorization URL – is available in Key Parameters.xlsx file):

`https://{Subdomain}.auth.{Region}.amazoncognito.com/oauth2/authorize?response_type=code&redirect_uri=https://pitangui.amazon.com/api/skill/link/{Vendor ID}`
   - Replace {Subdomain} and {Region} with the values we noted earlier
   - Replace {Vendor ID} with your specific vendor ID for your Alexa development account. The vendor ID is also available the bottom of the account linking page. Your Vendor ID will be the last item in the Redirect URI’s path.

5. The Access Token URI will be made up of the following template (constructed URL – Access Token URI – is available in Key Parameters.xlsx file): `https://{Subdomain}.auth.{region}.amazoncognito.com/oauth2/token`

   - Replace {Subdomain} and {Region} with the values we noted earlier

6. Enter the **Cognito Alexa App Client ID** and the **Cognito Alexa App Client Secret** values from the previous section for **Your Client ID** and **Your Secret** parameters in the Alexa developer console.
7. Click on **Add scope** and enter `profile`

![image](https://user-images.githubusercontent.com/83840078/167221324-e20cd88d-c81e-40a9-9282-ff75aae96380.png)

8.	Choose **Save** at the top of the page. Make a note of the **redirect URLs** at the bottom of the page, as these will be required to finish the Amazon Cognito configuration. 
9.	Switch back to your Amazon Cognito user pool. Under **App Integration**, choose **App Client Settings**. You will see the integration settings for the **Alexa** client in the details panel on the right. 
> Remember to select the Alexa client

10.	Under **Enabled Identity Providers**, select **Cognito User Pool**. 
11.	Under **Callback URL(s)** enter in the three callback URLs from your Alexa skill page. For example, here are all three URLs separated by commas:
```
https://alexa.amazon.co.jp/api/skill/link/{Vendor ID}, https://layla.amazon.com/api/skill/link/{Vendor ID},
https://pitangui.amazon.com/api/skill/link/{Vendor ID}
```

12.	The **signout URL** will follow the following template: `https://{Subdomain}.auth.{region}.amazoncognito.com/logout?response_type=code`
    - Replace Subdomain and region value with what you noted earlier.
13.	Under **Allowed OAuth Flows**, select **Authorization code grant**. 
14.	Under **Allowed OAuth Scopes**, select all the scopes.

![image](https://user-images.githubusercontent.com/83840078/167221460-993b300f-5bf2-4711-93b2-189e6a2c16c2.png)
 
15.	Click on **Save** changes.

#### Update the Backend Code

1.	Login to [AWS Lambda console](https://console.aws.amazon.com/lambda/home) 
2.	You should see five lambda functions which got created in the previous lab. Select **syncUpdates** function and scroll down to the Function code section.

![image](https://user-images.githubusercontent.com/83840078/167221527-8e8421bd-cdbb-4e60-a175-41c13f946a26.png)

3.	Delete the code in the **code** section of the lambda function
4.	**Copy** the code from index.js file in the syncUpdates folder of the lambda directory and paste it in the function code of the lambda function
5.	Click **Deploy** to save and deploy the code.


## Test the Smart Home Skill

#### Testing using Alexa website
1.	Open the Alexa website using the account you used to design your skill: https://alexa.amazon.com  
> Note: If you don’t have an Echo device setup in your account, then you’ll have to login first with the Alexa app on your phone.
2.	From the menu, choose Skills and then Your Skills

![image](https://user-images.githubusercontent.com/83840078/167221649-502b90bd-75c0-4e79-a6fa-e559a3747088.png)

3.	Choose **Dev** and then on your skill name

![image](https://user-images.githubusercontent.com/83840078/167221665-c03a5965-786a-42ea-858f-854045abe12e.png)

4.	Select **ENABLE** 
5.	Login with your account which you created while logging in to your web app.
6.	You should get a message your skill has been successfully linked. 
7.	Click Done and then select Discover Devices. It’ll trigger the discovery flow and Alexa backend will send a Discovery Directive to your skill. Your skill will forward this to your backend to get a list of devices and send the Discovery Response to Alexa.
8.	From the navigation pane on the left, choose Smart Home and then Devices. The device will show up in the list of smart devices. You can’t control the devices from the Alexa website. To control it you’ll have to use the Alexa app or an Echo device.

#### Testing using Alexa App
1.	Open the Alexa app while logging in with your developer account
2.	Click on the Hamburger icon on top left and select Skills & Games

![image](https://user-images.githubusercontent.com/83840078/167221706-619eef55-89a7-4005-81e3-04e70fa6463a.png)     ![image](https://user-images.githubusercontent.com/83840078/167221728-2e9fc2ba-7067-4f56-9bda-44506c8f0630.png)

3.	Select Your Skills and then choose **Dev**
4.	Click on your skill and select ENABLE TO USE and log in with your web app account to complete account linking

![image](https://user-images.githubusercontent.com/83840078/167221763-b720979c-9340-4105-a824-3fb823279afc.png)     ![image](https://user-images.githubusercontent.com/83840078/167221778-b06d3a79-ca3f-4ff2-821e-f4e94edb7241.png)
 	 
5.	Once enabled, click Discover Devices to trigger the discovery flow

![image](https://user-images.githubusercontent.com/83840078/167221798-375e94cc-6c6f-4b3e-90a5-c4ee23f95e89.png)     ![image](https://user-images.githubusercontent.com/83840078/167221814-1931e534-874e-4dec-b5e4-99e10c02408b.png)
 	 
6.	The device will get discovered as a Light because the Display category for the Device has been set as LIGHT.
7.	Click on the device and it should show you the latest device status. To get the device status, Alexa sends a ReportState directive to your skill and it responds back with StateReport response
 
 ![image](https://user-images.githubusercontent.com/83840078/167221829-0f7164ca-71c9-41b4-8c77-932d66fea2d6.png)

8.	Click ON or OFF to control the device. To control the device, Alexa sends a PowerController directive with the desired device state and your skill responds back to Alexa with the PowerController response with the updated device state.

> Note: This kind of directive and response is referred to as Synchronous Response. To see more details about different type of responses supported by Alexa, click [here](https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-response.html).

## Summary

Congratulations! You’ve successfully added voice capability to your device by creating a Smart Home Skill and linking it with your backend infrastructure. 

In the next lab, we’ll enable the replenishment capability of Alexa to provide low supply notification to users when they’re running low on battery. We’ll enable asynchronous updates, a mechanism of reporting latest status to Alexa. It is a requirement for the replenishment functionality and also provides better CX as Alexa will always have the most up-to-date device status.

[Lab 3: Replenishment and Proactive State Updates](Lab%203.md)
