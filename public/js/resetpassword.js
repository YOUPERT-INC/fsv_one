$(document).ready(function(){
  let searchParams = new URLSearchParams(window.location.search);
  let issuccess = searchParams.has('sid');
  var emailtoken = "";
  if (issuccess == true) {
    emailtoken = searchParams.get('sid');
    if (emailtoken != "")
    {
      $("#emailtoken").val(emailtoken);
    }
    else
    {
      $("#emailtoken").val("");
    }
  }
  checklang();
  var currenturl = window.location.href;
  currenturl = currenturl.substring(currenturl.lastIndexOf('/') + 1);
  currenturl = "/reset-password";
  checkLogin(currenturl);
  resetpassword();
});
