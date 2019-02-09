import {parametrizeURL} from './utils';

/**
 *
 * @param method {String}
 * @param route {String}
 * @param data {Object}
 * @returns {Promise<Response>}
 */
function api_call(method, route, data={}) {
    method = method.toUpperCase();

    let conf = {
        method: method,
        mode: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': CSRF_TOKEN,
        },
        credentials: 'same-origin',
        redirect: 'follow',
    };
    if(method === 'GET')
        route = parametrizeURL(route, data);
    else
        conf.body = JSON.stringify(data);

    let redirect_url;
    return fetch(route, conf)
    .then(res => {
        if(res.redirected) redirect_url = res.url;
        return res;
    })
    .finally(() => {
        redirect_url && (window.location.href = redirect_url) && window.location.reload();
    });
}

export function register(data) {
    return api_call('POST', '/register/', data)
}
export function login(data) {
    return api_call('POST', '/login/', data)
}
export function logout() {
    return api_call('POST', '/logout/')
}