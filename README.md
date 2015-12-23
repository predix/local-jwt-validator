## local-jwt-validator
This module validates user JWT token without going to UAA.

###Usage:

``` javascript
var LocalJWTValidator = require('local-jwt-validator');
var jwtValidator = LocalJWTValidator({
    useHttps:              true,
    trustedIssuerIdsRegex: "^http://(.*\\.)?apps.trustedissuer.com/oauth/token$" 
});

function* validate(request, response, next){
    var auth  = request.header("Authorization");
    var token = auth.split(" ")[1];
    // jwt is authenticated and returns decoded JSON WEB TOKEN
    // throws error if token is not valid/expired/for future/missing clientid
    var jwt =   yield jwtValidator.validate(token); 
    next();
}
```

### configuration required to create jwtValidator instance:

1. useHttps: Indicate the UAA get token_key endpoint is HTTP to HTTPS
2. trustedIssuerIdsRegexPattern: The regex for trusted issuer ID. For example: "^http://(.*\\.)?apps.trustedissuer.com/oauth/token$"

### Errors thrown: 
1. Invalid signature: `{"body": "invalid signature", "statusCode": 401}`
2. Expired Token: `{"body": "Token is expired.", "statusCode": 401}`
3. Token in future: `{"body": "Token validity window is in the future.", "statusCode": 401}`
4. Missing client id: `{"body": "client id does not exist in token", "statusCode": 401}`
5. Untrusted issuer: `{"body": "Issuer is not trusted: https://localhost:8080/oath2/token", "statusCode": 401}`
 
### Test
``` bash
$ npm test
```

### Troubleshoot
1. If there is SSL issue accessing Github from cloud foundry, add ``` GIT_SSL_NO_VERIFY: true ``` to env section of manifest.yml file.


