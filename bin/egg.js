(function($,window){
    //框架名字叫Egg
    window.Egg = {};

    /*左右两侧去空格*/
    var trim = function(string){
        return string.replace(/^\s*/,"").replace(/(\s*$)/,"");
    };
    /**
     * 扩充array的查找方法
     */
    if(!Array.prototype.has){
        Array.prototype.has = function(arg){
            var hasArg = false;
            this.forEach(function(item){
                if (item === arg) {
                    hasArg = true;
                    return false;
                }
            });
            return hasArg;
        };
    }
    /**
     * copy from internet
     * @return {string} the unique id
     */
    var uuid = function() {
        var s = [];
        var hexDigits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
        s[8] = s[13] = s[18] = s[23] = "-";

        var uuid = s.join("");
        return uuid;
    }
    /**
     * 链式继承，返回一个新的类
     * @param  {Object}
     * @return {Module}
     */
    var _extend =function(obj){
        var parent = this;
        var child = function(){
            parent.apply(this,arguments);
        }
        child.prototype = Object.create(parent.prototype || parent.__proto__);
        $.extend(child.prototype,obj);
        child.prototype.constructor = child;
        child.extend = _extend;
        return child;
    };

    /***************************************************************
    ****************************************************************
    **************************  监控虚拟树  *************************
    ****************************************************************
    ****************************************************************/
    /**
     * DS NodeTree
     */
     //TODO 监听值的变化
    var Node = Egg.Node = function(name){
        this.name = name || "";
        this.depth = 0;
        this.parent = undefined;
        this.children = [];
        this.unique = uuid();
        this.data = undefined;
        this.$rootDom = undefined;
        this.domSelector = undefined;
        this.callbackList = [];
    };
    Node.prototype = {
        /**
         * 增加一个子节点
         */
        add: function(node){
            var _this = this;
            this.children.push(node);
            node.parent = this;
            node.resetDepth(this.depth);
            var key = node.name;
            if(!node.parent)return;
            if(typeof node.parent[key] != "undefined")return;
            //在加入子节点的同时，给自己定义这个子节点对应的getter setter
            //这样就可以实现属性监控
            Object.defineProperty(node.parent,key,{
                set: function(val){
                    var setVal = function(node,val){
                        if(node.children.length>0){
                            console.log("非法赋值")
                            return;
                        }
                        //给所有watch的dom赋值
                        node.domSelector.forEach(function(dom){
                            var $watch = node.$rootDom.find(dom);
                            _this.setDomVal($watch,trim(val+''));
                        });
                    };
                    //如果这个值是个json
                    if(typeof val == "object" && !$.isArray(val)){
                    //那么向下遍历子树
                    //根据key的匹配结果赋值子树的value
                        for(var each in val){
                            var node = this.searchByName(each);
                            if(node){
                                if(node.children.length>0){
                                    node.parent[node.name] = val[each];
                                }else{
                                    setVal(node,val[each]);
                                }
                            }
                        }
                    }else{
                    //到达叶子节点
                    //不是json，只是普通变量，直接给这个节点赋值
                        var node = this.searchByName(key);
                        if(node){
                            setVal(node,val);
                        }
                    }
                },
                get: function(){
                    var node = this.searchByName(key);
                    if(node.children.length>0)
                        return node;
                    else{
                        //获取第一个元素的值就行拉
                        var $watch = node.$rootDom.find(node.domSelector.join(','));
                        var val = trim(_this.getDomVal($watch));
                        //做数值判断
                        if(/^\d+$/.test(val)){
                            return +val;
                        }else{
                            return val;
                        }
                    }
                }
            });
        },
        //向上冒泡发出一个事件
        bubble: function(event,path){
            path = path || [];
            path.push(this);
            this.parent.on(event,this,path);
        },
        //侦听事件
        on: function(event,node,path){
            var _this = this;
            var pathArr = [];
            path.forEach(function(node){
                pathArr.push(node.name);
            });
            if(this.depth == 0){
            //到此为止了
                if(event == 'change'){
                    this.callbackList.forEach(function(item){
                        if(pathArr.has(item.val)){
                            //返回改变了的值
                            if(node.children.length == 0)
                            //叶子节点返回值
                                item.callback(_this.search(path[0]).parent[path[0].name]);
                            else
                            //根节点返回json
                                item.callback(_this.search(path[path.length-1]).toJSON());
                        }
                    });
                }
            }else{
            //继续向上冒泡
                this.bubble(event,path);
            }
        },
        each: function(callback){
            var recursion = function(node){
                if(node.children.length>0){
                    node.children.forEach(function(child){
                        callback(child);
                        if(child.children.length>0){
                            recursion(child);
                        }
                    });
                }
            }
            recursion(this);
        },
        getChild: function(target){
            return this.getChildById(target.unique);
        },
        getChildByName: function(name){
            var target;
            this.children.forEach(function(child){
                if(child.name == name){
                    target = child;
                    return false;
                }
            });
            return target;
        },
        getChildById: function(id){
            var target;
            this.children.forEach(function(child){
                if(child.unique == id){
                    target = child;
                    return false;
                }
                return true;
            });
            return target;
        },
        getPath: function(){
            var path = [];
            var recursion = function(node){
                if(this.parent){
                    path.push(this.parent);
                    recursion(this.parent);
                }
            };
            recursion(this);
        },
        /**
         * 侦听一个监视变量的变化
         * 仅供root node使用
         */
        listen: function(val,callback){
            //防止其他节点误调用
            if (this.depth != 0) return;
            //注册
            this.callbackList.push({'val':val,'callback':callback});
        },
        /**
         * 删除对一个值的所有侦听
         * 仅供root node使用
         */
        stopListen: function(val){
            //防止其他节点误调用
            if (this.depth != 0) return;
            this.callbackList.forEach(function(item,idx,list){
                if(item.val == val){
                    delete list[idx];
                }
            });
        },
        removeChild: function(target){
            this.removeChildById(target.unique);
        },
        removeChildByName: function(name){

        },
        removeChildById: function(id){
            this.children.forEach(function(child,idx,children){
                if(child.unique == id){
                    delete children[idx];
                }
            });
        },
        remove: function(node){
            this.removeById(node.unique);
        },
        removeByName: function(name){

        },
        removeById: function(id){
            var target = this.searchById(id);
            target.parent.removeChild(target);
        },
        search: function(target){
            return this.searchById(target.unique);
        },
        searchByName: function(name){
            var result;
            this.each(function(node){
                if(node.name == name){
                    result = node;
                    return false;
                }
                return true;
            });
            return result;
        },
        searchById: function(id){
            var result;
            this.each(function(node){
                if(node.unique == id){
                    result = node;
                    return false;
                }
                return true;
            });
            return result;
        },
        resetDepth: function(depth){
            this.depth = depth+1;
            this.each(function(node){
                node.depth = node.parent.depth+1;
            });
        },
        getDomVal: function($el){
            if($el.is("input,select,textarea")){
                return $el.val();
            }else{
                return $el.text();
            }
        },
        setDomVal: function($el,val){
            if($el.is("input,select,textarea")){
                return $el.val(val);
            }else{
                return $el.text(val);
            }
        },
        //开始监控
        setWatch: function($rootDom,domSelector){
            var _this = this;
            hasDefault = false;
            this.$rootDom = $rootDom;
            this.domSelector = [];
            domSelector.split(/\,/).forEach(function(item){
                _this.domSelector.push(trim(item));
            });
            var l = this.domSelector.length;
            var $watchList = this.$rootDom.find(domSelector);
            //给dom元素赋值
            var setVal = function(e,val){
                if(arguments.length == 2){
                    var $targets = e;
                    $targets.val(val);
                    $targets.text(val);
                }else{
                    var $target = $(e.target);
                    var val = trim(_this.getDomVal($target));
                    $watchList.not(e.target).val(val);
                    $watchList.not(e.target).text(val);
                    //通知上层，我watch的值改变了
                    _this.bubble('change');
                }
            };
            for(var i=0; i<l; i++){
                var watch = this.domSelector[i];
                if (watch.match('this')) {
                //根节点
                    this.$rootDom.on('input', $.proxy(setVal,this));
                    this.$rootDom.on('change', $.proxy(setVal,this));
                } else {
                //子节点
                    this.$rootDom.on('input', watch, $.proxy(setVal,this));
                    this.$rootDom.on('change', watch, $.proxy(setVal,this));
                }
            };
            //初始化赋值
            if($watchList.filter('[data-watch="default"]').length > 0){
            //若有watch default，则
                var val = trim(this.getDomVal($watchList.filter('[data-watch="default"]')));
                setVal($watchList,val);
            }else{
            //若没有，则按最后一个调用
                var val = trim(this.getDomVal($watchList.last()));
                setVal($watchList,val);
            }
        },
        toJSON: function(){
            var json = {};
            var recursion = function(node,json){
                node.children.forEach(function(child){
                    if(child.children.length==0){
                        json[child.name] = child.parent[child.name];
                    }else{
                        json[child.name] = {};
                        recursion(child,json[child.name]);
                    }
                });
            }
            recursion(this,json);
            return json;
        }
    };
    //使用递归方法，建立子树和初始化节点树
    var jsonToNodeTree = Egg.jsonToNodeTree = function(json,name,$rootDom){
        name = name || "root";
        var root = new Node(name);
        var recursion = function(node,json){
            for(var key in json){
                var child = new Node(key);
                node.add(child);
                if(typeof json[key] == "object" && !$.isArray(json[key])){
                    recursion(child,json[key]);
                }else{
                    child.setWatch($rootDom,json[key]);
                }
            }
        };
        recursion(root,json);
        return root;
    };

    /***************************************************************
    ****************************************************************
    ******************************  Route  *************************
    ****************************************************************
    ****************************************************************/
    /**
     * 路由规则匹配器
     * @param rule String 规则
     * @param callback Function 匹配结果的回调函数
     * @return bool/Object 匹配结果
     */
    var Rule = function(rule,callback,target){
        this.rule = rule;
        this.callback = callback;
        this.target = target;
    }
    Rule.prototype.match = function(hash){
        //filter形式
        if(this.rule == hash)return true;
        //正则形式
        if(this.rule instanceof RegExp)
            if(hash.match(this.rule))return true;
        if(this.rule.match(/\/:/)){
            //根据规则生成成匹配值的正则
            var valRule = this.rule.replace(/\/:[a-zA-Z0-9_]+/g,'/(.+)');
            var valReg = new RegExp(valRule);
            //获取filter的规则
            var filterRule = this.rule.replace(/\/:[a-zA-Z0-9_]+/g,'');
            var filterReg = new RegExp(filterRule);
            //如果hash满足了值匹配的规则，证明param形式的router生效了
            if(hash.match(valReg)){
                //根据规则获取值的数组
                var valArr = hash.match(valReg);
                //获取filter
                var filter = valArr.shift().match(filterReg)[0];
                //生成param的key的数组
                var paramArr = this.rule.match(/\/:[a-zA-Z0-9_]+/g);
                //生成结果
                /**
                 * router匹配到的结果
                 * @type Object
                 * @param filter 规则过滤器
                 * @param [key] 根据匹配项生成的值
                 */
                var rslt = {'filter': filter};
                paramArr.forEach(function(param,idx){
                    rslt[param.replace(/^\/:/,'')] = valArr[idx];
                });
                return rslt;
            }
        }
        return false;
    }
    /**
     * 路由器
     *
     */
    var _Router = function(){
        this.rules = [];
        this.filter = '/';
        this.hashchange();
    };
    _Router.prototype = {
        constructor: _Router,
        on: function(rule,callback,target){
            this.rules.push(new Rule(rule,callback,target));
        },
        goto: function(){
            
        },
        hashchange: function(){
            var hashes =  window.location.hash.match(/#!([\S.]+)/) ?  window.location.hash.match(/#!([\S.]+)/) :  window.location.hash.match(/#([\S.]+)/);
            if(hashes && hashes.length>0){
                var hash = hashes[1];
            }
            if(hash){
                this.rules.forEach(function(rule){
                    var rlt = rule.match(hash);
                    if(rlt){
                        rule.callback.call(rule.target,rlt);
                    }
                });
                this.filter = hash;
            }
        }
    }
    //实例化router
    Router = new _Router;
    window.addEventListener('hashchange',function(){
        Router.hashchange();
    });

    /***************************************************************
    ****************************************************************
    *******************         EventSystem         ****************
    ****************************************************************
    ****************************************************************/
    var MsgListener = function(callback,self){
        this.callback = callback;
        this.self = self;
    };
    var Message = function(type){
        this.type = type;
        this.listeners = [];
    };
    var Radio = function(){
        this.messages = [];
    };
    Radio.prototype.broadcast = function(msg,data){
        this.messages.forEach(function(message){
            if(message.type == msg){
                for(var i=0; i<message.listeners.length; i++){
                    message.listeners[i].callback.call(message.listeners[i].self,data);
                }
            }
        });
    };
    Radio.prototype.on = function(type,callback,listener){
        for(var i=0; i<this.messages; i++){
            if(this.messages[i].type == type){
                //有重复的了
                //在重复的里面添加
                this.messages[i].listeners.push(new MsgListener(callback,listener));
                return;
            }
        }
        //没重复的，新建
        this.messages.push(new Message(type));
        this.messages[this.messages.length-1].listeners.push(new MsgListener(callback,listener));
    };
    var __radio = new Radio;



    var Event = function(param){
        this.target = param.target;
        this.type = param.type;
        this.data = param.data;
    };
    var EventHandler = function(parent){
        this.parent = parent;
        this.callbackList = [];
    };

    EventHandler.prototype.emit = function(type,data){
        if(this.parent)
            this.parent.stream(new Event({
                "type": type,
                "data": data,
                "target": this
            }));
    };
    EventHandler.prototype.stream = function(event){
        var _this = this;
        var isBubble = true;
        this.callbackList.forEach(function(callback){
            if(callback.type == event.type){
                callback.callback.call(_this,event);
                isBubble = callback.isBubble;
            }
        });
        if(this.parent && isBubble){
            this.parent.stream(event);
        }
    };
    EventHandler.prototype.on = function(type,callback,isBubble){
        isBubble = isBubble || true;
        this.callbackList.push({
            "type": type,
            "callback": callback,
            "isBubble": isBubble
        });
    };

    /***************************************************************
    ****************************************************************
    *******************         Service             ****************
    ****************************************************************
    ****************************************************************/
    var Service = Egg.Service = function(){
        EventHandler.call(this);
        this.uuid = uuid();
        if(!this.default.type)
            this.default.type = 'get';
    };
    Service.prototype = Object.create(EventHandler.prototype);
    $.extend(Service.prototype,{
        constructor: Service,
        default: {
            url: '/',
            type: 'get'
        },
        /**
         * 把一个对象url化
         * @param  {object}
         * @return {string}
         */
        urlify: function(data,url){
            for(var key in data){
                if(!url.match(/\?/)){
                    url += "?";
                    url +=  key+"="+data[key]+"&";
                }else{
                    url += "&";
                    url += key+"="+data[key]+"&";
                }
            }
            return url.replace(/&$/,"");
        },
        http: function(method,data){
            method = method || 'default';
            this.sync(this[method].url,this[method].type,data,method);
        },
        /**
         * 封装jq/zp的ajax调用，
         * @param  {string}
         * @param  {object}
         */
        sync: function(url,type,data,method){
            var _this = this;
            if(type == 'get'){
                if(data)
                    url = this.urlify(data,url);
            }
            var complete = function(xhr,status){
                if(status=="success"){
                    var json = JSON.parse(xhr.responseText) || null;
                }
                if(method == 'default')
                    _this.emit('complete',json)
                else
                    _this.emit(method,'complete',json);
            }
            if(type === "get"){
                $.ajax({
                    "type": type,
                    "url": url,
                    "complete": complete
                });
            }else{
                $.ajax({
                    "type": type,
                    "url": url,
                    'data': data || undefined,
                    "complete": complete
                });
            }
        }
    });

    /***************************************************************
    ****************************************************************
    *****************         Presenter             ****************
    ****************************************************************
    ****************************************************************/
    /**
     * 一个Array实例
     * 一个children list
     * 不可继承
     * 可以进行批量操作
     */
    var Collection = function(){
        Array.apply(this,arguments);
    };
    Collection.prototype = Object.create(Array.prototype);
    Collection.prototype.empty = function(){
        this.forEach(function(item,idx,array){
            item.$el.remove();
            delete array[idx];
        });
        var recursion = function(array){
            if(!array[array.length-1])
                array.pop();
            if(array.length>0)
                recursion(array);
        }
        recursion(this);
    };
    Collection.prototype.getLength = function(){
        var count = 0;
        this.forEach(function(item){
            if(item)
                count++;
        });
        return count;
    };
    /**
     * 删除一个元素
     * @param  {number or Module} id [description]
     * @return {[type]}    [description]
     */
    Collection.prototype.delete = function(unique){
        if(typeof unique == "number"){
            var id = unique;
        }else if(unique instanceof Module){
            var module = unique;
        }else if (typeof unique == "string"){
            var uuid = unique;
        }
        this.forEach(function(item,idx,array){
            if(idx == id || item == module || item.uuid == uuid){
                delete array[idx];
            }
        });
    };
    /**
     * 模块/Controller
     * @inherit from EventHandler
     * @param {jq/zp obj}
     */
    var Module = Egg.Presenter = Egg.ViewCtrl = function($el,parent,data){
        var _this = this;
        //inherit
        EventHandler.call(this,parent);
        //this.service
        if(this.service)
            this.service = new this.service;

        if(typeof $el == "string"){
            var type = $el;
            if(type == 'document'){
                $el = $(document.body);
            }else
                $el = $(document.body).find(type);
        }
        this.uuid = uuid();
        this.$el = $el || this.$el || $('document body');
        this.parent = parent;
       //渲染
       if(this.template){
            this.generate(data);
            if(this.beforeRender)
                this.beforeRender();
            this.render(type);
        }
        //如果是selector形势的domObj，init $ object by selector
        //check $el first
        if(typeof this.$el === "string"){
            this.$el = $(this.$el);
        }
        //check others
        for(var domObj in this){
            if(domObj.match(/^\$.*$/)){
                if(typeof this[domObj] == "string"){
                    this[domObj] = this.$el.find(this[domObj]);
                }
            }
        }
        //convert to nodeTree
        this.watch = jsonToNodeTree(this.watch,"watch",this.$el);
        if(this.afterRender)
            this.afterRender();
        //绑定点击事件，点击事件，最常用，所以作为快捷方式
        var bind = this.click || {};
        for(var key in bind){
             var dom = key;
             if(dom === "document")
                dom = document;
             var callback = bind[key];
             this.bindEvent(dom,"click",callback);
        }
        //dom事件
        var bind = this.domEvent || {};
        for(var key in bind){
            var event = key.match(/^.+\s/)[0];
            var dom = key.split(/^.+\s+/)[1];
            if(dom === "document")
                dom = document;
            var callback = bind[key];
            this.bindEvent(dom,event,callback);
        }
        //绑定自定义事件
        var bind = this.event || {};
        for(var key in bind){
             var type = key;
             var callback = bind[key];
             this.bindEvent(type,"event",callback);
        }

        //collection
        if(this.collection){
            var collection = [];
            $.extend(true,collection,this.collection);
            this.collection = new Collection;
            //@param1 Module的类  ,  @param2 dom的类名
            this.mapCollection(collection[0],collection[1])
        }else{
            this.collection = new Collection;
        }
        this.collection.append = function (Module,data) {
            _this.collection.push(new Module("append",_this,data));
        };
        //子模块
        if(this.sub){
            var sub = {};
            $.extend(true,sub,this.sub);
            this.sub = {};
            for(var key in sub){
                /**
                 * @Param1 模块名
                 * @param2 模块dom类名
                 * @param3 模块类
                 */
                this.mapSubModule(key,sub[key][0],sub[key][1])
            }
        }else{
            this.sub = {};
        }
        //广播
        var radioCallback = this.radio;
        this.radio = __radio;
        for(var key in radioCallback){
            this.radio.on(key,this[key],this);
        }
        //路由
        if(this.router){
            for(var route in this.router){
                Router.on(route,this[this.router[route]],this);
            }
        };
        this.router = Router;
       //执行user自定义初始化
        this.init();
    };
    /**
     * prototype
     * @type {Object}
     */
    Module.prototype = {
        constructor: Module,
        template:undefined,
        /**
         * 父模块
         * @type {Module}
         */
        parent: undefined,
        /**
         * 子模块
         * wait to Override
         * @type {Object}
         */
        sub:undefined,
        subCount:0,
        /**
         * 子模块列表
         * 用户传入值
         * wait to Override
         * @type {Children}
         */
        collection: undefined,/*{
            el:"",
            module:Module
        },*/
        /**
         * wait to override
         * @type {obj}
         */
        click:undefined,
        /**
         * wait to override
         * @type {obj}
         */
        event: undefined,
        radio: undefined,
        /**
         * 默认模块根，是document
         * @type {[type]}
         */
        $el: undefined,
        /**
         * wait to Override
         * 监控属性集合
         * @type {Object}
         */
        watch: {
            //wait to Override
        },
        /**
         * wait to Override
         */
        init: function(){
            //wait to Override
        },
        //wait to Override
        router: undefined,

        /**
         * 绑定一个dom事件到一个自定义函数
         * @param  {dom}
         * @param  {string}
         * @param  {Function}
         */
        bindEvent: function(dom,event,callback){
            var _this = this;
            callback = this[callback];
            if(event=="event"){
                var type = dom;
                //自定义事件
                this.on(type,callback)
                return;
            }
            if(dom == "this"){
                this.$el.on(event,function(e){
                    callback.call(_this,e);
                });
            }else{
                if(this.$el.find(dom).length==0){
                    $(document).on(event,dom,function(e){
                        callback.call(_this,e);
                    });
                }else{
                    this.$el.on(event,dom,function(e){
                        callback.call(_this,e);
                    });
                }
            }
        },
        append: function(name,Module,data){
            if(arguments.length==2){
                data = Module
                Module = name;
                this.sub[this.subCount] = new Module("append",this,data,this.subCount);
                this.subCount++;
            }else
                this.sub[name] = new Module("append",this,data);
        },
        create: function(name,Module,data){
            if(arguments.length==2){
                data = Module
                Module = name;
                this.sub[this.subCount] = new Module("create",this,data,this.subCount);
                this.subCount++;
            }else
                this.sub[name] = new Module("create",this,data);
        },
        appendCollection: function(Module,array){
            array.forEach($.proxy(function(item){
                this.collection.push(new Module("append",this,item));
            },this));
        },
        createCollection: function(Module,array){
            this.collection.empty();
            this.$el.empty();
            array.forEach($.proxy(function(item){
                this.collection.push(new Module("append",this,item));
            },this));
        },
        generate: function(data){
            this.$el = $(this.template(data));
        },
        beforeRender: undefined,
        render: function(type){
            if(type == "append")
                this.parent.$el.append(this.$el);
            if(type == "create")
                this.parent.$el.html(this.$el);
        },
        afterRender: undefined,
        mapSubModule: function(moduleName,elClass,Module){
            this.sub[moduleName] = new Module(this.$el.find(elClass),this);
        },
        mapCollection: function(el,Module){
            if(this.$el.find(el).length>0){
                var $el = this.$el.find(el);
            }else{
                var $el = $(el);
            }
            $el.each($.proxy(function(idx,itemEl){
                this.collection.push( new Module($(itemEl),this) );
            },this));
        },
        remove: function(){
            this.$el.remove();
            if(this.parent){
                var _this = this;
                this.parent.collection.forEach(function(item){
                    if(item.uuid == _this.uuid){
                        _this.parent.collection.delete(_this.uuid);
                    }
                });
                for(var key in this.parent.sub){
                    if(this.parent.sub[key].uuid == this.uuid){
                        delete this.parent.sub[key];
                    }
                };
            }
        },
        /**
         * 隐藏模块根dom的快捷方式
         */
        hide: function(){
            this.$el.hide();
        },
        /**
         * 显示模块根dom的快捷方式
         */
        show: function(){
            this.$el.show();
        }
    }
    $.extend(Module.prototype,Object.create(EventHandler.prototype));

/**
 * 装配
 */
Egg.Presenter = Egg.ViewCtrl = Egg.Module = Module;
Egg.Presenter.extend = Service.extend = _extend;

})($,window);
