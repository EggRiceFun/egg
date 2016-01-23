require.config({
    baseUrl:"./js"
});
require(["Header","Footer","Content"],function(Header,Footer,Content){
    $(function(){
        window.HeaderModule = new Header;
        window.ContentModule = new Content;
        window.FooterModule = new Footer;
    });
});
