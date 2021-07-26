function getTranslation(lang, text, dictionary){
    let matchingEntry = dictionary.find(entry => {
        let translations = Object.values(entry);
        return translations.includes(text);
    });
    if(matchingEntry){
        return matchingEntry[lang];
    }else{
        return text;
    }
}

class TranslateSelector {
    constructor(lang){
        this.lang = lang;
        this.selectLanguage(lang.chosenLang);
    }

    onchange = undefined;
    
    selectLanguage(chosenLang){
        let listOfLanguages = Object.keys(this.lang.dictionary[0]);
        let lang = listOfLanguages.find(lang => lang === chosenLang);
        if(lang){
            this.lang.chosenLang = chosenLang;
            //setup language
            this.lang.dropdownLabelElm.textContent = lang;
            let innerHTML = "";
            listOfLanguages.forEach(lang => {
                let selectedElm = lang==chosenLang?"rex-item-selected":"";
                innerHTML += `<span class="custom-dropdown-content rex-fs-normal rex-display-block rex-pad12px16px rex-selectable-item-background rex-hover ${selectedElm}">${lang}</span>`;
            });
            this.lang.dropdownContentElm.innerHTML = innerHTML;
            //set listener
            let dropdownContentElms = document.getElementsByClassName("custom-dropdown-content");
            for(let i = 0; i < dropdownContentElms.length; i++){
                dropdownContentElms[i].onclick = () => {
                    let selectedLanguage = listOfLanguages[i];
                    this.selectLanguage(selectedLanguage);
                    if(this.onchange) this.onchange(selectedLanguage);
                    setCookie("lang", selectedLanguage, 7);
                };
            }
            //translate language
            let stringsToTranslateElms = document.querySelectorAll(`[${this.lang.stringAttribute}]`);
            stringsToTranslateElms.forEach(stringToTranslateElm => {
                this.lang.resolver.resolve(chosenLang, stringToTranslateElm, this.lang.dictionary);
            });
        }
    }
}

class TranslateResolver{
    constructor(){}

    resolve(lang, elm, dictionary){}
}

class ContentResolver extends TranslateResolver{
    constructor(){
        super();
    }

    resolve(lang, elm, dictionary){
        let originalText = elm.textContent;
        let translatedText = getTranslation(lang, originalText, dictionary);
        elm.textContent = translatedText;
    }
}

class PlaceholderResolver extends TranslateResolver{
    constructor(){
        super();
    }

    resolve(lang, elm, dictionary){
        let originalText = elm.placeholder;
        let translatedText = getTranslation(lang, originalText, dictionary);
        elm.placeholder = translatedText;
    }
}