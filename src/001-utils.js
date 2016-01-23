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
