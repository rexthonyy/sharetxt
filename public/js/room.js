window.onload = () => {
	let container = document.getElementById("container");
	let colorTheme = document.getElementById("colorTheme");
	let customToggleLightSwitch = document.getElementById("customToggleLightSwitch");
	let languageToggle = document.getElementById("languageToggle");
	let selectedLang = document.getElementById("selectedLang");
	let languageToggleDropdown = document.getElementById("languageToggleDropdown");
	let numConnections = document.getElementById("numConnections");
	let roomName = document.getElementById("roomName");
	let redirectIcon = document.getElementById("redirectIcon");
	let btnHistory = document.getElementById("btnHistory");
	let inputField = document.getElementById("inputField");
	let copyBtn = document.getElementById("copyBtn");
	let copyBtnContent = document.getElementById("copyBtnContent");
	
	let pathUrl = document.getElementById("pathUrl");
	let gotoUrl = document.getElementById("gotoUrl");
	let btnSubscription = document.getElementById("btnSubscription");
	let btnLogout = document.getElementById("btnLogout");
	let btnHistoryUpgrade = document.getElementById("btnHistoryUpgrade");
	let btnCancelSubscription = document.getElementById("btnCancelSubscription");
	let btnActivatePro = document.getElementById("btnActivatePro");
	let customToggleBillingSwitch = document.getElementById("customToggleBillingSwitch");

	let translateSelector = new TranslateSelector({
		dropdownLabelElm: selectedLang,
		dropdownContentElm: languageToggleDropdown,
		stringAttribute: "translate",
		chosenLang: "EN",
		dictionary: getDictionary(),
		resolver: new ContentResolver()
	});

	let placeholderResolver = new PlaceholderResolver;

	translateSelector.onchange = lang => {
		placeholderResolver.resolve(
			lang,
			inputField,
			getDictionary()
		);
	};

	let dialog = new Dialog();

	let text = "";

	roomName.textContent = ROOM_NAME;

	function getSocketUrl(){
		return location.origin.replace(/^http/, 'ws');
	}

	function translate(text){
		return getTranslation(
			translateSelector.lang.chosenLang,
			text,
			getDictionary()
		)
	}

	function establishSocketConnection(){
		
		let socket = new WebSocket(getSocketUrl());
		
		let isSocketConnected = false;
		let isLastClientToInputData = false;
		
		socket.onopen = e => {
			isSocketConnected = true;
			//console.log("WebSocket connection established");
			let inputValue = {
				roomName: ROOM_NAME,
				type: 'connection'
			};
			socket.send(JSON.stringify(inputValue));
		};
		
		socket.onclose = e => {
			//console.log("Websocket is closed");
			setTimeout(() => {
				establishSocketConnection();
			}, 1000);
		};
		
		socket.onerror = e => {
			//console.log("WebSocket error");
		};
		
		socket.onmessage = e => {
			let response = JSON.parse(e.data);
			if(response.type == 'msg'){	
				isLastClientToInputData = false;
				inputField.value = response.msg;
				text = response.msg;
			}else{
				if(response.numUsers == 1){
					numConnections.textContent = "1 " + translate("client");
				}else{
					numConnections.textContent = response.numUsers + " " + translate("clients");
				}
				
				if(isLastClientToInputData){
					shareInput();
				}
			}
		};
		
		inputField.oninput = () => {
			text = inputField.value;
			shareInput();
		};

		copyBtn.onclick = () => {
			copyToClipboard(inputField.value);
			inputField.select();
			inputField.setSelectionRange(0, text.length);
			showTempText(copyBtnContent, translate("Copied!"), translate("Copy to clipboard"), 600);
		};
		
		function shareInput(){
			if(isSocketConnected){
				isLastClientToInputData = true;
				let inputValue = {
					type: 'message',
					roomName: ROOM_NAME,
					text: text
				};
				socket.send(JSON.stringify(inputValue));
			}else{
				console.log("Socket is not yet connected");
				alert(translate("Socket not connected"));
			}
		}
		
		function copyToClipboard(text){
			var dummy = document.createElement("textarea");
			document.body.appendChild(dummy);
			dummy.value = text;
			dummy.select();
			document.execCommand("copy");
			document.body.removeChild(dummy);
		}

		function showTempText(elm, tempText, normalText, duration){
			elm.textContent = tempText;
			setTimeout(() => {
				elm.textContent = normalText;
			}, duration);
		}

		window.onclick = function(event) {
			dialog.windowClick(event);
			handleMinDropdown(event);
		};

		setSwitchListener();
		setupLanguageToggle();
		setEditorTabPressListener();
		setupMode();
		setupLanguage();

		function setSwitchListener(){
			customToggleLightSwitch.addEventListener("change", () => {
				if(customToggleLightSwitch.checked){
					//save setting as a cookie
					setCookie("mode", "dark", 7);
					enableDarkMode();
				}else{
					setCookie("mode", "light", 7);
					enableLightMode();
				}
			});
		}

		function setupLanguageToggle(){
			languageToggle.onclick = (e) => {
				stopClickPropagation(e);
				languageToggleDropdown.classList.toggle("rex-cd-show");
			};
		}

		function handleMinDropdown(event) {
			if (!event.target.matches('.rex-cd-dropbtn')) {
				let dropdowns = document.getElementsByClassName("rex-cd-dropdown-content-min");
				for (let i = 0; i < dropdowns.length; i++) {
					var openDropdown = dropdowns[i];
					if (openDropdown.classList.contains('rex-cd-show')) {
						openDropdown.classList.remove('rex-cd-show');
					}
				}
			}
		}

		function setEditorTabPressListener(){
			inputField.onkeydown = function(e){
				if(e.keycode == 9 || e.which == 9){
					e.preventDefault();
					let s = this.selectionStart;
					this.value = this.value.substring(0, this.selectionStart) + "\t" + this.value.substring(this.selectionEnd);
					this.selectionEnd = s + 1;
				}
			};
		}

		function setupMode(){
			let mode = getCookie("mode");
			if(!mode){
				enableLightMode();
				customToggleLightSwitch.checked = false;
			}else{
				if(mode == "light"){
					enableLightMode();
					customToggleLightSwitch.checked = false;
				}else{
					enableDarkMode();
					customToggleLightSwitch.checked = true;
				}
			}
		}

		function setupLanguage(){
			let language = getCookie("lang");
			if(!language){
				//use language from server
				translateSelector.selectLanguage(LANG);
			}else{
				translateSelector.selectLanguage(language);
			}
			placeholderResolver.resolve(
				language,
				inputField,
				getDictionary()
			);
		}

		function enableLightMode(){
			container.className = "custom-lm-container";
			colorTheme.textContent = translate("Light mode");
			redirectIcon.src="/images/ic_redirect.png";
		}

		function enableDarkMode(){
			container.className = "custom-dm-container";
			colorTheme.textContent = translate("Dark mode");
			redirectIcon.src="/images/ic_redirect_.png";
		}

		roomName.onclick = e => {
			stopClickPropagation(e);
			pathUrl.value = ROOM_NAME;
			dialog.show(Dialog.GOTO);
			pathUrl.focus();
			let val = pathUrl.value;
			pathUrl.value = "";
			pathUrl.value = val;
			handleMinDropdown(e);// close the language dropdown if it is open
		};

		btnHistory.onclick = e => {
			stopClickPropagation(e);
			dialog.show(Dialog.HISTORY);
		}

		pathUrl.addEventListener("keyup", e => {
			if(e.keyCode === 13){
				e.preventDefault();
				gotoUrl.click();
			}
		});
		
		gotoUrl.onclick = () => {
			if(pathUrl.value){
				let path = "http://sharetxt.live/" + pathUrl.value;
				window.open(path, "_self");
			}
		};

        btnSubscription.onclick = e => {
            stopClickPropagation(e);
            dialog.show(Dialog.SUBSCRIPTION);
        };

        btnLogout.onclick = e => {
            console.log("Logout");
        };

        btnHistoryUpgrade.onclick = e => {
            dialog.show(Dialog.UPGRADE);
        };

        customToggleBillingSwitch.addEventListener("change", () => {
            if(customToggleBillingSwitch.checked){
                btnActivatePro.textContent = "Pay $50/year";
            }else{
                btnActivatePro.textContent = "Pay $5/month";
            }
        });

        btnActivatePro.onclick = e => {
            dialog.show(Dialog.SUBSCRIPTION);
        };

        btnCancelSubscription.onclick = e => {
            dialog.show(Dialog.UPGRADE);
        };
	}

	establishSocketConnection();
};

class Dialog {
	static GOTO = 0;
    static LOADING = 1;
	static HISTORY = 2;
    static SUBSCRIPTION = 3;
    static UPGRADE = 4;


	constructor(){
		this.modalBackground = document.getElementById("modalBackground");
		this.modal = document.getElementsByClassName("modal");

		for(let i = 0; i < this.modal.length; i++){
			this.modal[i].onclick = e => {
				stopClickPropagation(e);
			}
		}
	}

	windowClick(){
		this.hide();
	}

	hide(){
		this.modalBackground.style.display = "none";
		for(let i = 0; i < this.modal.length; i++){
			this.modal[i].style.display = "none";
		}
	}

	show(type){
		this.hide();
		this.modalBackground.style.display = "flex";
		this.modal[type].style.display = "block";
	}
}