var vows = require('vows');
var assert = require('assert');
var util = require('util');
var WindowsLiveStrategy = require('passport-windowslive/strategy');


vows.describe('WindowsLiveStrategy').addBatch({
  
  'strategy': {
    topic: function() {
      return new WindowsLiveStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});
    },
    
    'should be named windowslive': function (strategy) {
      assert.equal(strategy.name, 'windowslive');
    },
  },
  
  'strategy when loading user profile': {
    topic: function() {
      var strategy = new WindowsLiveStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});
      
      // mock
      strategy._oauth2.get = function(url, accessToken, callback) {
        var body = '{ \
           "id": "8c8ce076ca27823f", \
           "name": "Roberto Tamburello", \
           "first_name": "Roberto", \
           "last_name": "Tamburello", \
           "link": "http://cid-8c8ce076ca27823f.profile.live.com/", \
           "birth_day": 20, \
           "birth_month": 4, \
           "birth_year": 2010, \
           "work": [ \
              { \
                 "employer": { \
                    "name": "Microsoft Corporation" \
                 }, \
                 "position": { \
                    "name": "Software Development Engineer" \
                 } \
              } \
           ], \
           "gender": "male", \
           "emails": { \
              "preferred": "Roberto@contoso.com", \
              "account": "Roberto@contoso.com", \
              "personal": "Roberto@fabrikam.com", \
              "business": "Robert@adatum.com", \
              "other": "Roberto@adventure-works.com" \
           }, \
           "addresses": { \
              "personal": { \
                 "street": "123 Main St.", \
                 "street_2": "Apt. A", \
                 "city": "Redmond", \
                 "state": "WA", \
                 "postal_code": "12990", \
                 "region": "United States" \
              }, \
              "business": { \
                 "street": "456 Anywhere St.", \
                 "street_2": "Suite 1", \
                 "city": "Redmond", \
                 "state": "WA", \
                 "postal_code": "12399", \
                 "region": "United States" \
              } \
           }, \
           "phones": { \
              "personal": "(555) 555-1212", \
              "business": "(555) 111-1212", \
              "mobile": null \
           }, \
           "locale": "en_US", \
           "updated_time": "2011-04-21T23:55:34+0000" \
        }';
        
        callback(null, body, undefined);
      }
      
      return strategy;
    },
    
    'when told to load user profile': {
      topic: function(strategy) {
        var self = this;
        function done(err, profile) {
          self.callback(err, profile);
        }
        
        process.nextTick(function () {
          strategy.userProfile('access-token', done);
        });
      },
      
      'should not error' : function(err, req) {
        assert.isNull(err);
      },
      'should load profile' : function(err, profile) {
        assert.equal(profile.provider, 'windowslive');
        assert.equal(profile.id, '8c8ce076ca27823f');
        assert.equal(profile.displayName, 'Roberto Tamburello');
        assert.equal(profile.name.familyName, 'Tamburello');
        assert.equal(profile.name.givenName, 'Roberto');
        
        assert.lengthOf(profile.emails, 4);
        assert.equal(profile.emails[0].value, 'Roberto@contoso.com');
        assert.equal(profile.emails[0].type, 'account');
        assert.isTrue(profile.emails[0].primary);
        assert.equal(profile.emails[1].value, 'Roberto@fabrikam.com');
        assert.equal(profile.emails[1].type, 'home');
        assert.isUndefined(profile.emails[1].primary);
        assert.equal(profile.emails[2].value, 'Robert@adatum.com');
        assert.equal(profile.emails[2].type, 'work');
        assert.isUndefined(profile.emails[2].primary);
        assert.equal(profile.emails[3].value, 'Roberto@adventure-works.com');
        assert.equal(profile.emails[3].type, 'other');
        assert.isUndefined(profile.emails[3].primary);
        
        assert.lengthOf(profile.photos, 1);
        assert.equal(profile.photos[0].value, 'https://apis.live.net/v5.0/8c8ce076ca27823f/picture');
      },
      'should set raw property' : function(err, profile) {
        assert.isString(profile._raw);
      },
      'should set json property' : function(err, profile) {
        assert.isObject(profile._json);
      },
    },
  },
  
  'strategy when loading user profile and encountering an error': {
    topic: function() {
      var strategy = new WindowsLiveStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});
      
      // mock
      strategy._oauth2.get = function(url, accessToken, callback) {
        callback(new Error('something-went-wrong'));
      }
      
      return strategy;
    },
    
    'when told to load user profile': {
      topic: function(strategy) {
        var self = this;
        function done(err, profile) {
          self.callback(err, profile);
        }
        
        process.nextTick(function () {
          strategy.userProfile('access-token', done);
        });
      },
      
      'should error' : function(err, req) {
        assert.isNotNull(err);
      },
      'should wrap error in InternalOAuthError' : function(err, req) {
        assert.equal(err.constructor.name, 'InternalOAuthError');
      },
      'should not load profile' : function(err, profile) {
        assert.isUndefined(profile);
      },
    },
  },
  
}).export(module);
