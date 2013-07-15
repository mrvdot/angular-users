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
		var slice = [].slice;//for convenience
		
		userConfig._init();

		var config = userConfig.get();

		var User = function () {
			this._data = {
				loggedIn : false
			};
		};

		var storeUser = function () {
			var cookieName = _config.cookiePrefix + 'user';
		}

		var baseCall = {
			url : '',
			method : config.defaultMethod,
			success : angular.noop,
			error : angular.noop
		}

		User.prototype = {
			getCall : function (call, calls) {
				calls = calls || config.calls;
				var levels = call.split('.');
				if (levels.length > 1) {
					calls = calls[levels.shift()]
					call = levels.join('.');
					return this.getCall(call, calls);
				} else {
					var c = calls[call];
					if (!c) {
						return undefined;
					};
					if (angular.isString(c)) {
						return angular.extend({}, baseCall, {
							url : c
						});
					} else {
						return angular.extend({}, baseCall, c);
					}
				}
			},
			parseUrl : function (call, params) {
				var url = call.url;
				var callParams = call.params;
				for (var i = 0, ii = callParams.length; i < ii; i++) {
					url = url.replace('{$' + callParams[i].toUpperCase() + '}', params[i]);
				}
				return url;
			},
			do : function (call /*, ... params ...*/) {
				var c = this.getCall(call)
					, self = this;
				if (!c) {
					return false;
				}
				var params = slice.call(arguments, 1);
				if (c.params) {
					var url = config.baseUrl + self.parseUrl(c, params);
				} else {
					var url = config.baseUrl + c.url;
				}
				if (c.method == 'jsonp') {
					url += '?callback=JSON_CALLBACK';
				};
				$http[c.method](url)
					.success(function (response) {
						if (response.error) {
							self.processError.apply(self, [response, c].concat(params))
						} else {
							self.processSuccess.apply(self, [response, c].concat(params))
						}
					})
					.error(function (response) {
						self.processError.apply(self, [response, c].concat(params))
					});
			},
			processSuccess : function (data, call /**, ... params ... **/) {
				var params = slice.call(arguments, 2)
					, success = call.success
					, self = this
					, c;
				if (angular.isFunction(success)) {
					success.apply(self, [data].concat(params));
				} else if (c = self.getCall(success))  {
					self.do.apply(self, [c, data].concat(params));
				} else {
					console.log('failed to process success with',data,call, params);
				}
			},
			processError : function (data, call) {
				var params = slice.call(arguments, 2)
					, error = call.error
					, self = this
					, c;
				if (angular.isFunction(error)) {
					error.apply(self, [data].concat(params));
				} else if (c = self.getCall(error))  {
					self.do.apply(self, [c, data].concat(params));
				} else {
					console.log('failed to process error with',data,call, params);
				}
			},
			isLoggedIn : function () {
				return this._data.loggedIn;
			},
			setLoggedIn : function (val) {
				this._data.loggedIn = val;
			},
			update : function (data) {
				angular.extend(this, data);
			}
    };

    var user = new User();

    if (config.loadOnInit) {
    	user.do('load');
    };

    return user;
	});