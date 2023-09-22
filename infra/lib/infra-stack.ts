import * as cdk from 'aws-cdk-lib';
import {
  aws_certificatemanager as acm,
  aws_s3 as s3,
  aws_s3_deployment as s3deploy,
  aws_iam as iam,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_route53 as r53,
  aws_route53_targets as targets,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface StaticSiteProps extends cdk.StackProps {
  domainName: string;
  subDomainName: string;
  certificateArn: string;
}

export class StaticSite extends Construct {
  constructor(scope: Construct, name: string, props: StaticSiteProps) {
    super(scope, name);
    
    console.log("props", props)
    console.log("domain", props.domainName)
    console.log("arn", props.certificateArn)
    const zone = new r53.HostedZone(this, 'GeotaskLandingPageZone', {
      zoneName: props.domainName,
    })

    const site = props.subDomainName + '.' + props.domainName;

    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, 'GeotaskLandingPageOAI', {
      comment: 'Origin Access Identity for Geotask Landing Page',
    });

    const bucket = new s3.Bucket(this, 'GeotaskLandingPageBucket', {
      bucketName: 'geotask-landing-page',
      websiteIndexDocument: 'index.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      /**
       * The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
       * the new bucket, and it will remain in your account until manually deleted. By setting the policy to
       * DESTROY, cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.
       */
      // removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code

      /**
       * For sample purposes only, if you create an S3 bucket then populate it, stack destruction fails.  This
       * setting will enable full cleanup of the demo.
       */
      // autoDeleteObjects: true, // NOT recommended for production code
    });

    // Grant access to cloudfront
    bucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [bucket.arnForObjects('*')],
      principals: [new iam.CanonicalUserPrincipal(cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
    }));

    new cdk.CfnOutput(this, 'Bucket', { value: bucket.bucketName });

    // Get certificate from another DNS provider (not route 53)
    const certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', props.certificateArn);

    // new cdk.CfnOutput(this, 'Certificate', {
    //   value: certificate.certificateArn,
    // });

    const distribution = new cloudfront.Distribution(this, 'GeotaskLandingPageDistribution', {
      certificate,
      defaultRootObject: 'index.html',
      domainNames: [site],
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 403,
          responsePagePath: '/error.html',
          ttl: cdk.Duration.seconds(30),
        },
      ],
      defaultBehavior: {
        origin: new origins.S3Origin(bucket, {
          originAccessIdentity: cloudfrontOAI,
        }),
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
    });
  
    // Route53 alias record for the CloudFront distribution
    new r53.ARecord(this, 'SiteAliasRecord', {
      recordName: site,
      target: r53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone
    });

    // Deploy site contents to S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployWithInvalidation', {
      sources: [s3deploy.Source.asset('../client/build')],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*'],
    });
  }
}
