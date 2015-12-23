var claims       = require("./lib/claims");
var TokenService = require("./lib/tokenService");
var bluebird     = require("bluebird");


module.exports = function (config) {
  var tokenService = new TokenService(config);

  function* validate(token) {
    var decoded       = tokenService.decode(token);
    tokenService.verifyTimeWindow(decoded, Date.now());
    tokenService.validateClientId(decoded);
    tokenService.validateAuthorities(decoded);
    var publicKey = yield* tokenService.getPublicKey(decoded[claims.ISS]);
    tokenService.verifyToken(token, publicKey);
    return decoded;
  }

  function getAuthToken(req) {
    var authToken = req.header('Authorization');
    if (!authToken) throw {'statusCode': 401, 'body': 'Authorization header is missing.'};
    return authToken;
  }

  return {
    validate: bluebird.coroutine(validate),
  }
};

