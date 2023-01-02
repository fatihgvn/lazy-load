
class LazyLoad {
    rundynamic:Boolean = true;
    list:LazyDom[] = [];

    page_key:string = 'page';
    
    constructor() {
    }

    updateDomList(){
        if (this.rundynamic == true || this.list.length == 0) {
            let doms:NodeListOf<Element> = document.querySelectorAll('*[lazy-load]');

            doms.forEach(element => {
                this.create(element);
            })
        }
        return this.list;
    }

    create(dom:Element){
        if(dom.getAttribute('lazy-load') == '')
            this.list.push(new LazyDom(dom));
    }

    request(method:string, url:string = '', data:object = {}, page:number = 0) {
        let xhr:XMLHttpRequest = new XMLHttpRequest();

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
                        let val = data[key as keyof typeof data];
                        search_params.set(key, val);

                        use_query = true;
                    }
                }

                if(use_query){
                    url += `?${search_params.toString()}`;
                }

                xhr.open('GET', url, true);
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
        super();

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

        this.updateContent(0);

        this.dom.addEventListener('scroll', (event) => {
            let {
                scrollTop,
                scrollHeight,
                clientHeight
            } = this.dom;

            if (scrollTop + clientHeight >= scrollHeight - 5) {
                
            }
        }, {
            passive: true
        });
    
    }

    generateCode(){
        var fourChars = function() {
            return (((1 + Math.random()) * 0x10000)|0).toString(16).substring(1).toUpperCase();
        }

        return (fourChars() + fourChars() + "-" + fourChars() + "-" + fourChars() + "-" + fourChars() + "-" + fourChars() + fourChars() + fourChars());
    }

    updateContent(page:number|null){
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

        if(page == void 0)
            page = 0

        this.request(method, url, data_obj, page);
    }

    setContent(data:object[]){
        
        let parser = new DOMParser();
        let doc:Document;

        data.forEach(element => {
            let template:String = this.template;
            let lazyid:any = null;

            for (let key in element) {
                if (element.hasOwnProperty(key)) {
                    template = template.replace(`[[${key}]]`, element[key as keyof typeof element]);

                    if(key == 'lazy-id' || key == 'lazyid' || key == 'id'){
                        lazyid = element[key as keyof typeof element];
                    }
                }
            }

            doc = parser.parseFromString(template.toString(), 'text/html');

            if(lazyid != void 0){
                let child = doc.body.children.item(0);
                if(child != null)
                    child.setAttribute('lazy-dom-id', lazyid);
            }

            this.dom.innerHTML += doc.body.innerHTML;
        });
        
    }
}

var $lazyload = new LazyLoad();
$lazyload.updateDomList();