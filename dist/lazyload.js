"use strict";
class LazyLoad {
    constructor() {
        this.rundynamic = true;
        this.list = [];
        this.page_key = 'page';
    }
    updateDomList() {
        if (this.rundynamic == true || this.list.length == 0) {
            let doms = document.querySelectorAll('*[lazy-load]');
            doms.forEach(element => {
                this.create(element);
            });
        }
        return this.list;
    }
    create(dom) {
        if (dom instanceof Element) {
            if (dom.getAttribute('lazy-load') == '')
                this.list.push(new LazyDom(dom));
        }
        else {
            this.list.push(dom);
        }
    }
    insertDom(dom) {
        this.list.forEach(dom_element => {
            if (dom_element.code == dom.code)
                return false;
        });
        return true;
    }
    request(callback, method, url = '', data = {}, page = 0) {
        let xhr = new XMLHttpRequest();
        Object.assign(data, { [this.page_key]: page.toString() });
        switch (method.toUpperCase()) {
            case 'POST':
                xhr.open('POST', url, true);
                xhr.send(JSON.stringify(data));
                break;
            case 'GET':
                let search_params = new URLSearchParams();
                let use_query = false;
                search_params.set(this.page_key, page.toString());
                for (let key in data) {
                    if (Object.prototype.hasOwnProperty.call(data, key)) {
                        let val = data[key];
                        search_params.set(key, val);
                        use_query = true;
                    }
                }
                if (use_query) {
                    url += `?${search_params.toString()}`;
                }
                xhr.open('GET', url, true);
                break;
            default:
                console.error(`'${method.toUpperCase()}' is not supported`);
                return;
        }
        xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
        xhr.onload = function () {
            callback(xhr.status, xhr.responseText, xhr);
        };
        xhr.send();
        return xhr;
    }
}
class LazyDom {
    constructor(dom) {
        this.code = '';
        this.page = 0;
        this.block_new_request = false;
        if (dom instanceof String) {
            let _dom = document.querySelector(`*[lazy-load=${dom}]`);
            if (_dom != void 0) {
                this.dom = _dom;
            }
        }
        else {
            this.dom = dom;
        }
        this.template = this.dom.innerHTML;
        this.dom.innerHTML = "";
        this.code = this.generateCode();
        this.dom.setAttribute('lazy-load', this.code.toString());
        $lazyload.insertDom(this);
        this.updateContent(this.page);
        this.dom.addEventListener('scroll', (event) => {
            let { scrollTop, scrollHeight, clientHeight } = this.dom;
            if (scrollTop + clientHeight >= scrollHeight - 5) {
                this.updateContent(this.page);
            }
        }, {
            passive: true
        });
    }
    generateCode() {
        var fourChars = function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1).toUpperCase();
        };
        return (fourChars() + fourChars() + "-" + fourChars() + "-" + fourChars() + "-" + fourChars() + "-" + fourChars() + fourChars() + fourChars());
    }
    updateContent(page, updatepage = true) {
        if (this.block_new_request)
            return;
        this.block_new_request = true;
        let data = this.dom.getAttribute('lazy-load-data');
        let url = this.dom.getAttribute('lazy-load-url');
        let method = this.dom.getAttribute('lazy-load-method');
        if (method == void 0)
            method = 'GET';
        if (url == void 0)
            url = document.URL;
        let data_obj = {};
        if (data != void 0)
            data_obj = JSON.parse(data);
        if (page == void 0)
            page = 0;
        let _this = this;
        $lazyload.request(function (status, responseText, xhr) {
            if (status === 200) {
                _this.setContent(JSON.parse(responseText));
                _this.block_new_request = false;
            }
        }, method, url, data_obj, page);
        if (page == this.page && updatepage) {
            this.page++;
        }
    }
    setContent(data) {
        let parser = new DOMParser();
        let doc;
        data.forEach(element => {
            let template = this.template;
            let lazyid = null;
            for (let key in element) {
                if (element.hasOwnProperty(key)) {
                    template = template.replace(`[[${key}]]`, element[key]);
                    if (key == 'lazy-id' || key == 'lazyid' || key == 'id') {
                        lazyid = element[key];
                    }
                }
            }
            doc = parser.parseFromString(template.toString(), 'text/html');
            if (lazyid != void 0) {
                let child = doc.body.children.item(0);
                if (child != null)
                    child.setAttribute('lazy-dom-id', lazyid);
            }
            this.dom.innerHTML += doc.body.innerHTML;
        });
    }
}
var $lazyload = new LazyLoad();
$lazyload.updateDomList();
