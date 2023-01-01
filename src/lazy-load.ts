class LazyDom {
    public dom:Element;

    constructor() {
        
    }
}

class lazyload {
    rundynamic:Boolean = true;
    lazyselector:string = '*[lazy-load]';
    list:LazyDom[];
    
    constructor(selector:string) {
        if(selector != void 0){
            this.lazyselector = selector;
        }
        // this.list = document.querySelectorAll(this.lazyselector);
        this.loadall();
    }

    loadall(){
        this.get_lazy().forEach(element => {
            let data:object = {};
            let url:string = '';
            let method:string|null = element.dom.getAttribute('lazy-load-method');

            if(method )

            this.request(method, element, url, data);
        });
    }

    get_lazy(){
        if (this.rundynamic == true) {
            // return document.querySelectorAll(this.lazyselector);
        }
        return this.list;
    }

    request(method:string, elem:LazyDom, url:string = '', data:object = {}) {
        
        let xhr:XMLHttpRequest = new XMLHttpRequest();
        switch (method.toUpperCase()) {
            case 'POST':
                xhr.open('POST', url, true);
                xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
                xhr.send(JSON.stringify(data));
                break;

            case 'GET':
                // xhr.open('GET', `${url}${new URLSearchParams(data).toString()}`, true);
                // xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
                break;
        
            default:
                console.error(`'${method.toUpperCase()}' is not supported`);
                break;
        }
        
        xhr.onload = function () {
            if(xhr.status === 201) {
                console.log("Post successfully created!") 
            }
        }

        xhr.send();
    }
}