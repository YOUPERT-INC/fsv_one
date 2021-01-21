$(document).ready(function(){
  // handle links with @href started with '#' only
  $(document).on('click', '#table-content li a[href^="#"]', function(e) {
      // target element id
      var id = $(this).attr('href');

      // target element
      var $id = $(id);
      if ($id.length === 0) {
          return;
      }

      // prevent standard hash navigation (avoid blinking in IE)
      e.preventDefault();

      // top position relative to the document
      var pos = $(id).offset().top - 15;

      // animated top scrolling
      $('body, html').animate({scrollTop: pos});
  });

  checklang();
  var currenturl = window.location.href;
  currenturl = currenturl.substring(currenturl.lastIndexOf('/') + 1);
  currenturl = "/privacy";
  checkLogin(currenturl);
});
