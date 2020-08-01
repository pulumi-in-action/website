import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

const site = new awsx.apigateway.API("site", {
    routes: [
        {
            path: "/",
            localPath: "www"
        },
        {
            path: "/ch/03/api/dev",
            method: "GET",
            eventHandler: async () => {
                const responses = [
                    {
                        statusCode: 200,
                        body: "It's all good."
                    },
                    {
                        statusCode: 500,
                        body: "Oh noes! 😱 Something went wrong."
                    }
                ];

                // Fail ~20% of the time.
                const response = responses[Math.random() <= 0.8 ? 0 : 1];

                return {
                    statusCode: response.statusCode,
                    body: JSON.stringify(response)
                }
            }
        },
        {
            path: "/ch/03/api/prod",
            method: "GET",
            eventHandler: async () => {
                const responses = [
                    {
                        statusCode: 200,
                        body: "It's all good."
                    },
                    {
                        statusCode: 500,
                        body: "Oh noes! 😱 Something went wrong."
                    }
                ];

                // Fail ~20% of the time.
                const response = responses[Math.random() <= 0.8 ? 0 : 1];

                return {
                    statusCode: response.statusCode,
                    body: JSON.stringify(response)
                }
            }
        }
    ]
});

// How this all works.
// https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-edge-optimized-custom-domain-name.html#how-to-custom-domains-mapping-console

// Making this work takes many minutes -- like 30ish. Because CloudFront.

const domain = "pulumi-in-action.info";
const subdomain = "www";
const www = [subdomain, domain].join(".");
const certArn = "arn:aws:acm:us-east-1:845551429707:certificate/5c27f537-84a6-41ca-ab9b-d9d1dc3d8978";

// Look up the zone we want to use as a base.
const zone = pulumi.output(aws.route53.getZone({
    name: domain,
}));

// Define an API Gateway Domain. Give it a name. Optionally, provide a basepath; otherwise, / is assumed.
const gatewayDomain = new aws.apigateway.DomainName("gateway-domain", {
    certificateArn: certArn,
    domainName: www,
});

const mapping = new aws.apigateway.BasePathMapping("mapping", {
    restApi: site.restAPI,
    stageName: site.stage.stageName,
    domainName: gatewayDomain.id,
});

const alias = new aws.route53.Record("alias", {
    name: gatewayDomain.domainName,
    type: "A",
    zoneId: zone.id,
    aliases: [
        {
            name: gatewayDomain.cloudfrontDomainName,
            zoneId: gatewayDomain.cloudfrontZoneId,
            evaluateTargetHealth: true,
        }
    ],
});

const bucket = new aws.s3.Bucket("apex-redirect-bucket", {
    bucket: "www.pulumi-in-action.info",
    acl: aws.s3.PublicReadAcl,
    website: {
        redirectAllRequestsTo: www,
    }
});

const apexAlias = new aws.route53.Record("apex-alias", {
    name: domain,
    type: "A",
    zoneId: zone.id,
    aliases: [
        {
            name: bucket.bucket,
            zoneId: zone.id,
            evaluateTargetHealth: false,
        }
    ],
});

export const stageUrl = site.url
export const apiUrl = pulumi.interpolate`https://${gatewayDomain.domainName}/`;
