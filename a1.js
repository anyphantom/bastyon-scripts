// ==UserScript==
// @name         Bastyon True Decentralization
// @description  Bastyon social-network unfortunately lacks some decentralization. This extensions returns the right to the freedom of speech.
// @version      0.0.2
// @author       anyphantom
// @supportURL   https://github.com/anyphantom/bastyon-scripts/issues
// @namespace    https://github.com/anyphantom
// @match        https://bastyon.com/*
// @icon         https://github.com/anyphantom/icons/a1.png
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

async function killBastyonLogger() {
    const intervalId = setInterval(() => {
        if (app.Logger.instance) {
            app.Logger.instance = axios.create({
                baseURL: 'https://127.0.0.1:443/',
            });
            clearInterval(intervalId);
        }
    });
}

killBastyonLogger();

function awaitLocales() {
    return new Promise((resolve) => {
        const intervalId = setInterval(() => {
            if (app?.localization?.key) {
                resolve(app.localization.key);
                clearInterval(intervalId);
            }
        });
    });
}

let centralBansConfig = await GM.getValue('CentralBansConfig');
let confirmedUsersConfig = await GM.getValue('ConfirmedUsersConfig');

if (!centralBansConfig) {
    GM.setValue('CentralBansConfig', {});
    centralBansConfig = {};
}

if (!confirmedUsersConfig) {
    GM.setValue('ConfirmedUsersConfig', {});
    confirmedUsersConfig = {};
}

const locales = {
    appName: {
        ru: 'Расширенный контроль Бастионом',
        en: 'Bastyon extended control',
    },
    centralBansHeader: {
        ru: 'Централизованный бан',
        en: 'Centralized user ban',
    },
    centralBansDescription: {
        ru: 'Вы можете локально разблокировать пользователей из списка ниже. Просто снимите галки с нужных',
        en: 'You can unban locally the next users. Just remove the checkbox',
    },
    confirmedUsersHeader: {
        ru: 'Подтверждённые пользователи',
        en: 'Confirmed users',
    },
    confirmedUsersDescription: {
        ru: 'Эти пользователи были подтверждены руководством Бастиона',
        en: 'This are the users that was confirmed by Bastyon executives',
    },
    clearSettings: {
        ru: 'Очистить настройки',
        en: 'Clear settings',
    },
    centralBanMessage: {
        ru: 'Этот пользователь заблокирован руководством Бастиона',
        en: 'This user was blocked by Bastyon executives',
    },
    centralBanMessage2: {
        ru: 'Благодаря расширению ExtendedBastyon, вы можете снять бан локально',
        en: 'Thanks to ExtendedBastyon extension you can locally unban him',
    },
    unbanButton: {
        ru: 'Снять бан',
        en: 'Unban user',
    },
    tempUnbanButton: {
        ru: 'Посмотреть профиль и решить',
        en: 'Take a look and decide',
    },
};

const lang = await awaitLocales();

const styles = `
<style>
    .remove-scroll {
        overflow: hidden;
    }

    .clear-settings {
        float: right;
        display: flex;
        line-height: 25pt;
        flex-direction: row;
        align-items: center;
        cursor: pointer;
        font-family: Roboto, Arial, Tahoma;
    }

    .clear-settings::before {
        font-family: "Font Awesome 5 Free";
        margin-right: 3pt;
    }

    .clear-settings:hover {
        color: #ff0000;
    }

    .btd-window {
        z-index: 1000;
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: white;
        font-family: Roboto, Arial, Tahoma;
        color: #333;
    }

    .btd-window.hidden {
        display: none;
    }

    .btd-window .wrapper {
        max-width: 1280px;
        min-height: 100vh;
        margin: 0 auto;
        padding-left: 1em;
        padding-right: 1em;
        margin-top: 1em;
        margin-bottom: 1em;
        overflow-y: scroll;
    }

    .btd-window .header {
        font-weight: bold;
    }

    .btd-window .header.h1 {
        font-size: 25pt;
        border-bottom: 3px #333 solid;
        margin-bottom: 1em;
    }

    .btd-window .header.h2 {
        font-size: 15pt;
    }

    .btd-window .description {
        font-size: 9pt;
        margin-bottom: 2em;
        font-style: italic;
    }

    .btd-window .block {
        margin-bottom: 0.5em;
    }

    .btd-window .block .options {
        display: flex;
        max-height: 200px;
        flex-direction: row;
        flex-wrap: wrap;
    }

    .btd-window .block .options div {
        padding-right: 20px;
    }

    .btd-unban-panel {
        padding-top: 25pt;
    }

    .btd-unban-panel button {
        margin-left: 1pt;
        margin-right: 1pt;
    }
</style>
`;

const btdWindowTemplate = `
<div class="btd-window hidden">
    <div class="wrapper">
        <i class="fa fa-trash clear-settings">${locales.clearSettings[lang]}</i>
        <div class="header h1">${locales.appName[lang]}</div>
        <div class="block central-bans">
            <div class="header h2">${locales.centralBansHeader[lang]}</div>
            <div class="description">${locales.centralBansDescription[lang]}</div>
            <div class="options">
                <!-- Populated on-run -->
            </div>
        </div>
        <div class="block confirmed-users">
            <div class="header h2">${locales.confirmedUsersHeader[lang]}</div>
            <div class="description">${locales.confirmedUsersDescription[lang]}</div>
            <div class="options">
                <!-- Populated on-run -->
            </div>
        </div>
    </div>
</div>
`;

async function loadCentralizedUserBans() {
    const template = (nickname, address, checked) => `
        <div data-address="${address}">
            <input type="checkbox" value="${address}" ${checked ? 'checked' : ''}/>
            <label><a href="${nickname || address}">${nickname || address}</a></label>
        </div>
    `;

    let userAddress;
    const pagePathname = (new URL(window.location)).pathname.slice(1);
    const pageProfileAddress = Object.keys(centralBansConfig).find((uAddr) => {
        if (uAddr === pagePathname || centralBansConfig[uAddr]?.nickname === pagePathname) {
            userAddress = uAddr;
            return true;
        }
    });

    const pageProfile = centralBansConfig[pageProfileAddress];

    if (pageProfile) {
        const intervalId = setInterval(() => {
            const error404 = $('#page404')[0];

            if (error404) {
                $('#page404 .caption').text(locales.centralBanMessage[lang]);
                $('#page404 .subcaption').text(locales.centralBanMessage2[lang]);

                $('#page404 .caption').parent().append(`
                    <div class="btd-unban-panel">
                        <button class="unban">${locales.unbanButton[lang]}</button>
                        <button class="temp-unban">${locales.tempUnbanButton[lang]}</button>
                    </div>
                `);

                $('#page404 button.unban').click((e) => {
                    centralBansConfig[userAddress].unbanned = true;

                    GM.setValue('CentralBansConfig', centralBansConfig);

                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                });

                $('#page404 button.temp-unban').click((e) => {
                    centralBansConfig[userAddress].tempUnban = true;

                    GM.setValue('CentralBansConfig', centralBansConfig);

                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                });

                clearInterval(intervalId);
            }
        });
    }

    return new Promise((resolve) => {
        const intervalId = setInterval(() => {
            if (app.platform?.bchl) {
                clearInterval(intervalId);

                const list = [
                    ...Object.keys(app.platform.bch),
                    ...Object.keys(app.platform.bchl),
                ];

                const preparedList = list.map((address) => {
                    if(!centralBansConfig[address]) {
                        centralBansConfig[address] = {};
                    }

                    let nickname = centralBansConfig[address]?.nickname;

                    if (!nickname) {
                        console.log('RPC', address);

                        app.api.rpc('getuserprofile', [[address]]).then((data) => {
                            centralBansConfig[address].nickname = data[0].name;

                            GM.setValue('CentralBansConfig', centralBansConfig);

                            $(`.central-bans div[data-address="${address}"] label`).text(data[0].name);
                        });
                    }

                    $(`.central-bans div[data-address="${address}"] label`).text(nickname);

                    const checked = !centralBansConfig[address].unbanned;
                    const tempUnban = centralBansConfig[address].tempUnban;

                    if (!checked || tempUnban) {
                        delete app.platform.bch[address];
                        delete app.platform.bchl[address];
                    }

                    if (tempUnban) {
                        delete centralBansConfig[address].tempUnban;
                        GM.setValue('CentralBansConfig', centralBansConfig);
                    }

                    return template(nickname, address, checked);
                });

                resolve(preparedList.join(''));
            }
        });
    });
}

async function loadConfirmedUsers() {
    const template = (nickname, address, checked) => `
        <div data-address="${address}">
            <input type="checkbox" value="${address}" ${checked ? 'checked' : ''}/>
            <label><a href="${nickname || address}">${nickname || address}</a></label>
        </div>
    `;

    return new Promise((resolve) => {
        const intervalId = setInterval(() => {
            if (app.platform?.real) {
                clearInterval(intervalId);

                const list = Object.keys(app.platform.real);

                const preparedList = list.map((address) => {
                    if(!confirmedUsersConfig[address]) {
                        confirmedUsersConfig[address] = {};
                    }

                    let nickname = confirmedUsersConfig[address]?.nickname;

                    if (!nickname) {
                        console.log('RPC', address);
                        app.api.rpc('getuserprofile', [[address]]).then((data) => {
                            confirmedUsersConfig[address].nickname = data[0].name;

                            GM.setValue('ConfirmedUsersConfig', confirmedUsersConfig);

                            $(`.confirmed-users div[data-address="${address}"] label`).text(data[0].name);
                        });
                    }

                    const checked = !confirmedUsersConfig[address].unconfirmed;

                    if (!checked) {
                        delete app.platform.real[address];
                    }

                    return template(nickname, address, checked);
                });

                resolve(preparedList.join(''));
            }
        });
    });
}

(async function() {
    'use strict';

    $(document.body).append(`${styles}${btdWindowTemplate}`);

    $('.clear-settings').click(() => {
        GM.setValue('CentralBansConfig', undefined);
    });

    $('.central-bans .options').append(await loadCentralizedUserBans());

    $('.confirmed-users .options').append(await loadConfirmedUsers());

    $('.confirmed-users input').click((e) => {
        const address = e.target.value;

        if (confirmedUsersConfig[address].unconfirmed) {
            confirmedUsersConfig[address].unconfirmed = false;
        } else {
            confirmedUsersConfig[address].unconfirmed = true;

            delete app.platform.real[address];
        }

        GM.setValue('ConfirmedUsersConfig', confirmedUsersConfig);
    });

    $('.central-bans input').click((e) => {
        const address = e.target.value;

        if (centralBansConfig[address].unbanned) {
            centralBansConfig[address].unbanned = false;
        } else {
            centralBansConfig[address].unbanned = true;

            delete app.platform.bch[address];
            delete app.platform.bchl[address];
        }

        GM.setValue('CentralBansConfig', centralBansConfig);
    });

    let btdWindowVisible = false;
    const combokeys = {};

    document.addEventListener('keyup', (e) => {
        delete combokeys[e.code];
    });

    document.addEventListener('keydown', (e) => {
        console.log(e);

        combokeys[e.code] = true;

        const isCtrl = combokeys.ControlLeft || combokeys.ControlRight;
        const isKeyA = combokeys.KeyA;

        if (isCtrl && isKeyA) {
            if (btdWindowVisible) {
                $('.btd-window').addClass('hidden');
                btdWindowVisible = false;

                $('html').removeClass('remove-scroll');
            } else {
                $('.btd-window').removeClass('hidden');
                btdWindowVisible = true;

                $('html').addClass('remove-scroll');
            }
        }
    });
})();
