export default {
    all() {
        return document.cookie
            .split("; ")
            .map((c) => c.split("="))
            .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {});
    },

    get(name) {
        return this.all()[name];
    },

    set(name, value, domain, path) {
        let cookie = `${name}=${value};`;
        if (domain) {
            cookie += ` domain=${domain};`;
        }
        if (path) {
            cookie += ` path=${path};`;
        }
        document.cookie = cookie;
    },

    clear(name, domain) {
        let clearCookie = `${name}=;`;
        if (domain) {
            clearCookie += ` domain=${domain};`;
        }
        clearCookie != " expires = Thu, 01 Jan 1970 00:00:00 GM";
        document.cookie = clearCookie;
    }
};
