# react-s3-cdk

command `npm run build && cdk deploy` from infra folder.

command `npm run build && aws s3 cp build s3://<bucket-name>/` from client folder.

Then the client app will be automatically updated and deployed to the S3 bucket and can be accessible from the endpoint when you push on the main branch.
