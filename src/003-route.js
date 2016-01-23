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
