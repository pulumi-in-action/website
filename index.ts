import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

import { routes as ch03routes } from "./ch/03";

const config = new pulumi.Config();
const domain = config.require("domain");
const certArn = config.require("certArn");

// Set up the base API Gateway, which serves static website content and a REST API.
const site = new awsx.apigateway.API("site", {
    routes: [
        {
            path: "/",
            localPath: "www"
        },
        ...ch03routes,
    ]
});

// The hosted zone for the root domain.
const zone = pulumi.output(aws.route53.getZone({
    name: domain,
}));

// Register our custom domain name as an API Gateway domain.
const gatewayDomain = new aws.apigateway.DomainName("gateway-domain", {
    certificateArn: certArn,
    domainName: domain,
});

// Map the custom domain to the API Gateway's stage name (e.g., "/stage"). More on how
// this works at:
// https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-edge-optimized-custom-domain-name.html#how-to-custom-domains-mapping-console
const mapping = new aws.apigateway.BasePathMapping("mapping", {
    restApi: site.restAPI,
    stageName: site.stage.stageName,
    domainName: gatewayDomain.id,
});

// Create an A record to point to the API Gateway domain's implicitly created CloudFront
// distribution.
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

// Export the URL of the website.
export const siteUrl = pulumi.interpolate`https://${gatewayDomain.domainName}/`;
