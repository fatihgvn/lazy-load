"use strict";
class LazyLoad {
    constructor() {
        this.customMethods = {};
        this.rundynamic = true;
        this.list = [];
        this.page_key = 'page';
    }
    setMethod(method, callback) {
        this.customMethods[method.toUpperCase()] = callback;
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
    defaultGetMethod(xhr, url, data, page) {
        let search_params = new URLSearchParams();
        search_params.set(this.page_key, page.toString());
        for (let key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                let val = data[key];
                search_params.set(key, val);
            }
        }
        url += `?${search_params.toString()}`;
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
    }
    defaultPostMethod(xhr, url, data, page) {
        let urlEncodedDataPairs = [], name;
        Object.assign(data, { [this.page_key]: page.toString() });
        for (name in data) {
            urlEncodedDataPairs.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]));
        }
        const sending_data = urlEncodedDataPairs.join('&');
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        return sending_data;
    }
    request(callback, method, url = '', data = {}, page = 0) {
        const methodUpperCase = method.toUpperCase();
        if (this.customMethods[methodUpperCase]) {
            const result = this.customMethods[methodUpperCase](url, data, page);
            if (this.isValidResponse(result)) {
                callback(result.response_code, result);
            }
        }
        else {
            let xhr = new XMLHttpRequest();
            let sending_data = null;
            switch (methodUpperCase) {
                case 'GET':
                    this.defaultGetMethod(xhr, url, data, page);
                    break;
                case 'POST':
                    sending_data = this.defaultPostMethod(xhr, url, data, page);
                    break;
                default:
                    console.error(`'${methodUpperCase}' is not supported`);
                    return;
            }
            xhr.onload = function () {
                callback(xhr.status, xhr.responseText);
            };
            xhr.send(sending_data);
            return xhr;
        }
    }
    isValidResponse(response) {
        return (typeof response === 'object' &&
            response !== null &&
            response.hasOwnProperty('response_code') &&
            response.hasOwnProperty('stat') &&
            response.hasOwnProperty('result') &&
            typeof response.stat === 'object' &&
            typeof response.stat.current_page === 'number' &&
            typeof response.stat.max_page === 'number' &&
            Array.isArray(response.result));
    }
}
class LazyDom {
    constructor(dom) {
        this.code = '';
        this.page = 0;
        this.block_new_request = false;
        if (typeof dom === 'string') {
            let _dom = document.querySelector(`*[lazy-load=${dom}]`);
            if (_dom) {
                this.dom = _dom;
            }
            else {
                throw new Error(`Element not found for selector: *[lazy-load=${dom}]`);
            }
        }
        else if (dom instanceof Element) {
            this.dom = dom;
        }
        else {
            throw new Error('Invalid parameter for LazyDom constructor. Must be a string or Element.');
        }
        this.setTemplate();
        this.clearContent();
        this.code = this.generateCode();
        this.dom.setAttribute('lazy-load', this.code.toString());
        Lazyload.insertDom(this);
        this.updateContent(this.page);
        let pagination = this.dom.getAttribute('lazy-load-pagination');
        if (pagination == void 0) {
            var _this = this;
            this.dom.addEventListener('scroll', (event) => {
                let { scrollTop, scrollHeight, clientHeight } = _this.dom;
                if (scrollTop + clientHeight >= scrollHeight - 5) {
                    _this.updateContent(_this.page);
                }
            }, {
                passive: true
            });
        }
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
        let data = this.dom.getAttribute('lazy-load-data');
        let url = this.dom.getAttribute('lazy-load-url');
        let method = this.dom.getAttribute('lazy-load-method');
        let pagination = this.dom.getAttribute('lazy-load-pagination');
        if (method == void 0)
            method = 'GET';
        if (url == void 0)
            url = document.URL;
        let data_obj = {};
        if (data != void 0)
            data_obj = JSON.parse(data);
        if (page == void 0)
            page = 0;
        if (pagination == void 0) {
            this.block_new_request = true;
            pagination = false;
        }
        else {
            pagination = true;
        }
        let _this = this;
        Lazyload.request(function (status, responseText) {
            if (status === 200) {
                let _data = responseText;
                if (typeof responseText === 'string')
                    _data = JSON.parse(responseText);
                if (pagination)
                    if (!(!_data.stat || typeof _data.stat.current_page !== 'number' || typeof _data.stat.max_page !== 'number'))
                        _this.setPagination(_data.stat);
                _this.setContent(_data.result, pagination);
                _this.block_new_request = false;
            }
        }, method, url, data_obj, page);
        if (page == this.page && updatepage) {
            this.page++;
        }
    }
    setTemplate() {
        if (this.dom.tagName.toLowerCase() === 'table') {
            const tbody = this.dom.querySelector('tbody');
            if (tbody) {
                this.template = tbody.innerHTML;
            }
        }
        else {
            this.template = this.dom.innerHTML;
        }
    }
    clearContent() {
        if (this.dom.tagName.toLowerCase() === 'table') {
            const tbody = this.dom.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = "";
            }
        }
        else {
            this.dom.innerHTML = "";
        }
    }
    goPageHandler(button) {
        const getLazyParent = (element) => {
            const parent = element.closest('[lazy-parent]');
            return parent ? parent.getAttribute('lazy-parent') : null;
        };
        const lazyParent = getLazyParent(button);
        const lazyTarget = button.getAttribute('lazy-target');
        console.log(`Lazy Parent: ${lazyParent}, Lazy Target: ${lazyTarget}`);
        let target_page;
        if (lazyTarget == undefined || lazyTarget == null)
            return;
        target_page = parseInt(lazyTarget);
        this.clearContent();
        this.updateContent(target_page);
    }
    setPagination(stat) {
        var _a, _b, _c;
        const lazyParent = this.dom.getAttribute('lazy-load');
        if (!lazyParent)
            return;
        const existingPagination = (_a = this.dom.nextElementSibling) === null || _a === void 0 ? void 0 : _a.classList.contains('pagination-wrapper');
        if (existingPagination) {
            (_b = this.dom.nextElementSibling) === null || _b === void 0 ? void 0 : _b.remove();
        }
        const paginationWrapper = document.createElement('div');
        paginationWrapper.className = 'pagination-wrapper lazy-load-paginations';
        paginationWrapper.setAttribute('lazy-parent', lazyParent);
        const createButton = (text, lazyTarget, disabled = false) => {
            const button = document.createElement('button');
            button.innerText = text;
            button.className = 'pagination-btn';
            button.disabled = disabled;
            button.style.cursor = disabled ? 'not-allowed' : 'pointer';
            if (lazyTarget !== null)
                button.setAttribute('lazy-target', lazyTarget.toString());
            if (!disabled) {
                button.addEventListener('click', () => this.goPageHandler(button));
            }
            return button;
        };
        const { current_page, max_page } = stat;
        if (current_page > 2)
            paginationWrapper.appendChild(createButton('<<', 0, current_page === 1));
        if (current_page > 0)
            paginationWrapper.appendChild(createButton('<', current_page - 1, false));
        const startPage = Math.max(0, current_page - 2);
        const endPage = Math.min(max_page, current_page + 2);
        if (startPage > 2) {
            paginationWrapper.appendChild(createButton('...', null, true));
        }
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === current_page;
            const btn = createButton((i + 1).toString(), i, isActive);
            if (isActive) {
                btn.classList.add('active');
            }
            paginationWrapper.appendChild(btn);
        }
        if (endPage < max_page - 2) {
            paginationWrapper.appendChild(createButton('...', null, true));
        }
        if (current_page < max_page)
            paginationWrapper.appendChild(createButton('>', current_page + 1, current_page === max_page));
        if (current_page < max_page - 2)
            paginationWrapper.appendChild(createButton('>>', max_page, current_page === max_page));
        (_c = this.dom.parentNode) === null || _c === void 0 ? void 0 : _c.insertBefore(paginationWrapper, this.dom.nextSibling);
    }
    setContent(data, pagination = false) {
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
            if (this.dom.tagName.toLowerCase() === 'table') {
                doc = parser.parseFromString("<table>" + template.toString() + "</table>", 'text/html');
            }
            else {
                doc = parser.parseFromString(template.toString(), 'text/html');
            }
            if (lazyid != void 0) {
                let child = doc.body.children.item(0);
                if (this.dom.tagName.toLowerCase() === 'table') {
                    child = doc.querySelector('tr');
                }
                if (child != null)
                    child.setAttribute('lazy-dom-id', lazyid);
            }
            if (this.dom.tagName.toLowerCase() === 'table') {
                const tbody = this.dom.querySelector('tbody');
                if (tbody) {
                    let ndata = doc.querySelector('tbody');
                    if (!ndata)
                        return;
                    tbody.innerHTML += ndata.innerHTML;
                }
            }
            else {
                this.dom.innerHTML += doc.body.innerHTML;
            }
        });
    }
}
var Lazyload = new LazyLoad();
