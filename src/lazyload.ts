
class LazyLoad {
    rundynamic: Boolean = true;
    list: LazyDom[] = [];

    page_key: string = 'page';

    constructor() {
    }

    updateDomList() {
        if (this.rundynamic == true || this.list.length == 0) {
            let doms: NodeListOf<Element> = document.querySelectorAll('*[lazy-load]');

            doms.forEach(element => {
                this.create(element);
            })
        }
        return this.list;
    }

    create(dom: Element | LazyDom) {
        if (dom instanceof Element) {
            if (dom.getAttribute('lazy-load') == '')
                this.list.push(new LazyDom(dom));
        } else {
            this.list.push(dom);
        }
    }

    insertDom(dom: LazyDom) {
        this.list.forEach(dom_element => {
            if (dom_element.code == dom.code)
                return false;
        });
        return true;
    }

    request(callback: Function, method: string, url: string = '', data: object = {}, page: number = 0) {
        let xhr: XMLHttpRequest = new XMLHttpRequest();

        (<any>Object).assign(data, { [this.page_key]: page.toString() });

        let sending_data = null;
        switch (method.toUpperCase()) {
            case 'POST':
                let urlEncodedDataPairs = [], name;
                for (name in data) {
                    urlEncodedDataPairs.push(encodeURIComponent(name) + '=' + encodeURIComponent((<any>data)[name]));
                }
                sending_data = urlEncodedDataPairs.join('&');

                xhr.open('POST', url, true);
                xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
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

                if (use_query) {
                    url += `?${search_params.toString()}`;
                }

                xhr.open('GET', url, true);
                xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
                break;

            default:
                console.error(`'${method.toUpperCase()}' is not supported`);
                return;
        }


        xhr.onload = function () {
            callback(xhr.status, xhr.responseText, xhr);
        }
        xhr.send(sending_data);

        return xhr;
    }
}


class LazyDom {
    public dom: Element;
    public code: String = '';

    public page: number = 0;

    private template: String;

    private block_new_request = false;

    constructor(dom: Element | String) {

        if (dom instanceof String) {
            let _dom = document.querySelector(`*[lazy-load=${dom}]`);
            if (_dom != void 0) {
                this.dom = _dom;
            }
        } else {
            this.dom = dom;
        }

        // Save Template
        this.template = this.dom.innerHTML;

        // Clear content
        this.dom.innerHTML = "";

        // Set uniq code
        this.code = this.generateCode();
        this.dom.setAttribute('lazy-load', this.code.toString());

        // insert dom in dom list
        $lazyload.insertDom(this);

        // initial content
        this.updateContent(this.page);

        let pagination: string | null = this.dom.getAttribute('lazy-load-pagination');

        if (pagination == void 0)
            this.dom.addEventListener('scroll', (event) => {
                let {
                    scrollTop,
                    scrollHeight,
                    clientHeight
                } = this.dom;

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
        }

        return (fourChars() + fourChars() + "-" + fourChars() + "-" + fourChars() + "-" + fourChars() + "-" + fourChars() + fourChars() + fourChars());
    }

    updateContent(page: number | null, updatepage: boolean = true) {

        if (this.block_new_request) return;

        let data: string | null = this.dom.getAttribute('lazy-load-data');
        let url: string | null = this.dom.getAttribute('lazy-load-url');
        let method: string | null = this.dom.getAttribute('lazy-load-method');
        let pagination: boolean | string | null = this.dom.getAttribute('lazy-load-pagination');

        if (method == void 0)
            method = 'GET';

        if (url == void 0)
            url = document.URL;

        let data_obj = {};
        if (data != void 0)
            data_obj = JSON.parse(data);

        if (page == void 0)
            page = 0

        if (pagination == void 0) {
            this.block_new_request = true;
            pagination = false
        }
        else {
            pagination = true
        }

        let _this = this;
        $lazyload.request(function (status: number, responseText: string, xhr: any) {

            if (status === 200) {
                let _data = JSON.parse(responseText);

                if (pagination)
                    _this.setPagination(_data.stat);
                _this.setContent(_data.result, <boolean>pagination);

                _this.block_new_request = false;
            }

        }, method, url, data_obj, page);

        if (page == this.page && updatepage) {
            this.page++;
        }

    }

    clearContent(){
        this.dom.innerHTML = "";
    }

    goPageHandler(button: HTMLElement) {
        const getLazyParent = (element: HTMLElement): string | null => {
            const parent = element.closest('[lazy-parent]');
            return parent ? parent.getAttribute('lazy-parent') : null;
        };
        const lazyParent = getLazyParent(button);
        const lazyTarget = button.getAttribute('lazy-target');
        console.log(`Lazy Parent: ${lazyParent}, Lazy Target: ${lazyTarget}`);

        let target_page : number;

        if(lazyTarget == undefined || lazyTarget == null)
            return;

        target_page = parseInt(lazyTarget);

        this.clearContent();
        this.updateContent(target_page);
    }

    setPagination(stat: { current_page: number; max_page: number }) {
        const lazyParent = this.dom.getAttribute('lazy-load');
        if (!lazyParent) return;

        const existingPagination = this.dom.nextElementSibling?.classList.contains('pagination-wrapper');
        if (existingPagination) {
            this.dom.nextElementSibling?.remove();
        }

        const paginationWrapper = document.createElement('div');
        paginationWrapper.className = 'pagination-wrapper lazy-load-paginations';
        paginationWrapper.setAttribute('lazy-parent', lazyParent);

        const createButton = (text: string, lazyTarget: number | null, disabled: boolean = false) => {
            const button = document.createElement('button');
            button.innerText = text;
            button.className = 'pagination-btn';
            button.disabled = disabled;
            button.style.cursor = disabled ? 'not-allowed' : 'pointer';

            if (lazyTarget !== null) button.setAttribute('lazy-target', lazyTarget.toString());

            if (!disabled) {
                button.addEventListener('click', () => this.goPageHandler(button));
            }

            return button;
        };

        const { current_page, max_page } = stat;

        // "<<" İlk sayfaya git
        if(current_page > 2)
            paginationWrapper.appendChild(createButton('<<', 0, current_page === 1));

        // "<" Bir önceki sayfaya git
        if(current_page > 0)
            paginationWrapper.appendChild(createButton('<', current_page - 1, false));

        // Orta sayfa numaralarını hesapla
        const startPage = Math.max(0, current_page - 2); // Başlangıç
        const endPage = Math.min(max_page, current_page + 2); // Bitiş

        // "..." başlangıcında ekle
        if (startPage > 2) {
            paginationWrapper.appendChild(createButton('...', null, true));
        }

        // Sayfa numaralarını ekle
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === current_page;
            const btn = createButton((i + 1).toString(), i, isActive);
            if (isActive) {
                btn.classList.add('active');
            }
            paginationWrapper.appendChild(btn);
        }

        // "..." sonunda ekle
        if (endPage < max_page - 2) {
            paginationWrapper.appendChild(createButton('...', null, true));
        }

        // ">" Bir sonraki sayfaya git
        if(current_page < max_page)
            paginationWrapper.appendChild(createButton('>', current_page + 1, current_page === max_page));

        // ">>" Son sayfaya git
        if(current_page < max_page - 2)
            paginationWrapper.appendChild(createButton('>>', max_page, current_page === max_page));

        // Pagination'u DOM'a ekle
        this.dom.parentNode?.insertBefore(paginationWrapper, this.dom.nextSibling);
    }

    setContent(data: object[], pagination: boolean = false) {

        let parser = new DOMParser();
        let doc: Document;

        data.forEach(element => {
            let template: String = this.template;
            let lazyid: any = null;

            for (let key in element) {
                if (element.hasOwnProperty(key)) {
                    template = template.replace(`[[${key}]]`, element[key as keyof typeof element]);

                    if (key == 'lazy-id' || key == 'lazyid' || key == 'id') {
                        lazyid = element[key as keyof typeof element];
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