define(function(){
    var Footer = Egg.ViewCtrl.extend({
        $el: $("#footer"),
        $btns: $("#filters li a"),
        status: 'all',
        watch: {
            'todoCount': '#todo-count strong'
        },
        init: function(){
            this.setStatus(this.router.filter.replace(/^\//,''));
        },
        setStatus: function(status){
            this.$btns.removeClass("selected")
            this.$btns.filter('[href="#/'+(status||"")+'"]').addClass("selected");
        },
        radio:{
            "newTodo":"newTodo",
            "listEmpty": "listEmpty",
            "completeOne":'completeOne',
            "removeOne": 'removeOne',
            'activeOne': 'activeOne',
        },
        newTodo: function(){
            this.show();
            this.watch.todoCount+=1;
        },
        completeOne: function(){
            this.watch.todoCount-=1;
        },
        activeOne: function(){
            this.watch.todoCount+=1;
        },
        removeOne: function(isComplete){
            if(!isComplete)
                this.watch.todoCount-=1;
        },
        listEmpty: function(){
            this.hide();
        },
        router: {
            "/": "root",
            "/completed": "completed",
            "/active": "active"
        },
        completed: function(){
            this.setStatus("complete");
        },
        active: function(){
            this.setStatus("active");
        },
        root: function(){
            this.setStatus("");
        }
    });
    return Footer;
});
