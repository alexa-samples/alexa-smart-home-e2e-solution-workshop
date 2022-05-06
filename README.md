## My Project

In this wokrshop, we’ll create an Alexa smart home end-to-end solution starting from a smart device to controlling it using voice and enabling smart replenishment via Alexa. This solution uses AWS CloudFormation (an easy way to set up AWS services) for setting up both the front end (a web app using AWS Amplify) and the backend infrastructure (AWS IOT for device management, Cognito for authentication, Lambda for compute and DynamoDB for tokens storage) and Alexa smart home skill to enable voice and replenishment capabilities.

## Architecture

Below diagram provides a high-level architecture of the complete solution.

![image](https://user-images.githubusercontent.com/83840078/167206598-b9baebb2-bf07-460e-b332-b30fb5ab3450.png)

This workshop is divided in four labs, as follows:

**Lab 1:** we’ll use Cloud Formation to setup a simulated device, frontend (web app) and the backend infrastructure. The backend infrastructure constitutes of Cognito for user management and authentication; API gateway to provide a secure HTTP API endpoint for retrieving user or device’s data; lambda functions for compute and DynamoDB for token storage. 

**Lab 2:** we’ll create a smart home skill to control the simulated device using Alexa. For the smart home skill, we’ll implement account linking and update the backend code to respond to Alexa directives.

**Lab 3:** we’ll enable the replenishment functionality. For this, we’ll create a dash replenishment device and enable asynchronous updates to proactively notify Alexa about inventory updates.

**Lab 4:** we’ll enable app-to-app account linking. Using this, users will be able to enable or disable skill and discover or delete devices from your web app. 

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the Amazon Software License.

