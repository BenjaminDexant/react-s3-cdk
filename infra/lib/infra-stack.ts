import * as cdk from 'aws-cdk-lib';
import { aws_s3 as s3, aws_iam as iam } from 'aws-cdk-lib';
import { BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    const bucket = new s3.Bucket(this, 'GeotaskLandingPageBucket', {
      bucketName: 'geotask-landing-page',
      websiteIndexDocument: 'index.html',
      blockPublicAccess: new s3.BlockPublicAccess({ restrictPublicBuckets: false }),
    });
  
    const bucketPolicy = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [`${bucket.bucketArn}/*`],
      principals: [new iam.StarPrincipal()],
    });

    bucket.addToResourcePolicy(bucketPolicy);

}}
