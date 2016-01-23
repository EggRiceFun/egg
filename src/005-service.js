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
