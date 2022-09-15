function soundDisabled() {
    return localStorage["soundDisabled"] === "true";
    //soundDisabled = true means that the sound are disableds
};

$(document).ready(function ()
{
  localStorage["soundDisabled"] = true;
});

$('#sound_status').click(function ()
{
    localStorage["soundDisabled"] = !soundDisabled();

    $('#sound_status').text(
      "Sound " + (!soundDisabled() ? "ON" : "OFF"));
      
    if(!soundDisabled())
    {
        $('#sound_status').removeClass('btn-outline-danger');
        $('#sound_status').addClass('btn-outline-success');
    }
    else
    {
        $('#sound_status').addClass('btn-outline-danger');
        $('#sound_status').removeClass('btn-outline-success');
    }

    if(!soundDisabled() && $('#gameplay').css('display') == 'none')
    {
      $('#title_bgm')[0].load();
      $('#title_bgm')[0].play();
      $('#title_bgm')[0].loop = true;
    }
    else
    {
      $('#title_bgm')[0].pause();
    }
});