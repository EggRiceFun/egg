define(["TodoList","ToggleAll"],function(TodoList,ToggleAll){
    var Content = Egg.ViewCtrl.extend({
        $el:$("#main"),
        sub:{
            "TodoList":["#todo-list",TodoList],
            "ToggleAll":["#toggle-all",ToggleAll]
        }
    });
    return Content;
});
