var recordsPerPage = 12;
var recordsOffset = 0;
var totaldata = 0;
var allcount = 0;

$(document).ready(function(){

  setTimeout(function(){
    $(window).scrollTop(0);
  },300);

  checklang();
  var currenturl = window.location.href;
  currenturl = currenturl.substring(currenturl.lastIndexOf('/') + 1);
  currenturl = "/video";
  checkLogin(currenturl);
  load_video_data(recordsPerPage, recordsOffset);

  setInterval(function(){
    shuffleInstances();
  },100);
});

var winCached = $(window),
  docCached = $(document)

function addContent() {
  dettachScrollEvent();
  setTimeout(function() {
    attachScrollEvent();
  }, 500);

}

function attachScrollEvent() {
  winCached.scroll(function() {
    if (winCached.scrollTop() + winCached.height() > docCached.height() - 100) {
      if (totaldata >= allcount) {
          return false;
        }
        if (totaldata != 0) {
          recordsOffset = recordsOffset + recordsPerPage;
            load_video_data(recordsPerPage, recordsOffset);
        }
      addContent();
    }
  });
}

function dettachScrollEvent() {
  winCached.unbind('scroll');
}
addContent();

function load_video_data(recordsPerPage, recordsOffset)
{
  var apiurl = "http://localhost:3001/api/getvideos";
  // var apiurl = "http://local.websoptimization.com:8081/api/getvideos";
  $.ajax({
    url:apiurl,
    method:"POST",
    data:{recordsPerPage:recordsPerPage, recordsOffset:recordsOffset},
    cache:false,
    beforeSend: function() {
      //$("#myDiv").show();
    },
    success:function(response)
    {
      var y = $(window).scrollTop();
      $(window).scrollTop(y+5);
      //$("#myDiv").hide();
      if(response.data.length == '' || response.data.length == 0)
      {
        allcount = 0;
        totaldata = 0;
      }
      else
      {
        allcount = response.allcount;
        totaldata = totaldata + response.data.length;
        var img_url,video_url,id,html ="";
        for (var i = 0; i < response.data.length; i++) {
          img_url = response.data[i].img_url;
          video_url = response.data[i].video_url;
          video_url = htmlDecode(video_url);
          id = response.data[i]._id;
          var vdid = "video"+id;
          var onclk = "onClick=videoModal('"+ vdid +"','"+video_url+"')";
          html += '<figure class="col-xs-12 col-sm-6 col-md-4 col-lg-4 picture-item">'
                  +"<a class='video' href='javascript:void(0)' id='"+vdid+"' data-videourl='"+video_url+"' "+onclk+">"
                    +"<img src='"+img_url+"' alt='FSV VIDEO'>"
                    // +'<video disablePictureInPicture controlsList="nodownload">'
                    //   +'<source src="'+video_url+'" type="video/mp4">'
                    // +'</video>'
                  +'</a>'
                +'</figure>';
        }
        $('.load_data').append(html);
        //shuffleInstances();
      }
    },
    error: function(jqXHR, textStatus, errorThrown)
    {
      allcount = 0;
      totaldata = 0;
      //$("#myDiv").hide();
    }
  });
}

function shuffleInstances() {
  var Shuffle = window.Shuffle;
  var element = document.querySelector('.my-shuffle-container');
  var sizer = element.querySelector('.my-sizer-element');
  var shuffleInstance = new Shuffle(element, {
    itemSelector: '.picture-item',
    sizer: '.my-sizer-element'
  });
}

function htmlDecode(input){
  var e = document.createElement('textarea');
  e.innerHTML = input;
  return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}

function videoModal(id,url) {
    $("body").toggleClass("popup-videoplayer");
    url = htmlDecode(url);
    var img = "#"+id;
    var x = $('#'+id);
    var y = x.attr("id");
    var configObject = {
      sourceUrl: url,
      triggerElement: "#"+y,
      progressCallback: function() {
        console.log("Player Callback Done.");
      }
    };
    var videoBuild = new YoutubeOverlayModule(configObject);
    videoBuild.activateDeployment();
}
