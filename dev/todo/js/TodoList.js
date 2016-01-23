define(["TodoList/Todo","model/TodoListService"],function(Todo,TodoListService){
    var TodoList = Egg.ViewCtrl.extend({
        $el: $("#todo-list"),
        service: TodoListService,
        lastNewThing:'',
        init: function(){
            //this.service.http();
            this.service.on('add','complete',function(e){
                this.collection.append(Todo,{thing:this.lastNewThing});
            })
        },
        /**
         * 广播
         */
        radio:{
            "toggleAll": "toggleAll",
            "newTodo":"newTodo"
        },
        newTodo: function(newThing){
            this.lastNewThing = newThing;
            //this.service.http('add',{'foo':1});
            this.collection.append(Todo,{thing:this.lastNewThing});
        },
        toggleAll: function(method){
            if(method=="complete"){
                this.collection.forEach(function(todo){
                    if(!todo.isComplete)
                        todo.complete();
                });
            }else{
                this.collection.forEach(function(todo){
                    if(todo.isComplete)
                        todo.active();
                });
            }
        },
        /**
         * 事件流
         */
        event: {
            "remove": "onRemove",
            "complete": "completeOne",
            "active": "activeOne"
        },
        onRemove: function(e){
            if(this.collection.getLength() == 0){
                this.radio.broadcast("listEmpty");
            }
            this.radio.broadcast('removeOne',e.data);
        },
        completeOne: function(e){
            this.radio.broadcast('completeOne');
        },
        activeOne: function(e){
            this.radio.broadcast("activeOne");
        },
        /**
         * 路由
         */
        router: {
            "/completed":"routeComplete",
            "/":"routeAll",
            "/active":"routeActive"
        },
        routeActive: function(){
            this.collection.forEach(function(todo){
                if(!todo.isComplete){
                    todo.show();
                }else{
                    todo.hide();
                }
            });
        },
        routeAll: function(){
            this.collection.forEach(function(todo){
                todo.show();
            });
        },
        routeComplete: function(){
            this.collection.forEach(function(todo){
                if(!todo.isComplete){
                    todo.hide();
                }else{
                    todo.show();
                }
            });
        }
    });
    return TodoList;
});
