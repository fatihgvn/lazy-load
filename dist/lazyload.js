"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var LazyLoad = (function () {
    function LazyLoad(selector) {
        this.rundynamic = true;
        this.lazyselector = '*[lazy-load]';
        this.list = [];
        if (selector != void 0) {
            this.lazyselector = selector;
        }
    }
    LazyLoad.prototype.run = function () {
        this.get_lazy().forEach(function (element) {
            element.updateContent();
        });
    };
    LazyLoad.prototype.get_lazy = function () {
        var _this_1 = this;
        if (this.rundynamic == true || this.list.length == 0) {
            var doms = document.querySelectorAll(this.lazyselector);
            doms.forEach(function (element) {
                _this_1.list.push(new LazyDom(element));
            });
        }
        return this.list;
    };
    LazyLoad.prototype.request = function (method, url, data) {
        if (url === void 0) { url = ''; }
        if (data === void 0) { data = {}; }
        var xhr = new XMLHttpRequest();
        switch (method.toUpperCase()) {
            case 'POST':
                xhr.open('POST', url, true);
                xhr.send(JSON.stringify(data));
                break;
            case 'GET':
                var search_params = new URLSearchParams();
                for (var key in data) {
                    if (Object.prototype.hasOwnProperty.call(data, key)) {
                        var val = data[key];
                        search_params.set(key, val);
                    }
                }
                xhr.open('GET', "".concat(url).concat(search_params.toString()), true);
                break;
            default:
                console.error("'".concat(method.toUpperCase(), "' is not supported"));
                return;
        }
        xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
        var _this = this;
        xhr.onload = function () {
            if (xhr.status === 200) {
                if (_this instanceof LazyDom) {
                    _this.setContent(JSON.parse(xhr.responseText));
                }
            }
        };
        xhr.send();
    };
    return LazyLoad;
}());
var LazyDom = (function (_super) {
    __extends(LazyDom, _super);
    function LazyDom(dom) {
        var _this_1 = _super.call(this, null) || this;
        if (dom instanceof String) {
            var _dom = document.querySelector("*[lazy-load=".concat(dom, "]"));
            if (_dom != void 0) {
                _this_1.dom = _dom;
            }
        }
        else {
            _this_1.dom = dom;
        }
        _this_1.template = _this_1.dom.innerHTML;
        _this_1.dom.innerHTML = "";
        _this_1.dom.setAttribute('lazy-load', _this_1.generateCode());
        return _this_1;
    }
    LazyDom.prototype.generateCode = function () {
        var fourChars = function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1).toUpperCase();
        };
        return (fourChars() + fourChars() + "-" + fourChars() + "-" + fourChars() + "-" + fourChars() + "-" + fourChars() + fourChars() + fourChars());
    };
    LazyDom.prototype.updateContent = function () {
        var data = this.dom.getAttribute('lazy-load-data');
        var url = this.dom.getAttribute('lazy-load-url');
        var method = this.dom.getAttribute('lazy-load-method');
        if (method == void 0)
            method = 'GET';
        if (url == void 0)
            url = document.URL;
        var data_obj = {};
        if (data != void 0)
            data_obj = JSON.parse(data);
        this.request(method, url, data_obj);
    };
    LazyDom.prototype.setContent = function (data) {
        var _this_1 = this;
        data.forEach(function (element) {
            var template = _this_1.template;
            for (var key in element) {
                if (element.hasOwnProperty(key)) {
                    template = template.replace("[[".concat(key, "]]"), element[key]);
                }
            }
            _this_1.dom.innerHTML += template;
        });
    };
    return LazyDom;
}(LazyLoad));
