import * as cdk from 'aws-cdk-lib';
import {
  aws_s3 as s3,
  aws_cloudfront as cloudfront
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    const bucket = new s3.Bucket(this, 'GeotaskLandingPageBucket', {
      bucketName: 'geotask-landing-page',
      websiteIndexDocument: 'index.html',
    });

    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, 'GeotaskLandingPageOAI', {
      comment: 'Origin Access Identity for Geotask Landing Page',
    });

    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'GeotaskLandingPageDistribution', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: bucket,
            originAccessIdentity: cloudfrontOAI,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
    });
  
    bucket.grantRead(cloudfrontOAI.grantPrincipal);
}}
