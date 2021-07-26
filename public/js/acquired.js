window.onload = () => {
	let container = document.getElementById("container");
	let colorTheme = document.getElementById("colorTheme");
	let customToggleLightSwitch = document.getElementById("customToggleLightSwitch");
	let languageToggle = document.getElementById("languageToggle");
	let selectedLang = document.getElementById("selectedLang");
	let languageToggleDropdown = document.getElementById("languageToggleDropdown");
	let roomName = document.getElementById("roomName");
	let claimLinkShareTXTInput = document.getElementById("claimLinkShareTXTInput");
	let btnClaimMyLink = document.getElementById("btnClaimMyLink");
    let btnLoginClaimLink = document.getElementById("btnLoginClaimLink");
	
	let btnSignup = document.getElementById("btnSignup");
	let btnSignupGoogle = document.getElementById("btnSignupGoogle");
	let btnSignupFacebook = document.getElementById("btnSignupFacebook");
	let btnSignupTwitter = document.getElementById("btnSignupTwitter");
	let btnSignupFormLogin = document.getElementById("btnSignupFormLogin");
	let btnLoginGoogle = document.getElementById("btnLoginGoogle");
	let btnLoginFacebook = document.getElementById("btnLoginFacebook");
	let btnLoginTwitter = document.getElementById("btnLoginTwitter");
	let btnLoginFormSignup = document.getElementById("btnLoginFormSignup");
	let btnForgottenPassword = document.getElementById("btnForgottenPassword");
	let btnResolveForgottenPassword = document.getElementById("btnResolveForgottenPassword");
	let btnVerifyEmail = document.getElementById("btnVerifyEmail");
	let btnChangePassword = document.getElementById("btnChangePassword");
	let btnNotificationProceed = document.getElementById("btnNotificationProceed");

	let translateSelector = new TranslateSelector({
		dropdownLabelElm: selectedLang,
		dropdownContentElm: languageToggleDropdown,
		stringAttribute: "translate",
		chosenLang: "EN",
		dictionary: getDictionary(),
		resolver: new ContentResolver()
	});

	let dialog = new Dialog();

	roomName.textContent = ROOM_NAME;

	function translate(text){
		return getTranslation(
			translateSelector.lang.chosenLang,
			text,
			getDictionary()
		)
	}

    window.onclick = function(event) {
        dialog.windowClick(event);
        handleMinDropdown(event);
    };

    setSwitchListener();
    setupLanguageToggle();
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
    }

    function enableLightMode(){
        container.className = "custom-lm-container";
        colorTheme.textContent = translate("Light mode");
    }

    function enableDarkMode(){
        container.className = "custom-dm-container";
        colorTheme.textContent = translate("Dark mode");
    }

    btnClaimMyLink.onclick = e => {
        stopClickPropagation(e);
        dialog.show(Dialog.SIGNUP);
    }

    claimLinkShareTXTInput.addEventListener("keyup", e => {
        if(e.keyCode === 13){
            e.preventDefault();
            btnClaimMyLink.click();
        }
    });

    btnLoginClaimLink.onclick = e => {
        stopClickPropagation(e);
        dialog.show(Dialog.LOGIN);
    };

    btnSignup.onclick = e => {
        dialog.show(Dialog.LOADING);
    };

    btnSignupGoogle.onclick = e => {
        dialog.show(Dialog.LOADING);
    };

    btnSignupFacebook.onclick = e => {
        dialog.show(Dialog.LOADING);
    };

    btnSignupTwitter.onclick = e => {
        dialog.show(Dialog.LOADING);
    };

    btnSignupFormLogin.onclick = e => {
        dialog.show(Dialog.LOGIN);
    };

    btnLoginGoogle.onclick = e => {
        dialog.show(Dialog.LOADING);
    };

    btnLoginFacebook.onclick = e => {
        dialog.show(Dialog.LOADING);
    };

    btnLoginTwitter.onclick = e => {
        dialog.show(Dialog.LOADING);
    };

    btnLoginFormSignup.onclick = e => {
        dialog.show(Dialog.SIGNUP);
    };

    btnForgottenPassword.onclick = e => {
        dialog.show(Dialog.RESOLVE_FORGOTTEN_PASSWORD);
    };

    btnResolveForgottenPassword.onclick = e => {
        dialog.show(Dialog.CONFIRM_EMAIL);
    };

    btnVerifyEmail.onclick = e => {
        dialog.show(Dialog.CHANGE_PASSWORD);
    };

    btnChangePassword.onclick = e => {
        dialog.show(Dialog.NOTIFICATION);
    };

    btnNotificationProceed.onclick = e => {
        dialog.show(Dialog.LOGIN);
    };
};

class Dialog {
	static GOTO = 0;
	static SIGNUP = 1;
	static LOADING = 2;
	static LOGIN = 3;
	static RESOLVE_FORGOTTEN_PASSWORD = 4;
	static CONFIRM_EMAIL = 5;
	static CHANGE_PASSWORD = 6;
	static NOTIFICATION = 7;

	constructor(){
		this.modalBackground = document.getElementById("modalBackground");
		this.modal = document.getElementsByClassName("custom-modal");

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