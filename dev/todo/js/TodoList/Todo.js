define(["model/TodoService"],function(TodoService){
    var Todo = Egg.ViewCtrl.extend({
        template: Handlebars.compile($("#todo-list-item").html()),
        service: TodoService,
        state:"all",
        click:{
            ".destroy": "destroy",
            ".toggle": "toggle",
            "document": "doneEdit"
        },
        domEvent:{
            "dblclick label": "edit"
        },
        watch:{
            "thing":"input, label"
        },
        init: function(){
            if(this.router.filter == '/completed'){
                this.hide();
            }
        },
        doneEdit: function(e){
            var isOneOfUs = false;
            this.$el.find("input").each(function(idx,input){
                if(e.target==input){
                    isOneOfUs = true;
                    return false;
                }
            });
            if(!isOneOfUs)
                this.$el.removeClass("editing");
        },
        edit: function(e){
            //this.service.http();
            this.$el.toggleClass("editing");
            this.$el.find("input").focus();
        },
        toggle: function(e){
            this.$el.toggleClass("completed");
            if(this.$el.hasClass("completed")){
                this.isComplete = true;
                this.emit("complete");
                if(this.router.filter == '/active'){
                    this.hide();
                }
                this.$el.find(".toggle").prop("checked",true);
            }
            else{
                this.isComplete = false;
                this.emit("active");
                if(this.router.filter == '/complete'){
                    this.hide();
                }
                this.$el.find(".toggle").prop("checked",false);
            }
        },
        destroy: function(){
            this.remove();
            this.emit("remove",this.isComplete);
        },
        complete: function(){
            this.isComplete = true;
            this.emit("complete");
            this.$el.addClass("completed");
            this.$el.find(".toggle").prop("checked",true);
        },
        active: function(){
            this.isComplete = false;
            this.emit("active");
            this.$el.removeClass("completed");
            this.$el.find(".toggle").prop("checked",false);
        }
    });
    return Todo;
});
