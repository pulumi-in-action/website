import * as awsx from "@pulumi/awsx";

export const routes: awsx.apigateway.Route[] = [
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
];
