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
