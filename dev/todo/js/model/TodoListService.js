/*
* @Author: zhaoye-ds1
* @Date:   2015-08-26 12:52:34
* @Last Modified by:   zhaoye-ds1
* @Last Modified time: 2015-10-09 16:18:00
*/
define(function(){
    var TodoListService = Egg.Service.extend({
        default:{
            url:'http://127.0.0.1:3000/default'
        },
        add: {
            url:  'http://127.0.0.1:3000/addTodo',
            type: 'get'
        },
        remove: {
            url: 'http://127.0.0.1:3000/removeTodo',
            type: 'get'
        }
    });
    return TodoListService;
});
