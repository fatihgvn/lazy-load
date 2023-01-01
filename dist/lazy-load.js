"use strict";
class LazyDom {
    constructor() {
    }
}
class lazyload {
    constructor(selector) {
        this.rundynamic = true;
        this.lazyselector = '*[lazy-load]';
        if (selector != void 0) {
            this.lazyselector = selector;
        }
        this.loadall();
    }
    loadall() {
        this.get_lazy().forEach(element => {
            let data = {};
            let url = '';
            let method = element.dom.getAttribute('lazy-load-method');
            if (method)
                this.request(method, element, url, data);
        });
    }
    get_lazy() {
        if (this.rundynamic == true) {
        }
        return this.list;
    }
    request(method, elem, url = '', data = {}) {
        let xhr = new XMLHttpRequest();
        switch (method.toUpperCase()) {
            case 'POST':
                xhr.open('POST', url, true);
                xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
                xhr.send(JSON.stringify(data));
                break;
            case 'GET':
                break;
            default:
                console.error(`'${method.toUpperCase()}' is not supported`);
                break;
        }
        xhr.onload = function () {
            if (xhr.status === 201) {
                console.log("Post successfully created!");
            }
        };
        xhr.send();
    }
}
