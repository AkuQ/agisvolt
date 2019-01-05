
/**
 * @return {number}
 */
export function pyTime() {
    return Math.floor(Date.now() / 1000);
}

export function ArrayExt(arr) {
    class ArrayExt {
        constructor(arr) {
            this.arr = arr;
        }

        first(field) {
            let ret = this.arr[0];
            return field !== undefined && ret !== undefined && ret[field] || ret;
        }

        last(field) {
            let ret = this.arr[this.arr.length - 1];
            return field !== undefined && ret !== undefined && ret[field] || ret;
        }
    }
    return new ArrayExt(arr);
}

/**
 * @return {string}
 */
export function parametrizeURL(url, params) {
    return url + '?' +  new URLSearchParams(params).toString();
}
