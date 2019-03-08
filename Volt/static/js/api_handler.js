import {parametrizeURL} from './utils';

/**
 *
 * @param method {String}
 * @param route {String}
 * @param data {Object}
 * @param redirect {Boolean}
 * @returns {Promise<Response>}
 */
function callAPI(method, route, data={}, redirect=true) {
    method = method.toUpperCase();
    route = '/web' + route;

    let conf = {
        method: method,
        mode: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': django.csrf_token,
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
            if(res.redirected && redirect) redirect_url = res.url;
            return res;
        })
        .finally(() => {
            redirect_url && (window.location.href = redirect_url) && window.location.reload();
        });
}

export function register(data) {
    return callAPI('POST', '/register/', data)
}
export function login(data) {
    return callAPI('POST', '/login/', data)
}
export function logout() {
    return callAPI('POST', '/logout/')
}

export function fetchDevices() {
    return callAPI('GET', '/devices/',{}, false).then( res => res.json());
}