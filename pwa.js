'use strict';

// TMV PWA install / launch helper.
// Android/Chromium: uses beforeinstallprompt when available.
// iPhone/iPad: shows browser-specific Share -> Add to Home Screen guidance.
(function(){
  let deferredInstallPrompt = null;

  function byId(id){ return document.getElementById(id); }
  function isStandalone(){
    return window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
  }
  function isIos(){
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  function isChrome(){
    const ua = navigator.userAgent || '';
    return /CriOS/i.test(ua) || (/Chrome/i.test(ua) && !/Edg|OPR|SamsungBrowser/i.test(ua));
  }
  function isAndroid(){ return /Android/i.test(navigator.userAgent || ''); }

  function installInstructions(){
    if(isIos() && isChrome()){
      return '<b>Add TMV PM to your iPhone Home Screen</b><br>1. Open this site in <b>Chrome</b>.<br>2. Tap <b>Share</b>.<br>3. Tap <b>Add to Home Screen</b>.<br>4. Tap <b>Add</b>.<br><br>The TMV icon will then open in its own app-style window.';
    }
    if(isIos()){
      return '<b>Add TMV PM to your iPhone Home Screen</b><br>1. Open this site in <b>Safari</b>.<br>2. Tap the <b>Share</b> button.<br>3. Tap <b>Add to Home Screen</b>.<br>4. Tap <b>Add</b>.<br><br>The TMV icon will then open in its own app-style window.';
    }
    if(isAndroid() && isChrome()){
      return '<b>Install TMV PM from Chrome</b><br>1. Tap the <b>Chrome menu</b> (⋮).<br>2. Tap <b>Install app</b> or <b>Add to Home screen</b>.<br>3. Confirm <b>Install</b> or <b>Add</b>.<br><br>The TMV icon will then launch the app from your Home screen.';
    }
    return '<b>Install TMV PM</b><br>Open your browser menu or Share menu and choose <b>Install app</b> or <b>Add to Home screen</b>.';
  }

  function updateInstallButton(){
    const button = byId('pwaInstallBtn');
    if(!button) return;
    if(isStandalone()){
      button.hidden = true;
      return;
    }
    button.hidden = false;
    button.textContent = isIos() ? 'Add to Home Screen' : 'Install App';
  }

  function showInstallHelp(){
    const modal = byId('pwaInstallModal');
    const text = byId('pwaInstallInstructions');
    if(text) text.innerHTML = installInstructions();
    if(modal) modal.classList.add('open');
  }

  window.closePwaInstallHelp = function(){
    const modal = byId('pwaInstallModal');
    if(modal) modal.classList.remove('open');
  };

  window.installTmvApp = async function(){
    if(isStandalone()) return;
    if(deferredInstallPrompt){
      deferredInstallPrompt.prompt();
      try { await deferredInstallPrompt.userChoice; } catch(_) {}
      deferredInstallPrompt = null;
      updateInstallButton();
      return;
    }
    showInstallHelp();
  };

  window.addEventListener('beforeinstallprompt', function(event){
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallButton();
  });

  window.addEventListener('appinstalled', function(){
    deferredInstallPrompt = null;
    updateInstallButton();
  });

  // Remember the last main app tab so the installed app returns where the user
  // was working. Hash links still take priority when explicitly supplied.
  function rememberView(view){
    if(view === 'tmv' || view === 'tracker' || view === 'tech'){
      try { localStorage.setItem('tmv_last_view', view); } catch(_) {}
    }
  }
  function restoreLastView(){
    if(location.hash) return;
    let view = '';
    try { view = localStorage.getItem('tmv_last_view') || ''; } catch(_) {}
    if(view === 'tmv' || view === 'tracker' || view === 'tech'){
      history.replaceState(null, '', '#' + view);
    }
  }

  restoreLastView();
  document.addEventListener('click', function(event){
    const button = event.target.closest && event.target.closest('nav button');
    if(!button) return;
    if(button.id === 'tabTmv') rememberView('tmv');
    else if(button.id === 'tabTracker') rememberView('tracker');
    else if(button.id === 'tabTech') rememberView('tech');
  });
  window.addEventListener('hashchange', function(){
    rememberView((location.hash || '').replace('#',''));
  });

  document.addEventListener('DOMContentLoaded', function(){
    updateInstallButton();
    const text = byId('pwaInstallInstructions');
    if(text) text.innerHTML = installInstructions();
  });
})();
