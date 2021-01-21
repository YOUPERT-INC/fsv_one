$(document).ready(function(){
  	checklang();
  	var currenturl = window.location.href;
  	currenturl = currenturl.substring(currenturl.lastIndexOf('/') + 1);
  	currenturl = "/forgot-password";
  	checkLogin(currenturl);
  	forgotpassword();
});
