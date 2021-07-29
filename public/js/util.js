function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  var expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function stopClickPropagation(e){
  if(!e) e = window.event;
  if(e.stopPropagation){
    e.stopPropagation();
  }else{
    e.cancelBubble = true;
  }
}

function isEmailValid(email){
	const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function isUrlValid(url) {
    var pattern = new RegExp('^(?!https?)(?!www\.?).*\..+$');
    return !!pattern.test(url);
}

function restrictRoomNameInputElm(inputElm){
	let regex = /^[a-zA-Z0-9\-]+$/;
	inputElm.addEventListener("keypress", e => {
		let char = String.fromCharCode(e.which);
		if(!char.match(regex)){
			e.preventDefault();
		}
	});
}

async function sendPostRequest(url, data) {
	let response = await fetch(url, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	});
	let json = await response.json();
	return json;
}

async function sendGetRequest(url) {
	let response = await fetch(url);
	let json = await response.json();

	return json;
}

function getHostUrl(){
  return window.location.protocol + "//" + window.location.host;
}