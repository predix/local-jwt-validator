var TokenService = require("../lib/tokenService");
var claims       = require("../lib/claims");
var chai         = require('chai');
var expect       = chai.expect;
assert           = require('assert');
var should       = chai.should;
var sinon        = require('sinon');
var jwt          = require('jsonwebtoken');
require('sinon-as-promised');

require('mocha-generators').install();

describe("Token Service test", function () {
  var TOKEN_ISSUER_ID = "http://localhost:8080/uaa/oauth/token";

  var TOKEN_KEY_URL = "https://localhost:8080/uaa/token_key";

  var TOKEN_VERIFYING_KEY = "-----BEGIN PUBLIC KEY-----\n"
    + "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0m59l2u9iDnMbrXHfqkO\n"
    + "rn2dVQ3vfBJqcDuFUK03d+1PZGbVlNCqnkpIJ8syFppW8ljnWweP7+LiWpRoz0I7\n"
    + "fYb3d8TjhV86Y997Fl4DBrxgM6KTJOuE/uxnoDhZQ14LgOU2ckXjOzOdTsnGMKQB\n"
    + "LCl0vpcXBtFLMaSbpv1ozi8h7DJyVZ6EnFQZUWGdgTMhDrmqevfx95U/16c5WBDO\n"
    + "kqwIn7Glry9n9Suxygbf8g5AzpWcusZgDLIIZ7JTUldBb8qU2a0Dl4mvLZOn4wPo\n"
    + "jfj9Cw2QICsc5+Pwf21fP+hzf+1WSRHbnYv8uanRO0gZ8ekGaghM/2H6gqJbo2nI\n" + "JwIDAQAB\n"
    + "-----END PUBLIC KEY-----\n";

  var TOKEN_SIGNING_KEY = "-----BEGIN RSA PRIVATE KEY-----\n"
    + "MIIEowIBAAKCAQEA0m59l2u9iDnMbrXHfqkOrn2dVQ3vfBJqcDuFUK03d+1PZGbV\n"
    + "lNCqnkpIJ8syFppW8ljnWweP7+LiWpRoz0I7fYb3d8TjhV86Y997Fl4DBrxgM6KT\n"
    + "JOuE/uxnoDhZQ14LgOU2ckXjOzOdTsnGMKQBLCl0vpcXBtFLMaSbpv1ozi8h7DJy\n"
    + "VZ6EnFQZUWGdgTMhDrmqevfx95U/16c5WBDOkqwIn7Glry9n9Suxygbf8g5AzpWc\n"
    + "usZgDLIIZ7JTUldBb8qU2a0Dl4mvLZOn4wPojfj9Cw2QICsc5+Pwf21fP+hzf+1W\n"
    + "SRHbnYv8uanRO0gZ8ekGaghM/2H6gqJbo2nIJwIDAQABAoIBAHPV9rSfzllq16op\n"
    + "zoNetIJBC5aCcU4vJQBbA2wBrgMKUyXFpdSheQphgY7GP/BJTYtifRiS9RzsHAYY\n"
    + "pAlTQEQ9Q4RekZAdd5r6rlsFrUzL7Xj/CVjNfQyHPhPocNqwrkxp4KrO5eL06qcw\n"
    + "UzT7UtnoiCdSLI7IL0hIgJZP8J1uPNdXH+kkDEHE9xzU1q0vsi8nBLlim+ioYfEa\n"
    + "Q/Q/ovMNviLKVs+ZUz+wayglDbCzsevuU+dh3Gmfc98DJw6n6iClpd4fDPqvhxUO\n"
    + "BDeQT1mFeHxexDse/kH9nygxT6E4wlU1sw0TQANcT6sHReyHT1TlwnWlCQzoR3l2\n"
    + "RmkzUsECgYEA8W/VIkfyYdUd5ri+yJ3iLdYF2tDvkiuzVmJeA5AK2KO1fNc7cSPK\n"
    + "/sShHruc0WWZKWiR8Tp3d1XwA2rHMFHwC78RsTds+NpROs3Ya5sWd5mvmpEBbL+z\n"
    + "cl3AU9NLHVvsZjogmgI9HIMTTl4ld7GDsFMt0qlCDztqG6W/iguQCx8CgYEA3x/j\n"
    + "UkP45/PaFWd5c1DkWvmfmi9UxrIM7KeyBtDExGIkffwBMWFMCWm9DODw14bpnqAA\n"
    + "jH5AhQCzVYaXIdp12b+1+eOOckYHwzjWOFpJ3nLgNK3wi067jVp0N0UfgV5nfYw/\n"
    + "+YoHfYRCGsM91fowh7wLcyPPwmSAbQAKwbOZKfkCgYEAnccDdZ+m2iA3pitdIiVr\n"
    + "RaDzuoeHx/IfBHjMD2/2ZpS1aZwOEGXfppZA5KCeXokSimj31rjqkWXrr4/8E6u4\n"
    + "PzTiDvm1kPq60r7qi4eSKx6YD15rm/G7ByYVJbKTB+CmoDekToDgBt3xo+kKeyna\n"
    + "cUQqUdyieunM8bxja4ca3ukCgYAfrDAhomJ30qa3eRvFYcs4msysH2HiXq30/g0I\n"
    + "aKQ12FSjyZ0FvHEFuQvMAzZM8erByKarStSvzJyoXFWhyZgHE+6qDUJQOF6ruKq4\n"
    + "DyEDQb1P3Q0TSVbYRunOWrKRM6xvJvSB4LUVfSvBDsv9TumKqwfZDVFVn9yXHHVq\n"
    + "b6sjSQKBgDkcyYkAjpOHoG3XKMw06OE4OKpP9N6qU8uZOuA8ZF9ZyR7vFf4bCsKv\n"
    + "QH+xY/4h8tgL+eASz5QWhj8DItm8wYGI5lKJr8f36jk0JLPUXODyDAeN6ekXY9LI\n"
    + "fudkijw0dnh28LJqbkFF5wLNtATzyCfzjp+czrPMn9uqLNKt/iVD\n" + "-----END RSA PRIVATE KEY-----\n";

  var body               = {};
  body[claims.CLIENT_ID] = "remote";
  body[claims.USER_NAME] = "olds";
  body[claims.EMAIL]     = "olds@somehost.com";
  body[claims.ISS]       = TOKEN_ISSUER_ID;
  body[claims.USER_ID]   = "HDGFJSHGDF";

  var publicKey = {
    alg:   "SHA256withRSA",
    value: TOKEN_VERIFYING_KEY,
    kty:   "RSA",
    use:   "sig",
    n:     "ANJufZdrvYg5zG61x36pDq59nVUN73wSanA7hVCtN3ftT2Rm1ZTQqp5KSCfLMhaaVvJY51sHj+/i4lqUaM9CO32G93fE44VfOmPfexZ"
           + "eAwa8YDOikyTrhP7sZ6A4WUNeC4DlNnJF4zsznU7JxjCkASwpdL6XFwbRSzGkm6b9aM4vIewyclWehJxUGVFhnYEzIQ65qnr38feV"
           + "P9enOVgQzpKsCJ+xpa8vZ/UrscoG3/IOQM6VnLrGYAyyCGeyU1JXQW/KlNmtA5eJry2Tp+MD6I34/QsNkCArHOfj8H9tXz/oc3/tV"
           + "kkR252L/Lmp0TtIGfHpBmoITP9h+oKiW6NpyCc=",
    e:     "AQAB"
  };

  var config = {
    useHttps:              true,
    trustedIssuerIdsRegex: "^http://(.*\\.)?apps.trustedissuer.com/oauth/token$"
  };

  function mockAccessToken(validitySec, issuer, issuedAt) {
    issuer   = issuer || TOKEN_ISSUER_ID;
    issuedAt = issuedAt || Math.floor(Date.now() / 1000);
    var exp  = issuedAt + validitySec;
    return {
      "jti":         "86395982-2b5d-4ac4-ba9b-70902175ebc9",
      "sub":         "1adc931e-d65f-4357-b90d-dd4131b8749a",
      "authorities": ["uaa.resource"],
      "scope":       ["openid"],
      "client_id":   "cf",
      "cid":         "cf",
      "azp":         "cf",
      "grant_type":  "passsword",
      "user_id":     "1adc931e-d65f-4357-b90d-dd4131b8749a",
      "user_name":   "marissa",
      "email":       "marissa@test.com",
      "iat":         issuedAt,
      "exp":         exp,
      "iss":         issuer,
      "zid":         "uaa",
      "aud":         ["none"]
    };
  }

  before(function (done) {
    sinon.stub(TokenService, 'get').resolves([{body: JSON.stringify(publicKey)}, undefined]);
    done();
  });
  after(function (done) {
    TokenService.get.restore();
    done();
  });

  it("success on getting public key", function* () {
    var tokenService = new TokenService({useHttps: true});
    var result       = yield* tokenService.getPublicKey(TOKEN_ISSUER_ID);
    expect(result).to.be.eql(publicKey);
  });

  it("fails when not matching with trustedIssuerIdsRegex", function*() {
    var tokenService = new TokenService(config);
    try {
      yield* tokenService.getPublicKey(TOKEN_ISSUER_ID);
      throw "This should have failed, but it did not";
    } catch (e) {
      expect(e).to.be.eql({
        statusCode: 401,
        body:       'Issuer is not trusted: http://localhost:8080/uaa/oauth/token'
      });
    }
  });
  it('get token url', function () {
    var tokenService = new TokenService({useHttps: true});
    var tokenUrl     = tokenService.getTokenUrl(TOKEN_ISSUER_ID);
    expect(tokenUrl).to.be.eql(TOKEN_KEY_URL);
  });

  it('get token url when useHttps is false', function () {
    var tokenService = new TokenService({useHttps: false});
    var tokenUrl     = tokenService.getTokenUrl(TOKEN_ISSUER_ID);
    expect(tokenUrl).to.be.eql("http://localhost:8080/uaa/token_key");
  });
  it('invalid iss will throw error', function () {
    var tokenService = new TokenService({useHttps: true});
    try {
      tokenService.getTokenUrl("http://localhost:8080/uaa/oaaauth/token");
      throw "This should have failed, but it did not";
    } catch (e) {
      expect(e).to.be.eql({
        "body":       "invalid Issuer: http://localhost:8080/uaa/oaaauth/token",
        "statusCode": 401
      });
    }
  });
  it("validate token with public key.", function () {
    var tokenService = new TokenService({useHttps: true});
    var decoded      = mockAccessToken(100);
    var signed       = jwt.sign(decoded, TOKEN_SIGNING_KEY, {algorithm: 'RS256', header: {typ: 'RSA'}});
    var verified     = tokenService.verifyToken(signed, publicKey);
    expect(verified).to.be.eql(decoded);
  });

  it("validation fails if token is malformed", function () {
    var tokenService = new TokenService({useHttps: true});
    try {
      tokenService.verifyToken("some malformed token", publicKey);
      throw "This should have failed, but it did not";
    } catch (e) {
      expect(e).to.be.eql({"body": "jwt malformed", "statusCode": 401});
    }
  });
  it("validate if clientid exists in token", function () {
    var tokenService = new TokenService({useHttps: true});
    var decoded      = mockAccessToken(100);
    delete decoded.client_id;
    try {
      tokenService.validateClientId(decoded);
      throw "This should have failed, but it did not";
    } catch (e) {
      expect(e).to.be.eql({"body": "client id does not exist in token", "statusCode": 401});
    }
  });
  it(" fails if token is expired", function () {
    var tokenService = new TokenService({useHttps: true});
    var decoded      = mockAccessToken(-70);
    try {
      tokenService.verifyTimeWindow(decoded, Date.now());
      throw "This should have failed, but it did not";
    } catch (e) {
      expect(e).to.be.eql({"body": "Token is expired.", "statusCode": 401});
    }
  });
  it(" fails if token is issued for future", function () {
    var tokenService = new TokenService({useHttps: true});
    var decoded      = mockAccessToken(100, undefined, Math.ceil(Date.now() / 1000) + 70);
    try {
      tokenService.verifyTimeWindow(decoded, Date.now());
      throw "This should have failed, but it did not";
    } catch (e) {
      expect(e).to.be.eql({"body": "Token validity window is in the future.", "statusCode": 401});
    }
  });

  it('any null authority should fail', function () {
    var tokenService = new TokenService({useHttps: true});
    var decoded      = mockAccessToken(100);
    decoded.authorities.push(null);
    try {
      tokenService.validateAuthorities(decoded);
      throw "This should have failed, but it did not";
    } catch (e) {
      expect(e).to.be.eql({"body": "null authority not allowed in authority list of JWT token.", "statusCode": 401});
    }
  });
});
