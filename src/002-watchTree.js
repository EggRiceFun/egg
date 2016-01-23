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
