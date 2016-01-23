define(function(){
    var ToggleAll = Egg.ViewCtrl.extend({
        click:{
            "this": "toggleAll"
        },
        radio:{
            "newTodo": "newTodo",
            "listEmpty": "listEmpty",
            "activeOne": "activeOne",
            "allComplete": "allComplete"
        },
        toggleAll: function(e){
            if(this.$el.is(":checked")){
                this.radio.broadcast("toggleAll","complete");
            }else{
                this.radio.broadcast("toggleAll","active");
            }
        },
        newTodo: function(){
            this.show();
            this.$el.prop("checked",false);
        },
        listEmpty: function(){
            this.hide();
            this.$el.prop("checked",false);
        },
        activeOne: function(){
            this.$el.prop("checked",false);
        },
        allComplete: function(){
            this.$el.prop("checked",true);
        }
    });
    return ToggleAll;
});
