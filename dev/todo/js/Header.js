define([],function(){
    var Header = Egg.ViewCtrl.extend({
        $el: $("#header"),
        domEvent: {
            "keyup #new-todo": "newTodo"
        },
        watch: {
            "newThing": "#new-todo"
        },
        newTodo: function(e){
            if(e.keyCode==13){
                if(String(this.watch.newThing)!=""){
                    this.radio.broadcast("newTodo",this.watch.newThing);
                }
                this.watch.newThing = "";
            }
        }
    });
    return Header;
});
