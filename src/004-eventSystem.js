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
