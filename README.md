## My Project

In this wokrshop, we’ll create an end-to-end solution for a smart home device which controlled by voice and features smart replenishment using Alexa. This solution uses AWS CloudFormation (an easy way to set up AWS services) for setting up both the front end (a web app using AWS Amplify) and the backend infrastructure (AWS IoT for device management, Cognito for authentication, Lambda for compute and DynamoDB for token storage) and Alexa Smart Home skill to enable voice and replenishment capabilities.

## Architecture

Below diagram provides a high-level architecture of the complete solution.

![image](https://user-images.githubusercontent.com/83840078/167206598-b9baebb2-bf07-460e-b332-b30fb5ab3450.png)

This workshop is divided in five labs, as follows:

**Lab 0: Pre-requisites**

In this lab, we'll set up different accounts and retrieve parameters required for labs 1-4.

**Lab 1: Setup Device, WebApp and Backend** 

In this lab, we’ll use CloudFormation to setup a simulated device, frontend and the backend infrastructure. The backend infrastructure constitutes of Cognito for user management and authentication; API gateway to provide a secure HTTP API endpoint for retrieving user or device’s data; and lambda functions for compute and DynamoDB for token storage. 

**Lab 2: Setup Smart Home Skill** 

In this lab, we’ll create a Smart Home skill to control the simulated device using Alexa. For the Smart Home skill, we’ll implement account linking and update the lambda code to respond to Alexa directives.

**Lab 3: Replenishment and Proactive State Updates** 

In this lab, we’ll enable the replenishment capability. For this, we’ll create a dash replenishment device and enable proactice updates to proactively report state change and inventory updates to Alexa.

**Lab 4: App-to-app account linking** 

In this lab, we’ll enable app-to-app account linking. Using this, users will be able to enable or disable skill and discover or delete devices from the web app. 

## Next Step:

**[Lab 0: Pre-requisites](Lab%200.md)**

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the Amazon Software License.

