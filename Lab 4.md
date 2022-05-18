## Objective

In this lab, we’ll be enabling app-to-app account linking. This will allow us to enable and disable your skill from within your web app. To do this, we’ll go through the following sections: 

-	Update the web app code
-	Update the backend code
-	Update the Alexa Skill
-	Update the Cognito User Pool
-	Test your solution

## Lab Details

#### Update your web app

In this section, we’ll update the web app with the parameters needed for app-to-app account linking.
1.	Navigate to your web app repository which you created in the prerequisite lab.
2.	Click on the **src** folder and then select **aws-params.js** file

![image](https://user-images.githubusercontent.com/83840078/167223796-866048de-4274-42b0-abe1-be46263da24f.png)
 
3.	Click on the edit pen icon on the top right corner of the file. We’ll be modifying the parameters in the app_linking object.
 
 ![image](https://user-images.githubusercontent.com/83840078/167223814-82e39c9d-9437-408a-8a9b-8226ccf452db.png)

4.	Update the following parameters with the following values from the Key Parameters.xlsx file:

| aws-params.js	| Values
| --- | ---
| app_linking.COGNITO_URL |	Value for Cognito Authorization URL
| app_linking.LWA_CLIENT_ID |	Value for Alexa LWA Client ID
| app_linking.COGNITO_CLIENT_ID |	Value for Cognito Alexa App Client ID
| app_linking.REDIRECT_URI | Value for Web app URL

5.	Once done the code should look like below
 
 ![image](https://user-images.githubusercontent.com/83840078/167224037-dcaeda31-84b0-461e-bde2-c95bde240693.png)

6.	Click on **Commit Changes** at the bottom of the screen. 
7.	Log in to [Amplify console](https://console.aws.amazon.com/amplify/home) Click on any of the four stages – Provision, Build, Deploy and Verify and click on **Redeploy this Version**.

![image](https://user-images.githubusercontent.com/83840078/167224112-b12f3e7a-c273-4798-837b-0439fe01ef57.png)

 
#### Update Your Backend Code

In this section, we’re updating the backend code with the skill ID and development stage parameters. These parameters are needed while calling the skill activation API.

1.	Open [AWS Lambda console](https://console.aws.amazon.com/lambda/home), select **asyncUpdates** function and scroll down to **Environment variables **section
 
 ![image](https://user-images.githubusercontent.com/83840078/167224138-01cfc826-80ba-45d3-9248-356f6828a58b.png)

2.	Click **Edit** and use the **Smart Home Skill ID** to update the **SMART_HOME_SKILL_ID** variable
 
 ![image](https://user-images.githubusercontent.com/83840078/167224171-4100b591-ea9c-4ac4-8984-c38556d6abfc.png)

3.	Click **Save**.

#### Update Alexa Skill

In this section, we’ll update the Alexa skill to enable skill enablement from your app or website.

1.	Open the [Amazon Alexa Skill Developer console](https://developer.amazon.com/alexa/console/ask) and click on your skill name
2.	Choose **Account Linking** from the navigation pane on the left and enable **Allow users to link their account to your skill from within your application and website**.
 
 ![image](https://user-images.githubusercontent.com/83840078/167224268-dbefc238-0416-4fe3-b72f-583fc914acbf.png)

3.	You’ll have to again update the Your Secret parameter with the Cognito Alexa App Client Secret value
4.	Scroll down and in front of **Your Redirect URLs**, click on **+ Your Redirect URLs**
5.	Enter your web app URL and click **Save**

#### Update Cognito

In this section, we’ll update Cognito to allow your web app request the authorization code.
1.	Open the [Cognito console](https://console.aws.amazon.com/cognito/users) and click on your user pool
2.	From the navigation pane, select **App client settings** and scroll down to App client **Alexa**
3.	In the call back URL(s), enter your web App URL. Remember to use a , (comma) between two URLs and click **Save**

![image](https://user-images.githubusercontent.com/83840078/167224379-ff731590-ec5d-455c-91a6-40d7e451c921.png)

## Test Your Solution

In this section, we’ll be testing the solution by enabling and disabling skill from within the WebApp.
1.	Ensure from Amplify console that you web app has been successfully deployed.
2.	Open your Web app and click on Services option
3.	Click on Allow to enable the skill. It’ll open your Login With Alexa page, once authenticated, it’ll open your WebApp login page. Once authenticated from both the systems, your skill will be enabled.

## Summary

Congratulations! You’ve developed a complete smart home solution starting from simulating a device to enabling voice control with automatic replenishment. 
