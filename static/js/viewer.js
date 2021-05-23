let file = {};
let pointer = {};
let slider = {};
let pageURL = {};
let config = {}

window.onload = function () {
    setConfiguration();

    file.title = location.pathname.replace(config.contentsFolder, "");
    file.pages = 0;
    file.nowPage = 0;
    file.previewPage = 0;
    file.startPx = 0;

    setFileInfoData();
}

function setConfiguration() {
    config.contentsFolder = "/static/folder/";
    config.followingBufferPage = 5;
    config.previousBufferPage = 3;
    config.swipeBorder = 10;
    config.menu = false;
}

function setFileInfoData() {
    getDataFromServer(config.contentsFolder + file.title + '/info', 'json').then(function (response) {
        file.pages = response.totalPageNum;

        for (let i = 1; i < file.pages; ++i) {
            let div = document.getElementById('p0').cloneNode(true);
            div.id = `p${i}`;
            div.firstChild.id = `img-p${i}`;
            document.getElementById('contents').appendChild(div);
        }

        setImage(Array.from(Array(config.followingBufferPage), (_, item) => item));
    }, function (error) {
        console.log(error);
    })
}

function getDataFromServer(url, responseType) {
    return new Promise(function (resolve, reject) {
        let request = new XMLHttpRequest();
        request.open('GET', url);
        request.responseType = responseType
        request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status >= 200 && request.status < 400) {
                    resolve(this.response);
                } else {
                    reject(request.status);
                }
            }
        }
        request.send();
    });
}

function setImage(pages) {
    pages = pages.filter(page => page >= 0 && page < file.pages && pageURL[page] === undefined);

    for (const page of pages) {
        pageURL[page] = 'NowLoading';
        getDataFromServer(config.contentsFolder + file.title + '?page=' + page, 'blob').then(result => {
            const element = document.getElementById(`img-p${page}`);
            pageURL[page] = element.src = URL.createObjectURL(result);
            element.onload = function () {
                element.classList.remove('loader');
            }
        });
    }
}

function setThumbText(page, posX) {
    const textThumb = document.getElementById(`text-thumb`);
    textThumb.textContent = (page + 1) + '/' + file.pages + ' page';
    const thumb = document.getElementById(`thumb`);
    const thumbRect = document.getElementById(`thumb`).getBoundingClientRect();
    thumb.style.left = `${posX - thumbRect.width / 2}px`;
}

Math.lerp = function (t, b, c, d) {
    return c * t / d + b;
};

function movePageWithAnimation(duration, diffX) {
    const target = document.getElementById('contents');
    let startTime = null;
    const startX = file.startPx;
    file.startPx += diffX;

    requestAnimationFrame(update);

    function update(timestamp) {
        if (!startTime) startTime = timestamp;
        let elapsedTime = timestamp - startTime;

        if (elapsedTime > duration) elapsedTime = duration;

        const resultX = Math.lerp(elapsedTime, startX, diffX, duration);
        target.style.transform = `translate3d(${resultX}px, 0, 0)`;

        if (elapsedTime < duration) {
            requestAnimationFrame(update);
        }
    }
}

function movePage(diffX) {
    const target = document.getElementById('contents');
    target.style.transform = `translateX(${file.startPx + diffX}px)`;
    file.startPx += diffX;
}

function movePageTo(page) {
    const target = document.getElementById('contents');
    target.style.transform = `translateX(${innerWidth * page}px)`;

    file.startPx = innerWidth * page;
    file.nowPage = page;
    setImage(Array.from(Array(config.followingBufferPage), (_, item) => file.nowPage + item));
    setImage(Array.from(Array(config.previousBufferPage), (_, item) => file.nowPage - item - 1));
}

function swipeAction(diffX) {
    if (diffX > 0 && file.pages - 1 > file.nowPage) {
        movePageWithAnimation(250, innerWidth - diffX);
        file.nowPage++;
        setImage([file.nowPage + config.followingBufferPage - 1]);
    } else if (diffX < 0 && file.nowPage > 0) {
        movePageWithAnimation(250, -innerWidth - diffX);
        file.nowPage--;
        setImage([file.nowPage - config.previousBufferPage]);
    } else {
        movePage(-diffX);
    }
}

function clickAction(posX, diffX) {
    if (posX < innerWidth / 3 && file.pages - 1 > file.nowPage) {
        movePageWithAnimation(250, innerWidth);
        file.nowPage++;
        setImage([file.nowPage + config.followingBufferPage - 1]);
    } else if (posX > innerWidth * 2 / 3 && file.nowPage > 0) {
        movePageWithAnimation(250, -innerWidth);
        file.nowPage--;
        setImage([file.nowPage - config.previousBufferPage]);
    } else {
        movePage(-diffX);
        menuChange();
    }
}

function moveProgressBar(posX) {
    const width = document.getElementById('progress-bar-container').getBoundingClientRect().width;
    posX = Math.max(Math.min(posX, width), 0);
    document.getElementById('progress-bar').style.width = `${posX / width * 100}%`;
}

function menuChange() {
    if (!config.menu) {
        document.getElementById('header').classList.add('open');
        document.getElementById('footer').classList.add('open');
        config.menu = true;
    } else {
        document.getElementById('header').classList.remove('open');
        document.getElementById('footer').classList.remove('open');
        config.menu = false;
    }
}

//mouse touch keyboard EventListener
document.addEventListener('dragstart', function (event) {
    const draggable = event.target.getAttribute('draggable');
    if (!draggable || draggable === 'auto') {
        event.preventDefault();
    }
});

document.addEventListener('keydown', function (event) {
    if (config.menu) return;
    if (event.key === 'ArrowLeft') {
        movePageWithAnimation(250, innerWidth);
        file.nowPage++;
        setImage([file.nowPage + config.followingBufferPage - 1]);
    } else if (event.key === 'ArrowRight') {
        movePageWithAnimation(250, -innerWidth);
        file.nowPage--;
        setImage([file.nowPage - config.followingBufferPage]);
    }
})

document.addEventListener('mousedown', function (event) {
    if (!config.menu) {
        pointer.down = true;
    } else if (config.menu && event.target.id === "progress-bar-cover") {
        const rect = document.getElementById('progress-bar-container').getBoundingClientRect();
        const posX = -event.clientX + rect.left + rect.width;
        file.previewPage = Math.floor(file.pages * posX / rect.width);
        if (file.previewPage === file.pages) file.previewPage = file.pages;
        moveProgressBar(posX);
        setThumbText(file.previewPage, event.clientX);
        slider.down = true;
    } else if (config.menu && event.target.id !== "header" && event.target.id !== "footer") {
        menuChange();
    }
    pointer.posX = pointer.startX = event.clientX;
}, false)

document.addEventListener('mousemove', function (event) {
    if (pointer.down) {
        const diffX = event.clientX - pointer.posX;
        pointer.posX = event.clientX;
        movePage(diffX);
    } else if (slider.down) {
        const rect = document.getElementById('progress-bar-container').getBoundingClientRect();
        const posX = -event.clientX + rect.left + rect.width;
        file.previewPage = Math.floor(file.pages * posX / rect.width);
        if (file.previewPage === file.pages) file.previewPage = file.pages;
        moveProgressBar(posX);
        setThumbText(file.previewPage, event.clientX);
    }
}, false)

document.addEventListener('mouseup', function (event) {
    if (pointer.down) {
        const diffX = event.clientX - pointer.startX;
        if (Math.abs(diffX) > config.swipeBorder) {
            swipeAction(diffX);
        } else {
            clickAction(event.clientX, diffX);
        }
    }
    if (slider.down) {
        movePageTo(file.previewPage);
        file.nowPage = file.previewPage;
    }
    pointer.down = false;
    slider.down = false;
}, false)

document.addEventListener('touchstart', function (event) {
    if (!config.menu) {
        pointer.down = true;
    } else if (config.menu && event.target.id === "progress-bar-cover") {
        const rect = document.getElementById('progress-bar-container').getBoundingClientRect();
        const posX = -event.changedTouches[0].clientX + rect.left + rect.width;
        file.previewPage = Math.floor(file.pages * posX / rect.width);
        if (file.previewPage === file.pages) file.previewPage = file.pages;
        moveProgressBar(posX);
        setThumbText(file.previewPage, event.clientX);
        slider.down = true;
    } else if (config.menu && event.target.id !== "header" && event.target.id !== "footer") {
        menuChange();
    }
    pointer.posX = pointer.startX = event.changedTouches[0].clientX;
}, false);

document.addEventListener('touchmove', function (event) {
    if (pointer.down) {
        const diffX = event.changedTouches[0].clientX - pointer.posX;
        pointer.posX = event.changedTouches[0].clientX;
        movePage(diffX);
    } else if (slider.down) {
        const rect = document.getElementById('progress-bar-container').getBoundingClientRect();
        const posX = -event.changedTouches[0].clientX + rect.left + rect.width;
        file.previewPage = Math.floor(file.pages * posX / rect.width);
        if (file.previewPage === file.pages) file.previewPage = file.pages;
        moveProgressBar(posX);
        setThumbText(file.previewPage, event.clientX);
    }
}, false);

document.addEventListener('touchend', function (event) {
    event.preventDefault();
    if (pointer.down) {
        const diffX = event.changedTouches[0].clientX - pointer.startX;
        if (Math.abs(diffX) > config.swipeBorder) {
            swipeAction(diffX);
        } else {
            clickAction(event.changedTouches[0].clientX, diffX);
        }
    }
    if (slider.down) {
        movePageTo(file.previewPage);
        file.nowPage = file.previewPage;
    }
    pointer.down = false;
    slider.down = false;
}, false)