import Auth from '../auth/auth';

/**
 * @name Auth Ng
 * @category Angular Components
 * @description Provides an Angular wrapper for Auth.
 */
/* global angular: false */
const angularModule = angular.module('Ring.auth', []);

angularModule.provider('auth', ['$httpProvider', function ($httpProvider) {
  /**
   * @example
     <example name="Auth Ng">
       <file name="index.html">
         <div ng-app="test" ng-controller="testCtrl as ctrl">
            <h3>User info</h3>
            <pre>{{ ctrl.user | json }}</pre>
         </div>
       </file>

       <file name="index.js" webpack="true">
         import hubConfig from 'ring-ui/site/hub-config';

         import 'angular';
         import 'ring-ui/components/auth-ng/auth-ng';

         angular.module('test', ['Ring.auth'])
           .config(function (authProvider) {
             authProvider.config(hubConfig);
           })
           .controller('testCtrl', function(auth, $q) {
             var ctrl = this;
             $q.resolve(auth.requestUser()).then(function(user) {
              ctrl.user = user;
             });
           });
       </file>
     </example>
   */
  /**
   * @type Auth
   */
  let auth;
  /**
   * @type {{cleanHash: boolean}} config
   */
  const defaultConfig = {
    cleanHash: false //prevents infinite redirect on angular>1.2.26
  };

  /**
   * @param {{
   *   serverUri: string,
   *   redirect_uri: string?,
   *   client_id: string?,
   *   scope: string[]?,
   *   cleanHash: boolean?
   * }} config
   */
  this.config = config => {
    const configCopy = angular.extend({}, defaultConfig, config);
    auth = new Auth(configCopy);
  };

  $httpProvider.interceptors.push(['$q', '$injector', 'auth', ($q, $injector, authInstance) => {
    function urlEndsWith(config, suffix) {
      return config && config.url && config.url.indexOf(suffix) === config.url.length - suffix.length;
    }

    return {
      request(config) {
        if (!authInstance || urlEndsWith(config, '.html')) {
          // Don't intercept angular template requests
          return config;
        }
        return authInstance.promise.
          then(() => authInstance.auth.requestToken()).
          then(accessToken => {
            config.headers.Authorization = `Bearer ${accessToken}`;
            return config;
          });
      },
      responseError(rejection) {
        if (authInstance && !urlEndsWith(rejection.config, '.html') &&
          rejection.data != null && Auth.shouldRefreshToken(rejection.data.error)) {

          // Use $injector to avoid circular dependency
          const $http = $injector.get('$http');
          const {data, method, params, url} = rejection.config;

          return authInstance.auth.forceTokenUpdate().then(() => $http({data, method, params, url}));
        }

        return $q.reject(rejection);
      }
    };
  }]);

  /*@ngInject*/
  this.$get = ($injector, $log, $sniffer) => {
    // Do not try to init anything without config
    if (!auth) {
      $log.warn('Auth wasn\'t initialized');
      return null;
    }

    if (auth.config.avoidPageReload) {
      auth.addListener('userChange', () => {
        const $route = $injector.get('$route');
        $route.reload();
      });
    }

    /**
     * @type {Promise.<string>}
     */
    const authInitPromise = auth.init();

    /**
     * @param {string?} restoreLocationURL
     */
    function restoreLocation(restoreLocationURL) {
      if (restoreLocationURL) {
        const bases = document.getElementsByTagName('base');
        let baseURI = auth.config.redirect_uri;

        if (bases.length > 0) {
          baseURI = bases[0].href;
        }

        if (restoreLocationURL.indexOf(baseURI) === 0) {
          const $location = $injector.get('$location');
          let relativeURI = restoreLocationURL.substr(baseURI.length);

          // We have to turn url with hash to simple relative url in HashbangInHtml5 mode
          // And there is no other and documented way to detect that mode
          // @see http://stackoverflow.com/a/16678065
          if ($location.$$html5 && !$sniffer.history) { // eslint-disable-line angular/no-private-call
            relativeURI = relativeURI.replace(/^#\//, '');
          }

          $location.url(relativeURI).replace();
        }
      }
    }

    authInitPromise.then(restoreLocation, e => {
      if (!e.authRedirect) {
        $log.error(e);
      }
    });

    return {
      auth,
      requestUser: auth.requestUser.bind(auth),
      clientId: auth.config.client_id,
      logout: auth.logout.bind(auth),
      promise: authInitPromise
    };
  };
}]);

export default angularModule.name;
