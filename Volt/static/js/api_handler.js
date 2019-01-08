import parametrizeURL from './utils';

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

    return fetch(route, conf);
}


export function register(data) {
    return api_call('POST', '/register/', data)
        .finally(() => window.location.reload());
}
export function login(data) {
    return api_call('POST', '/login/', data)
        .finally(() => window.location.reload());
}
export function logout() {
    return api_call('POST', '/logout/')
        .finally(() => window.location.reload());
}