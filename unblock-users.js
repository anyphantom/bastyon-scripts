// ==UserScript==
// @name         Unblock users
// @description  You have the right to see what you want on decentralized network
// @version      0.0.1
// @author       anyphantom
// @supportURL   https://github.com/anyphantom/bastyon-scripts/issues
// @namespace    https://github.com/anyphantom
// @match        https://bastyon.com/*
// @icon         https://i.imgur.com/cx46IAs.png
// @grant        none
// ==/UserScript==

const UNBLOCK_LIST = `
// ADD ADDRESSES BELOW  ...

PU7D6X5bNUdEiuUGWGLp8C6TjSsB2hzHxL



`.split('\n').filter(x => !!x && x.slice(0, 2) !== '//')

(function() {
    const intervalId = setInterval(() => {
        if (app.platform.bchl) {
            UNBLOCK_LIST.forEach((USER_ADDRESS) => {
                delete app.platform.bch[USER_ADDRESS];
                delete app.platform.bchl[USER_ADDRESS];
                delete app.platform.nvadr[USER_ADDRESS];
            });

            clearInterval(intervalId);
        }
    });
})();
