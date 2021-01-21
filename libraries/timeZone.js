let appconfig = require('../config/config');

function getCurrentTime() 
{
	var estTime = new Date();
	//var currentDateTimeCentralTimeZone = new Date(estTime.toLocaleString(`${appconfig.timeLang}`, { timeZone: `${appconfig.timeZone}` }));
	//var date = estTime.toLocaleDateString(`${appconfig.timeLang}`, { timeZone: `${appconfig.timeZone}` });
	var currentDateTimeCentralTimeZone = new Date(estTime.toLocaleString()); // 'en-IN', { timeZone: 'Asia/Kolkata' }
	var date = estTime.toLocaleDateString();
	var seconds = currentDateTimeCentralTimeZone.getSeconds();
	var minutes = currentDateTimeCentralTimeZone.getMinutes();
	var hours =  currentDateTimeCentralTimeZone.getHours();
	var am_pm = currentDateTimeCentralTimeZone.getHours() >= 12 ? "PM" : "AM";

	if (hours < 10) {
	 	hours = "0" + hours;
	}

	if (minutes < 10) {
	 	minutes = "0" + minutes;
	}

	if (seconds < 10) {
	 	seconds = "0" + seconds;
	}

	var mid = 'PM';
	if(hours == 0){ 
		//At 00 hours we need to show 12 am
		hours = 12;
	}
	else if(hours > 12)
	{
		hours = hours % 12;
		mid = 'AM';
	}

	var currentrequestruntime = date +' '+ hours +':'+ minutes +':'+ seconds +' '+ am_pm;
	//console.log("------------------- Current Time : " + currentrequestruntime + " -------------------");
	return currentrequestruntime;
}

module.exports = getCurrentTime;