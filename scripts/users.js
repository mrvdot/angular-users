'use strict';

angular.module('mvd.users', ['ngCookies'])
	.factory('userConfig', function ($location) {
		var self = this;

		var userInit = false;
		var config = {
			fieldsToStore : [
				'id',
				'sessionkey'
			],
			sessionOnly : true,
			baseUrl : 'users/',
			methodUrls : {
				login : "login",
				logout : "logout",
				signup : "signup",
				save : "save"
			},
			defaultMethod : 'post',
			cookiePrefix : $location.host + '-'
		}

		self.set = function (field, value) {
			if (userInit) {
				throw Error("User object has already been initialized, cannot set new config values")
			};
			if (angular.isObject(field)) {
				for (var f in field) {
					if (!field.hasOwnProperty(f)) {
						continue;
					};
					self.set(f, field[f]);
				}
			} else {
				if (angular.isFunction(self['set' + field])) {
					self['set' + field](value);
				} else {
					config[field] = value;
				}
			}
		};

		//Normalize to always have slash at end
		self.setbaseUrl = function (url) {
			if (url.charAt(url.length - 1) != '/') {
				url += '/';
			};
			config.baseUrl = url;
		}

		//Ensure we only update those passed in
		self.setmethodUrls = function (urls) {
			angular.extend(config.methodUrls, urls);
		}

		return {
			get : function (field) {
				return angular.isDefined(field)
					? config[field]
					: config;
			},
			set : self.set,
			callUrl : function (call) {
				return config.baseUrl + (angular.isObject(config.calls[call]) ? config.calls[call].url : config.calls[call]);
			},
			httpMethod : function (call) {
				return (angular.isObject(config.calls[call]) && config.calls[call].method) || defaultMethod;
			},
			_init : function () {
				userInit = true;
			}
		}
	})
	.factory('user', function ($cookies, $cookieStore, userConfig) {
		userConfig._init();

		var config = userConfig.get();

		var User = function () {
			this.data = {};
			this._loggedIn = false;
		};

		var storeUser = function () {
			var cookieName = config.cookiePrefix + 'user';
		}

		User.prototype = {
      login : function (username, password, callback) {
      	var url = userConfig.methodUrl('login');
      	var method = userConfig.httpMethod('login');
      },
      signup : function (username, password) {
        return $http.jsonp(baseUrl + 'signup.jsonp?callback=JSON_CALLBACK&email=' + encodeURI(username) + '&password=' + encodeURI(password));
      },
      logout : function () {
        return $http.get(baseUrl + 'logout.json');
      },
      loggedIn : function () {
      	return this._loggedIn;
      }
    };
	});