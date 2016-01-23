/*
* @Author: zhaoye-ds1
* @Date:   2015-08-07 15:59:09
* @Last Modified by:   zhaoye-ds1
* @Last Modified time: 2015-08-24 18:17:08
*/
(function($,window,undefined){
    var Fry = {};
/***************************************************************
****************************************************************
*************************  要用到的数据结构  *******************
****************************************************************
****************************************************************/
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
     * DS NodeTree
     */
    var Node = function(name){
        this.name = name || "";
        this.depth = 0;
        this.parent = undefined;
        this.children = [];
        this.unique = uuid();
        this.data = undefined;
        this.$watch = undefined;
    };
    Node.prototype = {
        add: function(node){
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
                        var limit = node.$watch.length;
                        for(var i=0; i< limit; i++){
                            var $watch = $(node.$watch[i]);
                            if($watch.is("input,textarea,select"))
                                $watch.val(val);
                            else
                                $watch.text(val);
                        }
                    };
                    if(typeof val == "object" && !$.isArray(val)){
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
                        var node = this.searchByName(key);
                        if(node){
                            setVal(node,val);
                        }
                    }
                },
                get: function(){
                    var trim = function(str){
                        return str.replace(/^\s*/,"").replace(/(\s*$)/,"");
                    };
                    var node = this.searchByName(key);
                    if(node.children.length>0)
                        return node;
                    else{
                        var $watch = $(node.$watch[0]);
                        if($watch.is("input,select,textarea")){
                            var val = trim($watch.val());
                        }else{
                            var val = trim($watch.text());
                        }
                        if(/^\d+$/.test(val)){
                            return Number(val);
                        }else{
                            return val;
                        }
                    }
                }
            });
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
        setWatch: function($el){
            hasDefault = false;
            this.$watch = $el;
            var l = this.$watch.length;
            var setVal = function($target,$watch,emitter){
                if($target.is("input,select,textarea")){
                    var val = $target.val().replace(/^\s*/,"").replace(/(\s*$)/,"");
                }else{
                    var val = $target.text().replace(/^\s*/,"").replace(/(\s*$)/,"");
                }
                for(var i=0; i<l; i++){
                    if($watch[i] == emitter){
                        //dont change
                    }else{
                        $($watch[i]).val(val);
                        $($watch[i]).text(val);
                    }
                }

            };
            //侦听并初始化赋值
            for(var i=0; i<l; i++){
                var $watch = $(this.$watch[i]);
                $watch.on("input",$.proxy(function(e){
                    setVal($(e.target),this.$watch,e.target);
                },this));
                $watch.on("change",$.proxy(function(e){
                    setVal($(e.target),this.$watch,e.target);
                },this));
                if($watch.data("watch")=="default"){
                    setVal($watch,this.$watch);
                    hasDefault = true;
                }else if(hasDefault == false && i == l-1){
                    setVal($watch,this.$watch);
                }
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
    //使用链式方法，建立子树和初始化节点树
    window.jsonToNodeTree = function(json,name,$rootDom){
        name = name || "root";
        var root = new Node(name);
        var recursion = function(node,json){
            for(var key in json){
                var child = new Node(key);
                node.add(child);
                if(typeof json[key] == "object" && !$.isArray(json[key])){
                    recursion(child,json[key]);
                }else{
                    if(json[key] == "this"){
                        child.setWatch($rootDom);
                    }else if($rootDom.find(json[key]).length>0){
                        child.setWatch($rootDom.find(json[key]));
                    }else{
                        child.setWatch($(json[key]));
                    }
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
     * 路由控制
     * @param {hash} map moduleName: module
     */
     var Method = function(name,parent,callback){
         this.name = name;
         this.parent = parent || null;
         this.children = [];
         this.param = {};
         this.callback = callback;
     };
     Method.prototype.addChild = function(method){
         this.children.push(method);
     };
     Method.prototype.isChild = function(name){
         for(var i=0; i<this.children.length; i++){
             if(this.children[i].name==name){
                 return true;
             }
         }
         return false;
     };
     Method.prototype.do = function(){
         this.callback(this.param);
     };
    var Route = function(reg,methodReg,paramReg,callback,listener){
        this.reg = reg;
        this.methodReg = methodReg;
        this.paramReg = paramReg;
        this.callback = callback;
        this.listener = listener;
    };
    var _Router = function(){
        this.hashchange();
    };
    _Router.prototype = {
        constructor: _Router,
        //wait to Override
        methods:[],
        routes:[],
        start: function(){
            this.hashchange();
        },
        hashchange: function (e) {
            if(!window.location.hash)return;
            if(window.location.hash=="#")return;
            var array = window.location.hash.split("#")[1].split("/");
            var hash = window.location.hash.replace("#","");
            this.routes.forEach(function(route){
                if(route.reg=="root"&&window.location.hash=="#/"){
                    route.callback.apply(route.listener);
                    return false;
                }
                if(route.reg=="root")return true;
                if(hash.match(route.reg)){
                    var paramStr = hash.replace(route.methodReg,"");
                    if(paramStr.match(route.paramReg)){
                        var paramArr = paramStr.match(route.paramReg)[0].split("/");
                        paramArr.shift();
                        route.callback.apply(route.listener,paramArr);
                    }else{
                        route.callback.apply(route.listener);
                    }
                }
            });
        },
        on: function(url,callback,listener){
            if(url=="/"){
                var route = new Route("root",null,null,callback,listener);
                this.routes.push(route);
                return;
            }
            methodReg = url.split(/\/:/)[0];
            var paramStr = url.replace(methodReg,"");
            if(paramStr){
                var paramReg = paramStr.replace(/\/:[^\/]*/g,"\/.*");
                var reg = new RegExp("^"+methodReg+paramReg+"$");
            }else{
                var reg = new RegExp("^"+methodReg+"$");
            }
            var route = new Route(reg,methodReg,paramReg,callback,listener);
            this.routes.push(route);
        },
        goto: function(hash){
            window.history.pushState(hash,"","#"+hash);
            this.hashchange();
        },
    };
    var Router = new _Router;
    window.addEventListener("hashchange",function(){
        Router.hashchange();
    });
/***************************************************************
****************************************************************
*******************  Model+Controller+databind  ****************
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
        this.callbackList.forEach(function(callback){
            if(callback.type == event.type)
                callback.callback.call(_this,event);
        });
        if(this.parent){
            this.parent.stream(event);
        }
    };
    EventHandler.prototype.on = function(type,callback){
        this.callbackList.push({
            "type": type,
            "callback": callback
        });
    };
    /**
     * 数据模型
     * @param {Module}  包含次数据模型的模块
     */
    var Model = function(module){
        this.url = {};
        this.data = {};
        this.module = module;
    };
    //新版本改名为Service
    var Service = Model;
    /**
     * @type {Object}
     */
    Model.prototype = {
        constructor: Model,
        /**
         * 把一个对象url化
         * @param  {object}
         * @return {string}
         */
        urlify: function(data){
            var url = "";
            for(var key in data){
                url += key+"="+data[key]+"&";
            }
            return url.replace(/&$/,"");
        },
        /**
         * 封装jq/zp的ajax调用，
         * @param  {string}
         * @param  {object}
         */
        sync: function(type,data){
            if(arguments.length==0){
                type = "get";
            }
            if(arguments.length==1){
                data = type
                type = "get";
            }
            var self = this;
            if(data){
                this.data = data;
                if(type != "get")
                    url = this.url;
                else
                    url = this.url+ "&" + this.urlify(data);
            }else{
                url = this.url;
            }
            var complete = function(xhr,status){
                if(status=="success"){
                    var json = JSON.parse(xhr.responseText);
                    if(json){
                        self.module.syncComplete.call(self.module,json);
                    }else{
                        self.module.syncComplete.call(self.module,null);
                    }
                }else{
                    self.module.syncComplete.call(self.module,null,status);
                }
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
                    data: this.data || undefined,
                    "complete": complete
                });
            }
        }
    };
    Fry.Model = Model;
    /**
     * 一个Array实例
     * 一个children list
     * 不可继承
     * 可以进行批量操作
     */
    var Collection = function(){
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
    var Module = function($el,parent,data){
        var _this = this;
        //inherit
        EventHandler.call(this,parent);
        if(typeof $el == "string"){
           	var type = $el;
           	$el = undefined;
        }
        this.uuid = uuid();
        this.$el = $el || this.$el || $(document);

        this.parent = parent;
        //初始化自身model
        this.model = new Model(this);

        //监控url和data
        Object.defineProperty(this,"url",{
            set: function(val){
                this.model.url = val;
            },
            get: function(){
                return this.model.url;
            }
        });
        Object.defineProperty(this,"data",{
            set: function(val){
                this.model.data = val;
            },
            get: function(){
                return this.model.data;
            }
        });
        if(data){
        	this.model.data = data;
        }
        if(this.__proto__.data)
           this.data = this.__proto__.data;
        if(this.__proto__.url)
           this.url = this.__proto__.url;
       //渲染
       if(this.template){
            this.generate();
            if(this.beforeRender)
                this.beforeRender();
            this.render(type);
        }
        //init $ object
        for(var domObj in this){
            if(domObj.match(/^.*$/)){
                if(typeof this[domObj] == "string"){
                    this[domObj] = $(this[domObj]);
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
             var callback = bind[key];
             this.bindEvent(dom,"click",callback);
        }
        //dom事件
        var bind = this.domEvent || {};
        for(var key in bind){
            var event = key.match(/^.+\s/)[0];
            var dom = key.split(/^.+\s+/)[1];
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
         * 链式继承，返回一个新的类
         * @param  {Object}
         * @return {Module}
         */
        extend:function(obj){
            var module = function(){
                Module.apply(this,arguments);
            }
            module.prototype = Object.create(this.prototype || this.__proto__);
            $.extend(module.prototype,obj);
            module.prototype.constructor = module;
            module.extend = module.prototype.extend;
            return module;
        },
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
        generate: function(){
        	this.$el = $(this.template(this.model.data));
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
         * Controller层对model的一个封装
         * @param  {string}
         * @param  {Object}
         */
        syncData:function(type,data) {
            if(arguments.length == 1){
                data = type;
                type = "get";
            }
            this.model.sync(type,data);
        },
        back: function(){
            this.hide();
            window.history.back();
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
    Module.extend = Module.prototype.extend;
    window.Module = new Module;
    window.Router = Router;
    Fry.Egg = new Module;
    window.Fry = Fry;
})($,window);
