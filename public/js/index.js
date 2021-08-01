let dialogHandler;

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
	let claimLinkShareTXTInput = document.getElementById("claimLinkShareTXTInput");
	let btnClaimMyLink = document.getElementById("btnClaimMyLink");
	let inputField = document.getElementById("inputField");
	let copyBtn = document.getElementById("copyBtn");
	let copyBtnContent = document.getElementById("copyBtnContent");

	dialogHandler = new DialogHandler();

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
			dialogHandler.windowClick(event);
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
				language = LANG;
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
			dialogHandler.show(Dialog.GOTO, {
				roomName: ROOM_NAME
			});
			handleMinDropdown(e);// close the language dropdown if it is open
		};

		btnClaimMyLink.onclick = e => {
			stopClickPropagation(e);
			dialogHandler.show(Dialog.SIGNUP, {
				roomName: claimLinkShareTXTInput.value
			});
		}

		claimLinkShareTXTInput.addEventListener("keyup", e => {
			if(e.keyCode === 13){
				e.preventDefault();
				btnClaimMyLink.click();
			}
		});

		restrictRoomNameInputElm(claimLinkShareTXTInput);
	}

	establishSocketConnection();
};

class DialogHandler {
	constructor(){
		this.modalBackground = document.getElementById("modalBackground");
		this.modal = document.getElementsByClassName("custom-modal");

		for(let i = 0; i < this.modal.length; i++){
			this.modal[i].onclick = e => {
				stopClickPropagation(e);
			}
		}

		this.dialog = {};
		this.dialog[Dialog.GOTO] = new GotoDialog(this.modalBackground, this.modal[Dialog.GOTO]);
		this.dialog[Dialog.SIGNUP] = new SignupDialog(this.modalBackground, this.modal[Dialog.SIGNUP]);
		this.dialog[Dialog.LOADING] = new LoadingDialog(this.modalBackground, this.modal[Dialog.LOADING]);
		this.dialog[Dialog.LOGIN] = new LoginDialog(this.modalBackground, this.modal[Dialog.LOGIN]);
		this.dialog[Dialog.RESOLVE_FORGOTTEN_PASSWORD] = new ResolveForgottenPasswordDialog(this.modalBackground, this.modal[Dialog.RESOLVE_FORGOTTEN_PASSWORD]);
		this.dialog[Dialog.CONFIRM_EMAIL] = new ConfirmEmailDialog(this.modalBackground, this.modal[Dialog.CONFIRM_EMAIL]);
		this.dialog[Dialog.CHANGE_PASSWORD] = new ChangePasswordDialog(this.modalBackground, this.modal[Dialog.CHANGE_PASSWORD]);
		this.dialog[Dialog.NOTIFICATION] = new NotificationDialog(this.modalBackground, this.modal[Dialog.NOTIFICATION]);

		this.dialogId = undefined;
	}

	show(dialogId, params){
		this.hide();
		this.dialogId = dialogId;
		this.dialog[dialogId].show(params);
	}

	hide(){
		if(this.dialogId != undefined){
			this.dialog[this.dialogId].hide();
		}
	}

	windowClick(e){
		if(this.dialogId != undefined){
			this.dialog[this.dialogId].windowClick();
		}
	}
}

class Dialog {
	static GOTO = 0;
	static SIGNUP = 1;
	static LOADING = 2;
	static LOGIN = 3;
	static RESOLVE_FORGOTTEN_PASSWORD = 4;
	static CONFIRM_EMAIL = 5;
	static CHANGE_PASSWORD = 6;
	static NOTIFICATION = 7;

	constructor(modalBackground, modal){
		this.modalBackground = modalBackground;
		this.modal = modal;
	}

	windowClick(){
		this.hide();
	}

	hide(){
		this.modalBackground.style.display = "none";
		this.modal.style.display = "none";
	}

	show(){
		this.modalBackground.style.display = "flex";
		this.modal.style.display = "block";
	}
}

class GotoDialog extends Dialog {
	constructor(modalBackground, modal){
		super(modalBackground, modal);
		this.pathUrl = document.getElementById("pathUrl");
		this.gotoUrl = document.getElementById("gotoUrl");

		restrictRoomNameInputElm(this.pathUrl);
		this.pathUrl.addEventListener("keyup", e => {
			if(e.keyCode === 13){
				e.preventDefault();
				this.gotoUrl.click();
			}
		});

		this.gotoUrl.onclick = () => {
			if(this.pathUrl.value){
				let path = "http://localhost:3000/" + this.pathUrl.value;
				window.open(path, "_self");
			}
		};
	}

	hide(){
		super.hide();
	}

	show(params){
		super.show();
		this.pathUrl.value = params.roomName;
		this.pathUrl.focus();
		let val = this.pathUrl.value;
		this.pathUrl.value = "";
		this.pathUrl.value = val;
	}
}

class SignupDialog extends Dialog {
	constructor(modalBackground, modal){
		super(modalBackground, modal);
		this.signupEmailInput = document.getElementById("signupEmailInput");
		this.signupEmailInputError = document.getElementById("signupEmailInputError");
		this.signupFormNameContainer = document.getElementById("custom-signup-form-name-container");
		this.signupFormNameError = document.getElementById("signupFormNameError");
		this.signupClaimLinkShareTXTInput = document.getElementById("signupClaimLinkShareTXTInput");
		this.signupFormNameIcon = document.getElementById("signupFormNameIcon");
		this.signupPasswordInput = document.getElementById("signupPasswordInput");
		this.signupPasswordInputError = document.getElementById("signupPasswordInputError");
		this.btnSignup = document.getElementById("btnSignup");
		this.btnSignupGoogle = document.getElementById("btnSignupGoogle");
		this.btnSignupFacebook = document.getElementById("btnSignupFacebook");
		this.btnSignupTwitter = document.getElementById("btnSignupTwitter");
		this.btnSignupFormLogin = document.getElementById("btnSignupFormLogin");
		restrictRoomNameInputElm(this.signupClaimLinkShareTXTInput);
		this.validateSignupEmailInputListener();
		this.validateRoomNameInputListener();
		this.validatePasswordInputListener();

		this.signupEmailInput.addEventListener("keyup", e => {
			if(e.keyCode === 13){
				e.preventDefault();
				this.signupBtnClick();
			}
		});

		this.signupClaimLinkShareTXTInput.addEventListener("keyup", e => {
			if(e.keyCode === 13){
				e.preventDefault();
				this.signupBtnClick();
			}
		});

		this.signupPasswordInput.addEventListener("keyup", e => {
			if(e.keyCode === 13){
				e.preventDefault();
				this.signupBtnClick();
			}
		});

		this.btnSignup.onclick = e => {
			this.signupBtnClick();
		};
		
		this.btnSignupGoogle.onclick = e => {
			this.isNameValid(res => {
				if(res.isValid){
					window.open(`/auth/google?type=signup&roomName=${res.name}`, "_self");
				}
			});
		};
		
		this.btnSignupFacebook.onclick = e => {
			this.isNameValid(res => {
				if(res.isValid){
					window.open(`/auth/facebook?type=signup&roomName=${res.name}`, "_self");
				}
			});
		};
		
		this.btnSignupTwitter.onclick = e => {
			this.isNameValid(res => {
				if(res.isValid){
					window.open(`/auth/twitter?type=signup&roomName=${res.name}`, "_self");
				}
			});
		};
		
		this.btnSignupFormLogin.onclick = e => {
			dialogHandler.show(Dialog.LOGIN);
		};
	}
	
	hide(){
		super.hide();
	}

	show(params){
		if (params){
			this.signupClaimLinkShareTXTInput.value = params.roomName;
		}

		super.show();
	}

	isNameValid(cb){
		let name = this.signupClaimLinkShareTXTInput.value.trim();
		if(name.length == 0){
			this.signupFormNameContainer.className = "custom-signup-form-name-container-error rex-mt-16px custom-claim-link-signup-container-grid rex-pad8px rex-border";
			this.signupFormNameError.textContent = "Please enter a value";
			this.signupFormNameError.style.display = "block";
			this.signupFormNameIcon.src="/images/ic_cancel.png";
			cb({ isValid: false });
			return;
		}

		if(['app', 'default', 'auth', 'api', 'cron'].find(roomName => roomName == name)){
			this.signupFormNameContainer.className = "custom-signup-form-name-container-error rex-mt-16px custom-claim-link-signup-container-grid rex-pad8px rex-border";
			this.signupFormNameError.textContent = "This name is already taken";
			this.signupFormNameError.style.display = "block";
			this.signupFormNameIcon.src="/images/ic_cancel.png";
			cb({ isValid: false });
			return;
		}

		dialogHandler.show(Dialog.LOADING, { windowClickListener: () => {} });

		sendGetRequest(getHostUrl() + "/api/checkRoomName?roomName=" + name)
		.then(json => {
			if(json.status == "success"){
				if(json.isRegistered){
					this.signupFormNameContainer.className = "custom-signup-form-name-container-error rex-mt-16px custom-claim-link-signup-container-grid rex-pad8px rex-border";
					this.signupFormNameError.textContent = "Name is already taken";
					this.signupFormNameError.style.display = "block";
					this.signupFormNameIcon.style.display = "inline";
					this.signupFormNameIcon.src="/images/ic_cancel.png";
					dialogHandler.show(Dialog.SIGNUP);
					cb({ isValid: false });
				}else{
					cb({
						isValid: true,
						name: name
					});
				}
			}else{
				dialogHandler.show(Dialog.NOTIFICATION, {
					title: "Error",
					message: json.message,
					btnLabel: "PROCEED",
					onclick: () => {
						dialogHandler.show(Dialog.SIGNUP);
						cb({ isValid: false });
					},
					windowClickListener: () => {
						dialogHandler.show(Dialog.SIGNUP);
						cb({ isValid: false });
					}
				});
			}
		}).catch(err => {
			console.error(err);
			dialogHandler.show(Dialog.SIGNUP);
			cb({ isValid: false });
		});
	}

	signupBtnClick(){
		let email = this.signupEmailInput.value.toLowerCase().trim();
		let name = this.signupClaimLinkShareTXTInput.value.trim();
		let password = this.signupPasswordInput.value.trim();

		if(!isEmailValid(email)){
			this.signupEmailInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
			this.signupEmailInputError.textContent = "Invalid email address";
			this.signupEmailInputError.style.display = "block";
			return;
		}

		if(name.length == 0){
			this.signupFormNameContainer.className = "custom-signup-form-name-container-error rex-mt-16px custom-claim-link-signup-container-grid rex-pad8px rex-border";
			this.signupFormNameError.textContent = "Please enter a value";
			this.signupFormNameError.style.display = "block";
			this.signupFormNameIcon.src="/images/ic_cancel.png";
			return;
		}

		if(['app', 'default', 'auth', 'api', 'cron'].find(roomName => roomName == name)){
			this.signupFormNameContainer.className = "custom-signup-form-name-container-error rex-mt-16px custom-claim-link-signup-container-grid rex-pad8px rex-border";
			this.signupFormNameError.textContent = "This name is already taken";
			this.signupFormNameError.style.display = "block";
			this.signupFormNameIcon.src="/images/ic_cancel.png";
			return;
		}

		if(password.length < 6){
			this.signupPasswordInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-16px";
			this.signupPasswordInputError.textContent = "Password must be 6 or more characters";
			this.signupPasswordInputError.style.display = "block";
			return;
		}

		dialogHandler.show(Dialog.LOADING, { windowClickListener: () => {} });

		if(email.length == 0){
			this.signupEmailInput.className = "custom-signup-form-input rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
			this.signupEmailInputError.style.display = "none";
			dialogHandler.show(Dialog.SIGNUP);
		} else if(!isEmailValid(email)){
			this.signupEmailInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
			this.signupEmailInputError.textContent = "Invalid email address";
			this.signupEmailInputError.style.display = "block";
			dialogHandler.show(Dialog.SIGNUP);
		}else{
			this.signupEmailInput.className = "custom-signup-form-input-success rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
			this.signupEmailInputError.style.display = "none";
			sendGetRequest(getHostUrl() + "/api/checkEmail?email=" + email)
			.then(json => {
				if(json.status == "success"){
					if(json.isRegistered){
						this.signupEmailInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
						this.signupEmailInputError.textContent = "Email is already registered";
						this.signupEmailInputError.style.display = "block";
						dialogHandler.show(Dialog.SIGNUP);
					}else{
						if(name.length == 0){
							this.signupFormNameContainer.className = "custom-signup-form-name-container rex-mt-16px custom-claim-link-signup-container-grid rex-pad8px rex-border";
							this.signupFormNameError.style.display = "none";
							this.signupFormNameIcon.style.display = "none";
							dialogHandler.show(Dialog.SIGNUP);
						}else{
							this.signupFormNameContainer.className = "custom-signup-form-name-container rex-mt-16px custom-claim-link-signup-container-grid rex-pad8px rex-border";
							this.signupFormNameError.style.display = "none";
							this.signupFormNameIcon.style.display = "inline";
							this.signupFormNameIcon.src="/images/ic_loading.gif";
							sendGetRequest(getHostUrl() + "/api/checkRoomName?roomName=" + name)
							.then(json => {
								if(json.status == "success"){
									if(json.isRegistered){
										this.signupFormNameContainer.className = "custom-signup-form-name-container-error rex-mt-16px custom-claim-link-signup-container-grid rex-pad8px rex-border";
										this.signupFormNameError.textContent = "Name is already taken";
										this.signupFormNameError.style.display = "block";
										this.signupFormNameIcon.style.display = "inline";
										this.signupFormNameIcon.src="/images/ic_cancel.png";
										dialogHandler.show(Dialog.SIGNUP);
									}else{
										this.signupFormNameContainer.className = "custom-signup-form-name-container-success rex-mt-16px custom-claim-link-signup-container-grid rex-pad8px rex-border";
										this.signupFormNameError.style.display = "none";
										this.signupFormNameIcon.style.display = "inline";
										this.signupFormNameIcon.src="/images/ic_checkmark.png";

										if(password.length == 0){
											this.signupPasswordInput.className = "custom-signup-form-input rex-width-100pp rex-pad8px rex-fs-normal rex-mt-16px";
											this.signupPasswordInputError.style.display = "none";
											dialogHandler.show(Dialog.SIGNUP);
										}else if(password.length < 6){
											this.signupPasswordInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-16px";
											this.signupPasswordInputError.textContent = "Password must be 6 or more characters";
											this.signupPasswordInputError.style.display = "block";
											dialogHandler.show(Dialog.SIGNUP);
										}else{
											this.signupPasswordInput.className = "custom-signup-form-input-success rex-width-100pp rex-pad8px rex-fs-normal rex-mt-16px";
											this.signupPasswordInputError.style.display = "none";

											let data = { email: email, roomName: name, password: password };

											sendPostRequest(getHostUrl() + "/auth/email/signup", data)
											.then(json => {
												if(json.status == "success"){
													dialogHandler.show(Dialog.NOTIFICATION, {
														title: "Verification email sent!",
														message: `An email was sent to you at ${email}. Click the link to verify your email address.`,
														btnLabel: "PROCEED",
														onclick: () => {
															dialogHandler.hide();
														}
													});
												}else{
													dialogHandler.show(Dialog.NOTIFICATION, {
														title: "Failed to send verification email",
														message: json.message,
														btnLabel: "PROCEED",
														onclick: () => {
															dialogHandler.show(Dialog.SIGNUP);
														},
														windowClickListener: () => {
															dialogHandler.show(Dialog.SIGNUP);
														}
													});
												}
											}).catch(err => {
												console.error(err);
												dialogHandler.show(Dialog.SIGNUP);
											});
										}
									}
								}else{
									dialogHandler.show(Dialog.NOTIFICATION, {
										title: "Error",
										message: json.message,
										btnLabel: "PROCEED",
										onclick: () => {
											dialogHandler.show(Dialog.SIGNUP);
										},
										windowClickListener: () => {
											dialogHandler.show(Dialog.SIGNUP);
										}
									});
								}
							}).catch(err => {
								console.error(err);
								dialogHandler.show(Dialog.SIGNUP);
							});
						}
					}
				}else{
					dialogHandler.show(Dialog.NOTIFICATION, {
						title: "Error",
						message: json.message,
						btnLabel: "PROCEED",
						onclick: () => {
							dialogHandler.show(Dialog.SIGNUP);
						},
						windowClickListener: () => {
							dialogHandler.show(Dialog.SIGNUP);
						}
					});
				}
			}).catch(err => {
				console.error(err);
				dialogHandler.show(Dialog.SIGNUP);
			});
		}
	}

	validateSignupEmailInputListener(){
		let timeoutId = 0;
		this.signupEmailInput.addEventListener("keydown", e => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				let email = this.signupEmailInput.value.trim();
				if(email.length == 0){
					this.signupEmailInput.className = "custom-signup-form-input rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
					this.signupEmailInputError.style.display = "none";
				} else if(!isEmailValid(email)){
					this.signupEmailInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
					this.signupEmailInputError.textContent = "Invalid email address";
					this.signupEmailInputError.style.display = "block";
				}else{
					this.signupEmailInput.className = "custom-signup-form-input-success rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
					this.signupEmailInputError.style.display = "none";
					sendGetRequest(getHostUrl() + "/api/checkEmail?email=" + email)
					.then(json => {
						if(json.status == "success"){
							if(json.isRegistered){
								this.signupEmailInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
								this.signupEmailInputError.textContent = "Email is already registered";
								this.signupEmailInputError.style.display = "block";
							}
						}else{
							console.log(json.message);
						}
					}).catch(err => {
						console.log(err);
					});
				}
			}, 1300);
		});
	}

	validateRoomNameInputListener(){
		let timeoutId = 0;
		this.signupClaimLinkShareTXTInput.addEventListener("keydown", e => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				let roomName = this.signupClaimLinkShareTXTInput.value.trim();
				if(roomName.length == 0){
					this.signupFormNameContainer.className = "custom-signup-form-name-container rex-mt-16px custom-claim-link-signup-container-grid rex-pad8px rex-border";
					this.signupFormNameError.style.display = "none";
					this.signupFormNameIcon.style.display = "none";
				}else{
					this.signupFormNameContainer.className = "custom-signup-form-name-container rex-mt-16px custom-claim-link-signup-container-grid rex-pad8px rex-border";
					this.signupFormNameError.style.display = "none";
					this.signupFormNameIcon.style.display = "inline";
					this.signupFormNameIcon.src="/images/ic_loading.gif";
					sendGetRequest(getHostUrl() + "/api/checkRoomName?roomName=" + roomName)
					.then(json => {
						if(json.status == "success"){
							if(json.isRegistered){
								this.signupFormNameContainer.className = "custom-signup-form-name-container-error rex-mt-16px custom-claim-link-signup-container-grid rex-pad8px rex-border";
								this.signupFormNameError.textContent = "Name is already taken";
								this.signupFormNameError.style.display = "block";
								this.signupFormNameIcon.style.display = "inline";
								this.signupFormNameIcon.src="/images/ic_cancel.png";
							}else{
								this.signupFormNameContainer.className = "custom-signup-form-name-container-success rex-mt-16px custom-claim-link-signup-container-grid rex-pad8px rex-border";
								this.signupFormNameError.style.display = "none";
								this.signupFormNameIcon.style.display = "inline";
								this.signupFormNameIcon.src="/images/ic_checkmark.png";
							}
						}else{
							console.log(json.message);
						}
					}).catch(err => {
						console.log(err);
					});
				}
			}, 1300);
		});
	}

	validatePasswordInputListener(){
		let timeoutId = 0;
		this.signupPasswordInput.addEventListener("keydown", e => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				let password = this.signupPasswordInput.value.trim();
				if(password.length == 0){
					this.signupPasswordInput.className = "custom-signup-form-input rex-width-100pp rex-pad8px rex-fs-normal rex-mt-16px";
					this.signupPasswordInputError.style.display = "none";
				}else if(password.length < 6){
					this.signupPasswordInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-16px";
					this.signupPasswordInputError.textContent = "Password must be 6 or more characters";
					this.signupPasswordInputError.style.display = "block";
				}else{
					this.signupPasswordInput.className = "custom-signup-form-input-success rex-width-100pp rex-pad8px rex-fs-normal rex-mt-16px";
					this.signupPasswordInputError.style.display = "none";
				}
			}, 1300);
		});
	}
}

class LoadingDialog extends Dialog {
	constructor(modalBackground, modal){
		super(modalBackground, modal);

		this.windowClickListener = undefined;
	}

	windowClick(){
		if(this.windowClickListener){
			this.windowClickListener();
		}else{
			super.windowClick();
		}
	}

	hide(){
		super.hide();
	}

	show(params){
		super.show();
		this.windowClickListener = params.windowClickListener ?? undefined;
	}
}

class LoginDialog extends Dialog {
	constructor(modalBackground, modal){
		super(modalBackground, modal);
		this.loginEmailInput = document.getElementById("loginEmailInput");
		this.loginEmailInputError = document.getElementById("loginEmailInputError");
		this.loginPasswordInput = document.getElementById("loginPasswordInput");
		this.loginPasswordInputError = document.getElementById("loginPasswordInputError");
		this.btnLogin = document.getElementById("btnLogin");
		this.btnForgottenPassword = document.getElementById("btnForgottenPassword");
		this.btnLoginGoogle = document.getElementById("btnLoginGoogle");
		this.btnLoginFacebook = document.getElementById("btnLoginFacebook");
		this.btnLoginTwitter = document.getElementById("btnLoginTwitter");
		this.btnLoginFormSignup = document.getElementById("btnLoginFormSignup");

		this.validateEmailInputListener();
		this.validatePasswordInputListener();

		this.btnForgottenPassword.onclick = e => {
			dialogHandler.show(Dialog.RESOLVE_FORGOTTEN_PASSWORD);
		};

		this.loginEmailInput.addEventListener("keyup", e => {
			if(e.keyCode === 13){
				e.preventDefault();
				this.loginBtnClick();
			}
		});

		this.loginPasswordInput.addEventListener("keyup", e => {
			if(e.keyCode === 13){
				e.preventDefault();
				this.loginBtnClick();
			}
		});

		this.btnLogin.onclick = e => {
			this.loginBtnClick();
		};

		this.btnLoginGoogle.onclick = e => {
			window.open("/auth/google?type=login", "_self");
		};

		this.btnLoginFacebook.onclick = e => {
			window.open("/auth/facebook?type=login", "_self");
		};

		this.btnLoginTwitter.onclick = e => {
			window.open("/auth/twitter?type=login", "_self");
		};

		this.btnLoginFormSignup.onclick = e => {
			dialogHandler.show(Dialog.SIGNUP);
		};
	}

	hide(){
		super.hide();
	}
	
	show(params){
		super.show();
	}

	loginBtnClick(){
		let email = this.loginEmailInput.value.toLowerCase().trim();
		let password = this.loginPasswordInput.value.trim();

		if(!isEmailValid(email)){
			this.loginEmailInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
			this.loginEmailInputError.textContent = "Invalid email address";
			this.loginEmailInputError.style.display = "block";
			return;
		}

		if(password.length < 6){
			this.loginPasswordInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-16px";
			this.loginPasswordInputError.textContent = "Password must be 6 or more characters";
			this.loginPasswordInputError.style.display = "block";
			return;
		}

		dialogHandler.show(Dialog.LOADING, { windowClickListener: () => {} });

		sendGetRequest(getHostUrl() + "/api/checkEmail?email=" + email)
		.then(json => {
			if(json.status == "success"){
				if(!json.isRegistered){
					this.loginEmailInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
					this.loginEmailInputError.textContent = "Email not yet registered. Sign up";
					this.loginEmailInputError.style.display = "block";
					dialogHandler.show(Dialog.LOGIN);
				}else{
					let data = { email: email, password: password };

					sendPostRequest(getHostUrl() + "/auth/email/login", data)
					.then(json => {
						if(json.status == "success"){
							window.open(`/${json.roomName}`, "_self");
						}else{
							dialogHandler.show(Dialog.NOTIFICATION, {
								title: "Login failed",
								message: "Login details incorrect",
								btnLabel: "RETRY",
								onclick: () => {
									dialogHandler.show(Dialog.LOGIN);
								},
								windowClickListener: () => {
									dialogHandler.show(Dialog.LOGIN);
								}
							});
						}
					}).catch(err => {
						console.error(err);
						dialogHandler.show(Dialog.NOTIFICATION, {
							title: "Login failed",
							message: "Please check your internet connection",
							btnLabel: "RETRY",
							onclick: () => {
								dialogHandler.show(Dialog.LOGIN);
							},
							windowClickListener: () => {
								dialogHandler.show(Dialog.LOGIN);
							}
						});
					});	
				}
			}else{
				dialogHandler.show(Dialog.NOTIFICATION, {
					title: "Error",
					message: json.message,
					btnLabel: "PROCEED",
					onclick: () => {
						dialogHandler.show(Dialog.LOGIN);
					},
					windowClickListener: () => {
						dialogHandler.show(Dialog.LOGIN);
					}
				});
			}
		}).catch(err => {
			console.error(err);
			dialogHandler.show(Dialog.NOTIFICATION, {
				title: "Login failed",
				message: "Please check your internet connection",
				btnLabel: "RETRY",
				onclick: () => {
					dialogHandler.show(Dialog.LOGIN);
				},
				windowClickListener: () => {
					dialogHandler.show(Dialog.LOGIN);
				}
			});
		});
	}

	validateEmailInputListener(){
		let timeoutId = 0;
		this.loginEmailInput.addEventListener("keydown", e => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				let email = this.loginEmailInput.value.trim();
				if(email.length == 0){
					this.loginEmailInput.className = "custom-signup-form-input rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
					this.loginEmailInputError.style.display = "none";
				} else if(!isEmailValid(email)){
					this.loginEmailInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
					this.loginEmailInputError.textContent = "Invalid email address";
					this.loginEmailInputError.style.display = "block";
				}else{
					this.loginEmailInput.className = "custom-signup-form-input-success rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
					this.loginEmailInputError.style.display = "none";
					sendGetRequest(getHostUrl() + "/api/checkEmail?email=" + email)
					.then(json => {
						if(json.status == "success"){
							if(!json.isRegistered){
								this.loginEmailInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
								this.loginEmailInputError.textContent = "Email not yet registered. Sign up";
								this.loginEmailInputError.style.display = "block";
							}
						}else{
							console.log(json.message);
						}
					}).catch(err => {
						console.log(err);
					});
				}
			}, 1300);
		});
	}

	validatePasswordInputListener(){
		let timeoutId = 0;
		this.loginPasswordInput.addEventListener("keydown", e => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				let password = this.loginPasswordInput.value.trim();
				if(password.length == 0){
					this.loginPasswordInput.className = "custom-signup-form-input rex-width-100pp rex-pad8px rex-fs-normal rex-mt-16px";
					this.loginPasswordInputError.style.display = "none";
				}else if(password.length < 6){
					this.loginPasswordInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-16px";
					this.loginPasswordInputError.textContent = "Password must be 6 or more characters";
					this.loginPasswordInputError.style.display = "block";
				}else{
					this.loginPasswordInput.className = "custom-signup-form-input-success rex-width-100pp rex-pad8px rex-fs-normal rex-mt-16px";
					this.loginPasswordInputError.style.display = "none";
				}
			}, 1300);
		});
	}
}

class ResolveForgottenPasswordDialog extends Dialog {
	constructor(modalBackground, modal){
		super(modalBackground, modal);
		this.forgottenPasswordBg = document.getElementById("forgottenPasswordBg");
		this.forgottenPasswordLabel = document.getElementById("forgottenPasswordLabel");
		this.forgottenPasswordMessage = document.getElementById("forgottenPasswordMessage");
		this.forgottenPasswordInput = document.getElementById("forgottenPasswordInput");
		this.forgottenPasswordInputError = document.getElementById("forgottenPasswordInputError");
		this.btnResolveForgottenPassword = document.getElementById("btnResolveForgottenPassword");
		this.validateEmailInputListener();

		this.forgottenPasswordBg.onsubmit = e => {
			e.preventDefault();
		}

		this.forgottenPasswordInput.addEventListener("keyup", e => {
			if(e.keyCode === 13){
				e.preventDefault();
				this.btnSendCodeClick();
			}
		});

		this.btnResolveForgottenPassword.onclick = e => {
			this.btnSendCodeClick();
		};
	}
	
	hide(){
		super.hide();
	}

	show(params){
		super.show();
	}

	btnSendCodeClick(){
		let email = this.forgottenPasswordInput.value.toLowerCase().trim();
		
		if(!isEmailValid(email)){
			this.forgottenPasswordInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
			this.forgottenPasswordInputError.textContent = "Invalid email address";
			this.forgottenPasswordInputError.style.display = "block";
			return;
		}
		
		dialogHandler.show(Dialog.LOADING, { windowClickListener: () => {} });

		sendGetRequest(getHostUrl() + "/api/checkEmail?email=" + email)
		.then(json => {
			if(json.status == "success"){
				if(!json.isRegistered){
					this.forgottenPasswordInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
					this.forgottenPasswordInputError.textContent = "Email not yet registered. Sign up";
					this.forgottenPasswordInputError.style.display = "block";
					dialogHandler.show(Dialog.RESOLVE_FORGOTTEN_PASSWORD);
				}else{
					let data = { email: email };

					sendPostRequest(getHostUrl() + "/auth/email/forgottenPassword", data)
					.then(json => {
						if(json.status == "success"){
							dialogHandler.show(Dialog.CONFIRM_EMAIL, { 
								email: email,
								windowClickListener: () => {} 
							});
						}else{
							dialogHandler.show(Dialog.NOTIFICATION, {
								title: "Authentication failed",
								message: "Email could not be authenticated. Please check your internet connection and try again.",
								btnLabel: "PROCEED",
								onclick: () => {
									dialogHandler.show(Dialog.RESOLVE_FORGOTTEN_PASSWORD);
								},
								windowClickListener: () => {
									dialogHandler.show(Dialog.RESOLVE_FORGOTTEN_PASSWORD);
								}
							});
						}
					}).catch(err => {
						console.error(err);
						dialogHandler.show(Dialog.NOTIFICATION, {
							title: "Authentication failed",
							message: "Your email could not be authenticated. Please check your internet connection",
							btnLabel: "RETRY",
							onclick: () => {
								dialogHandler.show(Dialog.RESOLVE_FORGOTTEN_PASSWORD);
							},
							windowClickListener: () => {
								dialogHandler.show(Dialog.RESOLVE_FORGOTTEN_PASSWORD);
							}
						});
					});	
				}
			}else{
				dialogHandler.show(Dialog.NOTIFICATION, {
					title: "Error",
					message: json.message,
					btnLabel: "PROCEED",
					onclick: () => {
						dialogHandler.show(Dialog.RESOLVE_FORGOTTEN_PASSWORD);
					},
					windowClickListener: () => {
						dialogHandler.show(Dialog.RESOLVE_FORGOTTEN_PASSWORD);
					}
				});
			}
		}).catch(err => {
			console.error(err);
			dialogHandler.show(Dialog.NOTIFICATION, {
				title: "Login failed",
				message: "Please check your internet connection",
				btnLabel: "RETRY",
				onclick: () => {
					dialogHandler.show(Dialog.RESOLVE_FORGOTTEN_PASSWORD);
				},
				windowClickListener: () => {
					dialogHandler.show(Dialog.RESOLVE_FORGOTTEN_PASSWORD);
				}
			});
		});
	}

	validateEmailInputListener(){
		let timeoutId = 0;
		this.forgottenPasswordInput.addEventListener("keydown", e => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				let email = this.forgottenPasswordInput.value.trim();
				if(email.length == 0){
					this.forgottenPasswordInput.className = "custom-signup-form-input rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
					this.forgottenPasswordInputError.style.display = "none";
				} else if(!isEmailValid(email)){
					this.forgottenPasswordInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
					this.forgottenPasswordInputError.textContent = "Invalid email address";
					this.forgottenPasswordInputError.style.display = "block";
				}else{
					this.forgottenPasswordInput.className = "custom-signup-form-input-success rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
					this.forgottenPasswordInputError.style.display = "none";
					sendGetRequest(getHostUrl() + "/api/checkEmail?email=" + email)
					.then(json => {
						if(json.status == "success"){
							if(!json.isRegistered){
								this.forgottenPasswordInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
								this.forgottenPasswordInputError.textContent = "Email not yet registered. Sign up";
								this.forgottenPasswordInputError.style.display = "block";
							}
						}else{
							console.log(json.message);
						}
					}).catch(err => {
						console.log(err);
					});
				}
			}, 1300);
		});
	}
}

class ConfirmEmailDialog extends Dialog {
	constructor(modalBackground, modal){
		super(modalBackground, modal);
		this.confirmEmailBg = document.getElementById("confirmEmailBg");
		this.confirmEmailReceipient = document.getElementById("confirmEmailReceipient");
		this.confirmEmailInput = document.getElementById("confirmEmailInput");
		this.confirmEmailInputError = document.getElementById("confirmEmailInputError");
		this.btnVerifyEmail = document.getElementById("btnVerifyEmail");
		this.confirmEmailResendCode = document.getElementById("confirmEmailResendCode");

		this.windowClickListener = undefined;
		this.email = undefined;

		this.validateCodeInputListener();

		this.confirmEmailBg.onsubmit = e => {
			e.preventDefault();
		}

		this.confirmEmailInput.addEventListener("keyup", e => {
			if(e.keyCode === 13){
				e.preventDefault();
				this.verifyCodeClick();
			}
		});

		this.btnVerifyEmail.onclick = e => {
			this.verifyCodeClick();
		};

		this.confirmEmailResendCode.onclick = e => {
			dialogHandler.show(Dialog.LOADING, { windowClickListener: () => {} });
			let data = { email: this.email };
			sendPostRequest(getHostUrl() + "/auth/email/forgottenPassword", data)
			.then(json => {
				if(json.status == "success"){
					dialogHandler.show(Dialog.NOTIFICATION, {
						title: "Verification code sent successfully!",
						message: "The verification code has been sent to your inbox. Check your email",
						btnLabel: "PROCEED",
						onclick: () => {
							dialogHandler.show(Dialog.CONFIRM_EMAIL, { 
								email: this.email,
								windowClickListener: () => {} 
							});
						},
						windowClickListener: () => {
							dialogHandler.show(Dialog.CONFIRM_EMAIL, { 
								email: this.email,
								windowClickListener: () => {} 
							});
						}
					});
				}else{
					dialogHandler.show(Dialog.NOTIFICATION, {
						title: "Code not sent",
						message: "Failed to send verification code. Check your internet connection.",
						btnLabel: "PROCEED",
						onclick: () => {
							dialogHandler.show(Dialog.CONFIRM_EMAIL, { 
								email: this.email,
								windowClickListener: () => {} 
							});
						},
						windowClickListener: () => {
							dialogHandler.show(Dialog.CONFIRM_EMAIL, { 
								email: this.email,
								windowClickListener: () => {} 
							});
						}
					});
				}
			}).catch(err => {
				console.error(err);
				dialogHandler.show(Dialog.NOTIFICATION, {
					title: "Failed to send code",
					message: "Verification code could not be sent. Please check your internet connection",
					btnLabel: "RETRY",
					onclick: () => {
						dialogHandler.show(Dialog.CONFIRM_EMAIL, { 
							email: this.email,
							windowClickListener: () => {} 
						});
					},
					windowClickListener: () => {
						dialogHandler.show(Dialog.CONFIRM_EMAIL, { 
							email: this.email,
							windowClickListener: () => {} 
						});
					}
				});
			});	
		};
	}
	
	windowClick(){
		if(this.windowClickListener){
			this.windowClickListener();
		}else{
			super.windowClick();
		}
	}

	hide(){
		super.hide();
	}

	show(params){
		super.show();
		this.email = params.email;
		this.confirmEmailReceipient.textContent = params.email;
		this.confirmEmailInput.value = params.code ?? "";
		this.windowClickListener = params.windowClickListener;
	}

	verifyCodeClick(){
		let code = this.confirmEmailInput.value.trim();
		
		if(!code){
			this.confirmEmailInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
			this.confirmEmailInputError.textContent = "Enter the code here";
			this.confirmEmailInputError.style.display = "block";
			return;
		}

		if(isNaN(code)){
			this.confirmEmailInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
			this.confirmEmailInputError.textContent = "Enter a numeric code";
			this.confirmEmailInputError.style.display = "block";
			return;
		}

		if(code.length != 6){
			this.confirmEmailInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
			this.confirmEmailInputError.textContent = "Code is 6 digits";
			this.confirmEmailInputError.style.display = "block";
			return;
		}
		
		dialogHandler.show(Dialog.LOADING, { windowClickListener: () => {} });

		let data = { email: this.email, code: code };

		sendPostRequest(getHostUrl() + "/auth/email/confirmEmail", data)
		.then(json => {
			if(json.status == "success"){
				dialogHandler.show(Dialog.CHANGE_PASSWORD, { 
					email: this.email,
					code: code,
					windowClickListener: () => {} 
				});
			}else{
				this.confirmEmailInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
				this.confirmEmailInputError.textContent = "Incorrect code";
				this.confirmEmailInputError.style.display = "block";
				dialogHandler.show(Dialog.CONFIRM_EMAIL, {
					code: code,
					email: this.email,
					windowClickListener: this.windowClickListener
				});
			}
		}).catch(err => {
			console.error(err);
			dialogHandler.show(Dialog.NOTIFICATION, {
				title: "Verification failed",
				message: "Code could not be verified. Please check your internet connection",
				btnLabel: "RETRY",
				onclick: () => {
					dialogHandler.show(Dialog.CONFIRM_EMAIL, {
						code: code,
						email: this.email,
						windowClickListener: this.windowClickListener
					});
				},
				windowClickListener: () => {
					dialogHandler.show(Dialog.CONFIRM_EMAIL, {
						code: code,
						email: this.email,
						windowClickListener: this.windowClickListener
					});
				}
			});
		});	
	}

	validateCodeInputListener(){
		let timeoutId = 0;
		this.confirmEmailInput.addEventListener("keydown", e => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				let code = this.confirmEmailInput.value.trim();
				if(!code){
					this.confirmEmailInput.className = "custom-signup-form-input rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
					this.confirmEmailInputError.style.display = "none";
				} else if(isNaN(code)){
					this.confirmEmailInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
					this.confirmEmailInputError.textContent = "Enter a numeric code";
					this.confirmEmailInputError.style.display = "block";
				} else if(code.length != 6){
					this.confirmEmailInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
					this.confirmEmailInputError.textContent = "Code is 6 digits";
					this.confirmEmailInputError.style.display = "block";
				} else {
					this.confirmEmailInput.className = "custom-signup-form-input-success rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
					this.confirmEmailInputError.style.display = "none";
				}
			}, 1300);
		});
	}
}

class ChangePasswordDialog extends Dialog {
	constructor(modalBackground, modal){
		super(modalBackground, modal);
		this.changePasswordBg = document.getElementById("changePasswordBg");
		this.changePasswordInput = document.getElementById("changePasswordInput");
		this.changePasswordInputError = document.getElementById("changePasswordInputError");
		this.btnChangePassword = document.getElementById("btnChangePassword");

		this.windowClickListener = undefined;
		this.email = undefined;
		this.code = undefined;

		this.validatePasswordInputListener();

		this.changePasswordBg.onsubmit = e => {
			e.preventDefault();
		}

		this.changePasswordInput.addEventListener("keyup", e => {
			if(e.keyCode === 13){
				e.preventDefault();
				this.changePasswordClick();
			}
		});

		this.btnChangePassword.onclick = e => {
			this.changePasswordClick();
		};
	}

	windowClick(){
		if(this.windowClickListener){
			this.windowClickListener();
		}else{
			super.windowClick();
		}
	}

	hide(){
		super.hide();
	}

	show(params){
		super.show();
		this.email = params.email;
		this.code = params.code;
		if (params.password) this.changePasswordInput.value = params.password;
		this.windowClickListener = params.windowClickListener;
	}

	changePasswordClick(){
		let password = this.changePasswordInput.value.trim();
		
		if(password.length < 6){
			this.changePasswordInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
			this.changePasswordInputError.textContent = "Password must be 6 or more characters";
			this.changePasswordInputError.style.display = "block";
			return;
		}
		
		dialogHandler.show(Dialog.LOADING, { windowClickListener: () => {} });

		let data = { email: this.email, code: this.code, password: password };

		sendPostRequest(getHostUrl() + "/auth/email/changePassword", data)
		.then(json => {
			if(json.status == "success"){
				dialogHandler.show(Dialog.NOTIFICATION, {
					title: "Password changed successfully!",
					message: "Your password has been changed successfully.",
					btnLabel: "PROCEED",
					onclick: () => {
						dialogHandler.show(Dialog.LOGIN);
					},
					windowClickListener: () => {
						dialogHandler.show(Dialog.LOGIN);
					}
				});
			}else{
				dialogHandler.show(Dialog.NOTIFICATION, {
					title: "Failed to change password",
					message: "Your password could not be changed. Please check your internet connection and retry",
					btnLabel: "RETRY",
					onclick: () => {
						dialogHandler.show(Dialog.CHANGE_PASSWORD, {
							code: this.code,
							email: this.email,
							windowClickListener: this.windowClickListener
						});
					},
					windowClickListener: () => {
						dialogHandler.show(Dialog.CHANGE_PASSWORD, {
							code: this.code,
							email: this.email,
							windowClickListener: this.windowClickListener
						});
					}
				});
			}
		}).catch(err => {
			console.error(err);
			dialogHandler.show(Dialog.NOTIFICATION, {
				title: "Failed to change password",
				message: "Your password could not be changed. Please check your internet connection and retry",
				btnLabel: "RETRY",
				onclick: () => {
					dialogHandler.show(Dialog.CHANGE_PASSWORD, {
						code: this.code,
						email: this.email,
						windowClickListener: this.windowClickListener
					});
				},
				windowClickListener: () => {
					dialogHandler.show(Dialog.CHANGE_PASSWORD, {
						code: this.code,
						email: this.email,
						windowClickListener: this.windowClickListener
					});
				}
			});
		});	
	}

	validatePasswordInputListener(){
		let timeoutId = 0;
		this.changePasswordInput.addEventListener("keydown", e => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				let password = this.changePasswordInput.value.trim();
				if(password.length == 0){
					this.changePasswordInput.className = "custom-signup-form-input rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
					this.changePasswordInputError.style.display = "none";
				}else if(password.length < 6){
					this.changePasswordInput.className = "custom-signup-form-input-error rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
					this.changePasswordInputError.textContent = "Password must be 6 or more characters";
					this.changePasswordInputError.style.display = "block";
				}else{
					this.changePasswordInput.className = "custom-signup-form-input-success rex-width-100pp rex-pad8px rex-fs-normal rex-mt-32px";
					this.changePasswordInputError.style.display = "none";
				}
			}, 1300);
		});
	}
}

class NotificationDialog extends Dialog {
	constructor(modalBackground, modal){
		super(modalBackground, modal);
		this.notificationHeadingLabel = document.getElementById("notificationLabel");
		this.notificationMessageLabel = document.getElementById("notificationBody");
		this.btnNotificationProceed = document.getElementById("btnNotificationProceed");

		this.windowClickListener = undefined;
	}

	windowClick(){
		if(this.windowClickListener){
			this.windowClickListener();
		}else{
			super.windowClick();
		}
	}
	
	hide(){
		super.hide();
	}

	show(params){
		super.show();
		this.notificationHeadingLabel.textContent = params.title;
		this.notificationMessageLabel.textContent = params.message;
		this.btnNotificationProceed.textContent = params.btnLabel;
		this.btnNotificationProceed.onclick = params.onclick;
		this.windowClickListener = params.windowClickListener ?? undefined;
	}
}