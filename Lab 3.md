## Objective
In this lab, you’ll be enabling the replenishment capability of Alexa and asynchronous updates for your smart home skill. To do this, you’ll be going through the following sections: 

- Create a DART device
- Enable skill to receive Asynchronous updates
- Update the backend code
- Update your IoT device to Trigger Asynchronous Updates
- Enable CloudWatch to Send Inventory Information
- Test your solution

## Lab Scope Architeture

![image](https://user-images.githubusercontent.com/83840078/167222161-83b266db-b867-412f-966d-347bdad0323f.png)
 
## Lab Details

#### Create a DART device

In this section, we’ll setup a DART device using the DRS console. You can configure your DART device to have multiple slots, a slot is a consumable that your device can replenish. You can configure the marketplaces in which the replenishment functionality will be offered and what ASINs can your device replenish. 

1.	Open the [Amazon Dash Replenishment Developer Console](https://developer.amazon.com/dash-services/console/drs/home.html) and click the **Begin** button.
2.	Choose **Create A Device**

![image](https://user-images.githubusercontent.com/83840078/167222242-d4314a95-250a-4225-8118-ab8d285d838c.png)
 
3.	Give your device a name and a model ID and click **Save**. You can also use **Generate New ID** to generate the model ID automatically.
 
 ![image](https://user-images.githubusercontent.com/83840078/167222274-591ed087-0857-4f90-b035-6bf4705118d2.png)

4. Update your device settings:
   - Add or delete marketplaces. We need at least one marketplace.
   - Update your device name which your customers can use to identify the device when they get the low supply notification
   - Update your slot name which your customers can use to identify the consumable type. For e.g. Battery
   - Update the list of ASINs which your device will replenish

![image](https://user-images.githubusercontent.com/83840078/167222318-7331212a-6299-4cd7-92d0-0a4618ac8ad2.png)
 
Once done, you’ll need to contact the Solutions Architect you’re working with to get the replenishment ID. For this lab, we have already created a device with the following settings:
| Parameter | Value
| --- | ---
| Marketplace | US
| Device Name | Smart Light
| Slot Name | Battery
| ASIN | B00NTCHCU2 (Amazon Basics 20-count AAA Battery)

Replenishment ID for this slot is `arn:alexa:smarthome:drs:sensor:4fbc3d24-a7f8-4c6c-aadf-09ab99344c84`. Make a note of this, we’ll use it in the next section.

#### Enable Skill to Receive Asynchronous Updates

For your backend to be able to send asynchronous updates, your backend needs access token from Alexa to uniquely identify the user. For this purpose, when asynchronous events are enabled, during skill enablement, Alexa sends an an AccessGrant directive. This directive contains an Authorization code. Your backend will use this authorization code to receive access/refresh tokens and use them later while sending asynchronous updates.

1.	Open the [Alexa Developer console](https://developer.amazon.com/alexa/console/ask) and then click on your smart home skill.
2.	From the menu option in the left, select **Permissions** and enable **Send Alexa Events**

![image](https://user-images.githubusercontent.com/83840078/167222522-cc06ff72-fbca-41c3-87bc-290dffb17f68.png)

3.	Make a note of the **Alexa Client Id** and **Alexa Client Secret**, we’ll need it in the next section

#### Update the Backend Code

In this section, we are updating the lambda functions to trigger asynchronous updates – AddOrUpdate Report (when a new device is added), Change Report (when state of the device is changed) and Delete Report (when the device is deleted).

1.	Open the [AWS Lambda Console](https://console.aws.amazon.com/lambda/home) and select syncUpdates function
2.	Click on **Configuration**, select **Environment variables** and then click **Edit**

![image](https://user-images.githubusercontent.com/83840078/167222873-28fb27db-797b-4b19-97c8-c327ca3bccb2.png)

3.	Update the **CLIENT_ID_LWA** with the Alexa Client ID from the previous section.
4.	Update the **SECRET_KEY_LWA** with the Alexa Secret Key from the previous section and click **Save**
 
![image](https://user-images.githubusercontent.com/83840078/167222812-c093dfd3-eac3-42ab-b371-c9a3988af3ea.png)

5.	Go back to the lambda console and select **smartHomeSkill** function
6.	Click on **Configuration**, select **Environment variables** and then click **Edit**
7.	Update the **DASH_REPLENISHMENT** as `ENABLED` and **REPLENISHMENT_ID** with the replenishment id provided in the previous section

![image](https://user-images.githubusercontent.com/83840078/167222881-cd419d53-9304-490f-b050-df9fed4b0707.png)

8.	Go back to the lambda console and select **asyncUpdates** function. 
9.	Update the **DASH_REPLENISHMENT**, **REPLENISHMENT_ID**, **CLIENT_ID_LWA** and **SECRET_KEY_LWA**, same as step 3, 4 and 5 and click **Save**
10.	Select **Code** and double click on index.js and then delete the code in index.js.
11.	Copy the code from index.js file in the asyncUpdates folder of the SmartHomeDemo directory and paste it in the code section of the lambda function
12.	Click **Deploy** to save and deploy the code

#### Update your IoT Device to Trigger Asynchronous Updates

In this section, we’ll be creating a Rule on IoT Shadow to trigger asyncUpdates lambda function whenever there is an update in the device’s reported value.

1.	Sign in to the [AWS IoT console](https://console.aws.amazon.com/iot/home). Choose **Act** and then **Rules** from the navigation pane on the left-hand side.
 
 ![image](https://user-images.githubusercontent.com/83840078/167223092-c373ee55-e6a9-4db5-9e24-cc19cc319b10.png)

2.	Click **Create a rule**.
3.	Give your rule a name and update **Rule Query Statement** with the following value `SELECT *, topic(3) as thingName FROM '$aws/things/{thingname}/shadow/update/accepted'`, remember to update `{thingname}` with your thing’s name (case sensitive)
4.	In **Set on or more actions**, choose **Add action**

![image](https://user-images.githubusercontent.com/83840078/167223195-2f3cffde-c096-44a5-ba05-0d8e13de738d.png)

5.	Select **Send a message to Lambda function** and click **Configure action**
 
 ![image](https://user-images.githubusercontent.com/83840078/167223215-60ba15ee-d5c5-4d20-b219-1dba28140b49.png)

6.	From the dropdown, select **asyncUpdates** function and choose **Add action**.

![image](https://user-images.githubusercontent.com/83840078/167223230-304ecff9-1a9b-4be4-883b-8426b0ea43b5.png)
 
7.	Click **Create Rule** at the bottom of the screen.

#### Enable CloudWatch to Send Inventory Information

For the InventoryLevel sensor capability, we need to send data at least once per 24 hours. In this section, we’ll be creating a CloudWatch event to trigger the lambda function once every 24 hours to send inventory level data to the Alexa backend. 

1.	Open [Amazon Cloudwatch console](https://console.aws.amazon.com/cloudwatch/home), in the navigation pane choose Rules and then select Create rule
 
 ![image](https://user-images.githubusercontent.com/83840078/167223284-b321850e-b78b-4dcc-af5f-e7c2888da8b4.png)

2.	In the **Event Source**, select **Schedule** and update **Fixed rate** of as 1 and selection and unit as **Days**

![image](https://user-images.githubusercontent.com/83840078/167223316-8ae3d5bc-c96d-4999-a5df-e32a96bcf39a.png)
 
3.	In the Targets, choose **Add target**, select **Lambda function** from the drop down and select **asyncUpdates** as the function
4.	Click on **Configure Details** and give your rule a name
5.	Keep the **state** as **Enabled** and choose **Create rule**


## Test your Solution

Remember as discussed in earlier section, for sending asynchronous updates, your backend will need an Authorization Code from Alexa (received with AccessGrant directive) to exchange it for Access/Refresh tokens. This authorization code is only sent when the skill is enabled. So, to be able to test this functionality, we’ll have to disable the skill and re-enable it.

#### Testing Using Alexa Website and Amazon Developer Console

1.	Open https://amazon.alexa.com and from the menu, choose Skills and then Your Skills

![image](https://user-images.githubusercontent.com/83840078/167223414-fdefede5-6172-4ecd-9dca-bb43d04016e1.png)

2.	Choose Dev and then on your skill name
 
 ![image](https://user-images.githubusercontent.com/83840078/167223427-79d89eb2-5de0-4216-9ad2-532a5439778d.png)

3.	Select DISABLE SKILL and then enable skill once again by clicking ENABLE and logging in with your web app account
> Note: Once the skill is enabled, an AccessGrant directive with an Authorization Code will be sent to your backend. Your backend will exchange it for access and refresh tokens.

4.	Login to [Amazon Alexa Skill console](https://developer.amazon.com/alexa/console/ask), then select your skill and click on Test tab at the top

![image](https://user-images.githubusercontent.com/83840078/167223500-c9bf6023-05d7-415d-b659-1522c938388d.png)
 
5.	Select checkbox Device Log and scroll down to enable Smart Home Debugger 

![image](https://user-images.githubusercontent.com/83840078/167223505-927bfda8-b33b-42ca-b9f0-e55a043bba17.png)
 
6.	Scroll down to the bottom of the page, you should see 3 events

![image](https://user-images.githubusercontent.com/83840078/167223538-c77e5325-c6eb-4a39-9073-651f0588e251.png)
 
7.	Now, go back to your web app, power ON the device. Once the device is switched ON, it’ll decrement the battery life by 1% every 10s.
> Note: Ensure the IoT device simulation is running. If not running then navigate to your things directory in the command prompt and type `node index.js`. This will re-initialize the device’s name and battery level.

8.	Now, come back to the Alexa skill testing page, on step 7, you should see the asynchronous updates your backend is sending will start appearing.

![image](https://user-images.githubusercontent.com/83840078/167223579-65609ef3-15b5-4391-9bdd-7f4ebadb4423.png)

#### Alexa app
1.	If you haven’t followed the step for disabling and re-enabling the skill in the previous section, then go to your skills and disable the skill
2.	Once done, select Devices and choose Lights
3.	Click on your device and power it ON
4.	Click on Settings on top right corner. You’ll see the Supply section will appear. This is an entry point for managing the replenishment settings
5.	Click on CHANGE link in the supply section
6.	It’ll open the device supply settings page, where you’ll be able to view the current reorder settings and current levels and supplies.
7.	Click on Reorder settings to enroll in auto re-order or turn off notifications
8.	Click on Current levels and supplies to add any household inventory

## Summary & Next steps

Congratulations! You’ve enabled the replenishment capability for your device and also enabled asynchronous updates.

In the next lab, we’ll enable app-to-app account linking – you no longer have to go to the Alexa app or website to enable the skill. You’ll be able to enable the skill from within your web app.

[Lab 4: App-to-app account linking](Lab%204.md)