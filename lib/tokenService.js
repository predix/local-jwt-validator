var jwt      = require('jsonwebtoken');
var claims   = require("./claims");
var assert   = require('assert');
var bluebird = require('bluebird');
var request  = require('request');


function TokenService(conf) {
  this.config = conf;
  this.keys   = {};
  this.maxClockSkewInSeconds = 60;
}


TokenService.prototype.decode = function (token) {
  return jwt.decode(token)
};

TokenService.get = bluebird.promisify(request.get);

TokenService.prototype.getPublicKey = function* (iss) {
  assert(iss, "Issuer can not be undefined");
  if (this.keys[iss]) return this.keys[iss];
  var tokenKeyUrl = this.getTokenUrl(iss);
  var result      = (yield TokenService.get({url: tokenKeyUrl}))[0];
  var publicKey   = JSON.parse(result.body);
  this.keys[iss]  = publicKey;
  return publicKey;
};

TokenService.prototype.isTrustedUAA = function (iss) {
  if (!this.config.trustedIssuerIdsRegex) return;
  var expectedRe = new RegExp(this.config.trustedIssuerIdsRegex);
  if (!expectedRe.test(iss)) {
    throw {statusCode: 401, body: "Issuer is not trusted: " + iss}
  }
};

TokenService.prototype.getTokenUrl = function (iss) {
  assert(iss, "Issuer can not be undefined");
  this.isTrustedUAA(iss);
  var re = /^http.*:\/\/(.*)\/oauth\/token$/;
  if (!re.test(iss)) {
    throw {statusCode: 401, body: "invalid Issuer: " + iss};
  }
  var issuerPart = re.exec(iss)[1];
  var scheme     = (this.config.useHttps && 'https') || 'http';
  return scheme + "://" + issuerPart + "/token_key";
};

TokenService.prototype.verifyToken = function (token, publicKey) {
  var pk = publicKey.value.replace(/\\\n/g, '\n');
  try {
    return jwt.verify(token, pk);
  } catch (e) {
    throw {statusCode: 401, body: e.message}
  }
};

TokenService.prototype.verifyTimeWindow = function (decoded, currentTime) {
  if (decoded[claims.IAT] && (decoded[claims.IAT] - this.maxClockSkewInSeconds) * 1000 > currentTime) {
    throw {statusCode: 401, body: "Token validity window is in the future."}
  }

  if (decoded[claims.EXP] && (decoded[claims.EXP] + this.maxClockSkewInSeconds) * 1000 < currentTime) {
    throw {statusCode: 401, body: "Token is expired."}
  }
};

TokenService.prototype.validateClientId = function (decoded) {
  if(!decoded[claims.CLIENT_ID]){
    throw {statusCode:401, body: "client id does not exist in token" }
  }
};

TokenService.prototype.validateAuthorities = function (decoded) {
  decoded.authorities && decoded.authorities.forEach(authority => {
    if (authority == null) throw {'statusCode': 401, 'body': 'null authority not allowed in authority list of JWT token.'};
  });
};

module.exports = TokenService;