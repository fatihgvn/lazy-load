
class LazyLoad {
    rundynamic:Boolean = true;
    lazyselector:string = '*[lazy-load]';
    list:LazyDom[] = [];
    
    constructor(selector:string|null) {
        if(selector != void 0){
            this.lazyselector = selector;
        }
    }

    run(){
        this.get_lazy().forEach(element => {
            element.updateContent();
        });
    }

    get_lazy(){
        if (this.rundynamic == true || this.list.length == 0) {
            let doms:NodeListOf<Element> = document.querySelectorAll(this.lazyselector);

            doms.forEach(element => {
                this.list.push(new LazyDom(element));
            })
        }
        return this.list;
    }

    request(method:string, url:string = '', data:object = {}) {
        
        let xhr:XMLHttpRequest = new XMLHttpRequest();

        switch (method.toUpperCase()) {
            case 'POST':
                xhr.open('POST', url, true);
                xhr.send(JSON.stringify(data));
                break;

            case 'GET':
                let search_params = new URLSearchParams();

                for (let key in data) {
                    if (Object.prototype.hasOwnProperty.call(data, key)) {
                        let val = data[key as keyof typeof data];
                        search_params.set(key, val);
                    }
                }

                xhr.open('GET', `${url}${search_params.toString()}`, true);
                break;
        
            default:
                console.error(`'${method.toUpperCase()}' is not supported`);
                return;
        }
        
        xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');

        var _this = this;
        xhr.onload = function () {
            if(xhr.status === 200) {
                if (_this instanceof LazyDom) {
                    _this.setContent(JSON.parse(xhr.responseText));
                }
            }
        }

        xhr.send();
    }
}


class LazyDom extends LazyLoad {
    public dom:Element;

    private template:String;

    constructor(dom:Element|String) {
        super(null);

        if(dom instanceof String){
            let _dom = document.querySelector(`*[lazy-load=${dom}]`);
            if (_dom != void 0) {
                this.dom = _dom;                
            }
        }else{
            this.dom = dom;
        }

        // Save Template
        this.template = this.dom.innerHTML;

        // Clear content
        this.dom.innerHTML = "";
        
        // Set uniq code
        this.dom.setAttribute('lazy-load', this.generateCode());
    }

    generateCode(){
        var fourChars = function() {
            return (((1 + Math.random()) * 0x10000)|0).toString(16).substring(1).toUpperCase();
        }

        return (fourChars() + fourChars() + "-" + fourChars() + "-" + fourChars() + "-" + fourChars() + "-" + fourChars() + fourChars() + fourChars());
    }

    updateContent(){
        let data:string|null = this.dom.getAttribute('lazy-load-data');
        let url:string|null = this.dom.getAttribute('lazy-load-url');
        let method:string|null = this.dom.getAttribute('lazy-load-method');

        if(method == void 0)
            method = 'GET';
        
        if(url == void 0)
            url = document.URL;
    
        let data_obj = {};
        if(data != void 0)
            data_obj = JSON.parse(data);

        this.request(method, url, data_obj);
    }

    setContent(data:object[]){
        
        data.forEach(element => {
            let template = this.template;

            for (let key in element) {
                if (element.hasOwnProperty(key)) {
                    template = template.replace(`[[${key}]]`, element[key as keyof typeof element]);
                }
            }

            this.dom.innerHTML += template;
        });
        
    }
}