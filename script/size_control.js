$(window).resize(function(){
});

$(document).ready(function(){
    if (/Mobi/.test(navigator.userAgent)) {
        $('#homepage').css('height', '');
        $('.container-fluid > .row > .col-lg-4').eq(0).addClass('order-last');
        $('.container-fluid > .row > .col-lg-4').eq(2).hide();
        //$('#mobile_keypad').show();
    }
    else
    {
        $('#homepage').css('height', '100vh');
        $('.container-fluid > .row > .col-lg-4').eq(0).removeClass('order-last');
        $('.container-fluid > .row > .col-lg-4').eq(2).show();
        //$('#mobile_keypad').hide();
    }
});

$(window).on('orientationchange', function(){
    if (/Mobi/.test(navigator.userAgent)) {
        if($('#pacman > canvas').length > 0 && $('#gameplay').css('display') != 'none')
        {
            //since orientationchange detect before change
            //so if it's in portrait mode and this event triggers then 
            //it's going into landscape mode which we wants to the statements below to occur
            //if(window.innerHeight > window.innerWidth){
                $('#pacman').hide(); //only the game is hidden
                //$('#mobile_keypad').hide();
                alert('We are sorry for inconvenience.' + 
                'Our game is not supported on mobile device');
            //}
            /*else
            {
                $('#pacman').show();
                $('#mobile_keypad').show();
            }*/
        }
    }
});