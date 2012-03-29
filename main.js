var backgroundpage = chrome.extension.getBackgroundPage();
var inte = null;
function init()
{
	if(backgroundpage.logined)
	{
		document.getElementById("wrapper").innerHTML='<span class="status loading">载入最新微博中...<a href="javascript:logout()">登出</a></span>';
		refresh();
		inte = setInterval(refresh(), backgroundpage.intervalTime);
	}
}
function refresh()
{
	backgroundpage.friend_timeline();
	if(backgroundpage.blogs)
	{
		var w = document.getElementById("wrapper");
		var tmp = ""
		var b = backgroundpage.blogs;
		for(var i=0;i<b.length;i++)
		{
			tmp = tmp+'<div class="triangle-border"><img align="top" width="45" height="45" src="'+
			b[i].user.profile_image_url+'"><strong>'+
			b[i].user.name+': </strong>'+
			b[i].text+'</div><br/>';
		}
		tmp+='<br/><span class="status"><a href="javascript:logout()">登出</a></span>';
		w.innerHTML = tmp;		
	}
}
function loginform()
{
	var user = document.getElementById("form_username").value;
	var pass = document.getElementById("form_password").value;
	if(user!=null && pass!=null)
		login(user,pass);
}

function login(username, password)
{
	var accessor = { consumerSecret: backgroundpage.consumerSecret};
	var message = { method: "GET" , action: backgroundpage.serverBase+"oauth/access_token"
			  , parameters: []};
	var signcode;
	do{
	message.parameters = [];
	message.parameters.push(["oauth_version", "1.0"]);
	message.parameters.push(["oauth_consumer_key", backgroundpage.consumerSecret]);
	message.parameters.push(["oauth_timestamp", OAuth.timestamp()]);
	message.parameters.push(["oauth_nonce", encodeURIComponent(OAuth.nonce(6))]);
	message.parameters.push(["oauth_signature_method", "HMAC-SHA1"]);
	
	message.parameters.push(["x_auth_username", username]);
	message.parameters.push(["x_auth_password", password]);
	message.parameters.push(["x_auth_mode", "client_auth"]);
	
	OAuth.SignatureMethod.sign(message, accessor);
	signcode = OAuth.getParameter(message.parameters, "oauth_signature");
	}while(signcode.indexOf("+")!=-1);
	
	var tURL = message.action+"?"+OAuth.SignatureMethod.normalizeParameters(message.parameters).replace(/oauth_signature/,"oauth_signature="+OAuth.getParameter(message.parameters, "oauth_signature")+"&oauth_signature");
	
	document.getElementById("status").innerHTML='<span class="status loading">登录中...</span>';
	var req = new XMLHttpRequest();
	req.open("GET",tURL,true);
	req.onload = function(){
		var para = req.responseText.split("&");
		accessToken = null;
		accessSecret = null;
		userID = null;
		for(var i=0;i<para.length;i++)
		{
			if(para[i].indexOf("user_id")>=0)
				userID = para[i].substr(8);	
			else
			if(para[i].indexOf("oauth_token_secret")>=0)
				accessSecret = para[i].substr(19);	
			else
			if(para[i].indexOf("oauth_token")>=0)
				accessToken = para[i].substr(12);
		}
		if(userID != null)
		{
			document.getElementById("status").innerHTML='<span class="status loading">登录成功 载入最新微博中...<a href="javascript:logout()">登出</a></span>';
			backgroundpage.save(accessToken, accessSecret, userID);
			inte = setInterval(refresh(), backgroundpage.intervalTime);
			//refresh();
		}
		else
			document.getElementById("status").innerHTML='<span class="status">登录出错!</span>';
	};
	req.send(null);
}
function logout()
{
	var w = document.getElementById("wrapper");
	w.innerHTML = '	<form action=""><table align="center"><tr><td colspan="2" align="center"> <div class="caption">Quanr用户登录</div> </td></tr><tr><td> 用户名</td><td><input type="text" id="form_username" /></td></tr><tr><td> 密码</td><td><input type="password" id="form_password" /></td></tr><tr><td colspan="2" align="right"><a href="javascript:loginform();">登录</a></td></tr></table></form><div id="status"> </div>';
	backgroundpage.logout();
	clearInterval(inte);
}