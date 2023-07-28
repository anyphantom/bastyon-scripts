// ==UserScript==
// @name         Bastyon Video Download
// @description  Download video
// @version      0.0.1
// @author       anyphantom
// @supportURL   https://github.com/anyphantom/bastyon-scripts/issues
// @namespace    https://github.com/anyphantom
// @match        https://bastyon.com/*
// @icon         https://i.imgur.com/cx46IAs.png
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

function downloadUsingAnchorElement(url, filename) {
	const anchor = document.createElement('a');
	anchor.href = url;
	//anchor.download = filename;

	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
}

function mountOnAllVideos() {
    const elems = $('.statswrapperExtended:not(.downloadMounted) div');

    [...elems].forEach((elem) => {
        const videoUrl = $('.js-player', $(elem).closest('.url')).attr('data-plyr-embed-id');
        console.log(videoUrl);

        const rawUrlParts = videoUrl.split('/');
        const videoId = rawUrlParts.pop();
        const videoHost = rawUrlParts.pop();

        const resolutions = app.platform.sdk.videos.storage[videoId].data.original.streamingPlaylists[0].files.map(p => p.resolution.id)

        resolutions.forEach((r) => {
            const downloadBtn = $("<div>", {
                class: 'downloadBtn',
                style: `
                margin-top: 5px;
                padding: 2px 10px;
                background: #0aaeff;
                border-radius: 4px;
                font-weight: 700;
                color: #fff;
                text-shadow: 0px 1px 1px BLACK;
            `
            }).text(`DOWNLOAD ${r}`);

            const videoDownloadUrl = `https://${videoHost}/download/streaming-playlists/hls/videos/${videoId}-${r}-fragmented.mp4`;

            downloadBtn.click(() => downloadUsingAnchorElement(videoDownloadUrl));

            $(elem).parent().addClass('downloadMounted');
            $(elem).append(downloadBtn);
        });
    })
}

setInterval(() => mountOnAllVideos(), 1000);
