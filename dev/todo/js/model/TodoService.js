/*
* @Author: zhaoye-ds1
* @Date:   2015-08-26 16:37:58
* @Last Modified by:   zhaoye-ds1
* @Last Modified time: 2015-10-09 16:18:04
*/
define(function(){
    var TodoService = Egg.Service.extend({
        default:{
            url:"http://127.0.0.1:3000/hehe",
            type:'post'
        }
    });
    return TodoService;
});
