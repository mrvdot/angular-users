'use strict';

angular.module('mvd.users', ['ngCookies'])
	.factory('userConfig', function ($location) {
		var self = this;

		var userInit = false;
		var _config = {
			fieldsToStore : [
				'id',
				'sessionkey'
			],
			sessionOnly : true,
			baseUrl : 'users/',
			calls : {
				login : "login",
				logout : "logout",
				signup : "signup",
				save : "save"
			},
			oauth : {
				calls : {
					session : 'session',
					status : 'status'
				}
			},
			defaultMethod : 'post',
			cookiePrefix : $location.host + '-'
		}

		self.set = function (field, value, config) {
			config = config || _config;
			if (userInit) {
				throw Error("User object has already been initialized, cannot set new config values")
			};
			if (angular.isObject(field)) {
				for (var f in field) {
					if (!field.hasOwnProperty(f)) {
						continue;
					};
					self.set(f, field[f], config);
				}
			} else {
				if (angular.isFunction(self['set' + field])) {
					self['set' + field](config, value);
				} else {
					config[field] = value;
				}
			}
		};

		//Normalize to always have slash at end
		self.setbaseUrl = function (conf, url) {
			if (url.charAt(url.length - 1) != '/') {
				url += '/';
			};
			conf.baseUrl = url;
		}

		//Ensure we only update those passed in
		self.setcalls = function (conf, urls) {
			angular.extend(conf.calls, urls);
		}

		self.setoauth = function (conf, val) {
			var oauth = conf.oauth || (conf.oauth = {});
			self.set(val, undefined, oauth);
		}

		return {
			get : function (field) {
				return angular.isDefined(field)
					? _config[field]
					: _config;
			},
			set : self.set,
			callUrl : function (call) {
				return _config.baseUrl + (angular.isObject(_config.calls[call]) ? _config.calls[call].url : _config.calls[call]);
			},
			httpMethod : function (call) {
				return (angular.isObject(_config.calls[call]) && _config.calls[call].method) || _config.defaultMethod;
			},
			oauthCallUrl : function (call) {
				var oa = _config.oauth;
				return _config.baseUrl + (angular.isObject(oa.calls[call]) ? oa.calls[call].url : oa.calls[call]);
			},
			oauthHttpMethod : function (call) {
				var oa = _config.oauth;
				return (angular.isObject(oa.calls[call]) && oa.calls[call].method) || _config.defaultMethod;
			},
			_init : function () {
				userInit = true;
			}
		}
	})
	.factory('user', function ($http, $cookies, $cookieStore, $window, userConfig) {
		userConfig._init();

		var config = userConfig.get();

		var User = function () {
			this._data = {
				loggedIn : false
			};
		};

		var storeUser = function () {
			var cookieName = config.cookiePrefix + 'user';
		}

		User.prototype = {
			oauth : {
				session : function (provider) {
					var self = this;
					var url = userConfig.oauthCallUrl('session').replace('{$PROVIDER}',provider);
					var method = userConfig.oauthHttpMethod('session');
					if (method == 'jsonp') {
						url += '?callback=JSON_CALLBACK';
					};
					$http[method](url).success(function (response) {
						var output = $window.open(
							response.url,
							'oauth_session',
							'dependent,resizable,scrollbars,chrome,centerscreen,width=500,height=500'
						);
						self.status(provider, output);
					});
				},
				status : function (provider, oauthWindow) {
					var self = this;
					var url = userConfig.oauthCallUrl('status').replace('{$PROVIDER}',provider);
					var method = userConfig.oauthHttpMethod('session');
					if (method == 'jsonp') {
						url += '?callback=JSON_CALLBACK';
					};
					$http[method](url).success(function (response) {
						console.log(response);
						if (response.error) {
							alert('OAuth denied: '+response.error);
							return;
						};
						if (response.authentication == 'none') {
							setTimeout(function () {
								self.status(provider, true)
							}, 200);
						};
						if (response.success) {
							oauthWindow.close();
							alert('OAuth success');
						};
					});
				}
			},
      login : function (username, password, callback) {
      	var url = userConfig.callUrl('login');
      	var method = userConfig.httpMethod('login');
      },
      signup : function (username, password) {
        return $http.jsonp(baseUrl + 'signup.jsonp?callback=JSON_CALLBACK&email=' + encodeURI(username) + '&password=' + encodeURI(password));
      },
      logout : function () {
        return $http.get(baseUrl + 'logout.json');
      },
      loggedIn : function () {
      	return this._data.loggedIn;
      }
    };

    return new User();
	});