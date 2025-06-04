import Cookies from "js-cookie";
import axios   from "axios";
import { h }   from 'vue';

function goToLogin(redirectTo, loginUrl, appId, callbackEndpoint = 'licb') {
    const state          = encodeURIComponent(btoa(JSON.stringify({ r: redirectTo })));
    const cb             = encodeURIComponent(window.location.origin + `/${callbackEndpoint}`);
    window.location.href = `${loginUrl}?id=${appId}&cb=${cb}&state=${state}`;
}

// This should work for vue 2 and 3, the next argument is still supported in vue router 4.x
function useNovaAuth(router, cookie_name = 'novaLI', apiBase = '/api', loginUrl, appId, callbackEndpoint = 'licb', logoutEndpoint = 'logout') {
    let licbRes;
    router.beforeEach(async (to, from, next) => {
        if (to.path === `/${callbackEndpoint}`) {
            // Grab cookie here and force router to wait
            // vue router ensures they are run in order regardless of sync/async definition, by
            // enqueuing all guards and creating a promise chain with reduce
            // i.e
            //     return guards.reduce(
            //         (promise, guard) => promise.then(() => guard()),
            //             Promise.resolve()
            //     )
            // https://github.com/vuejs/router/blob/4cc3093d0485cbd968ff096d1878bee40b7e47a9/packages/router/src/router.ts#L1272
            const res = await axios({
                method: 'get',
                url: `${apiBase}/${callbackEndpoint}`,
                params: { code: to.query.code }
            })
            licbRes  = res;
	    return next();
        }
        if (to.meta?.auth === false) return next();
        if (!Cookies.get(cookie_name)) {
	    // Allow for redirecting of certain pages when unauthorized, if login page is not preferred
	    if (to.meta?.authRedirect && to.meta?.authRedirect !== to.path) return next(to.meta.authRedirect);
            goToLogin(to.path, loginUrl, appId, callbackEndpoint)
	    return next(false);
        }
	return next();
    });

    router.addRoute({ name: 'LICB', path: `/${callbackEndpoint}`, meta: { auth: false }, component: {
        data() {
            return {
                error: null
            }
        },
        async created() {
            let state = null;
            try { state = JSON.parse(atob(this.$route.query.state)); } catch { }

            this.error = null;

            if (licbRes.status == 200) {
                this.$router.replace(state?.r || '/')
            } else if (licbRes.status == 403) {
                //XXX show error
                console.log(licbRes.data);
                this.error = licbRes.data;
            } else {
                //XXX show unknown error
                console.log(licbRes.data);
                this.error = licbRes.data;
            }
        },
        render() {
            return h('div', this.error != null ? JSON.stringify(this.error) : 'Loading...');
        }
    }})

    // Set up axios interceptor immediately - only intercept 401s from our own API
    axios.interceptors.response.use(
        (response) => { return response },
        async (error) => {
            if (error.response && 
                error.response.status === 401 && 
                error.config.url && 
                error.config.url.startsWith(apiBase + '/')) {
                Cookies.remove(cookie_name);
                goToLogin(window.location.pathname, loginUrl, appId, callbackEndpoint)
            }
            return Promise.reject(error);
        });
}

let $router;
let $apiBase;
let $loginUrl;
let $appId;
let $callbackEndpoint;
let $logoutEndpoint;
const NovaAuth = {
    install: (router, options = {}) => {
        if (!options.loginUrl) throw new Error('loginUrl is required');
        if (!options.appId) throw new Error('appId is required');
        
        const { apiBase = '/api', loginUrl, appId, callbackEndpoint = 'licb', logoutEndpoint = 'logout' } = options;
        useNovaAuth(router, 'novaLI', apiBase, loginUrl, appId, callbackEndpoint, logoutEndpoint);
        $router = router;
        $apiBase = apiBase;
        $loginUrl = loginUrl;
        $appId = appId;
        $callbackEndpoint = callbackEndpoint;
        $logoutEndpoint = logoutEndpoint;
    },

    logout: async (opts) => {
        opts = opts || {};
        const { to } = opts;
        try {
            await axios({
                method: 'get',
                url: `${$apiBase || '/api'}/${$logoutEndpoint || 'logout'}`
            })

            if ($router) {
                $router.replace(to || '/');
            }

        } catch (e) {
            console.log('error logging out');
            console.log(e);
        }
    },

    login: (opts) => {
        goToLogin(opts?.to || '/', $loginUrl, $appId, $callbackEndpoint || 'licb');
    }

}


export default NovaAuth;
export { useNovaAuth };

