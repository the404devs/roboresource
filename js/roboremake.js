const globalSets = [];
let currentBlob;
let currentJump;
let overlayActive = false;
const alreadyAddedSortKeys = [];
let slideIndex = 0;
const currentPageName = location.pathname.substring(1, location.pathname.indexOf('.'));

const setDefinitions = {
    8547: "NXT 2.0",
    9797: "NXT Education Base",
    9648: "NXT Education Resource Set",
    45300: "WeDo 2.0",
    31313: "EV3 Home Edition",
    45544: "EV3 Education Core",
    45560: "EV3 Education Expansion"
}

async function dynamicContentGenerator(path, flip=false) {
    const data = await fetchHelper(path);

    const container = document.getElementById('dynamic-content');
    
    const keys = Object.keys(data);

    if (flip)
        keys.reverse();
    
    keys.forEach(key => {
        const instance = data[key];
        const blob = blobGenerator(key, instance.base.toLowerCase());

        blob.appendChild(titleGenerator(key));
        if (instance.date) 
            blob.appendChild(subheadGenerator(instance.date));
        else
            blob.appendChild(subheadGenerator(instance.base));
        blob.appendChild(detailsGenerator(instance));

        if (instance.galleries) {
            blob.appendChild(generateImageGalleries(instance.galleries, key));
        }

        if (document.getElementById('sort-base'))
            generateSortables('base', instance);
        
        container.appendChild(blob);
    });
    
    jumplistDynamicHeightCalculator();
    getIdFromURL();
}

function generateImageGalleries(galleries, key) {
    const container = document.createElement('div');
    container.className = 'gallery-container';

    let i = 0;
    galleries.forEach(gallery => {
        container.appendChild(subheadGenerator(gallery.name));

        const g = document.createElement('div');
        g.className = 'robo-gallery';
        g.id = `${key}-${i}`;

        let j = 0;
        gallery.images.forEach(image => {
            const img = document.createElement('img');
            img.className = 'robo-img';
            const ext = image.split(".").pop();
            img.src = `${gallery.path.replace('images', 'images/THUMBS')}${image.replace("." + ext, "_thumb." + ext)}`;
            img.loading = 'lazy';
            img.decoding = 'async';

            img.setAttribute('gallery', `${key}-${i}`);
            img.setAttribute('num', j+1);
            const id = `${key}-${i}-${j}`;
            img.id = id;

            img.onclick = () => {
                showImageOverlay(id);
            }

            g.appendChild(img);
            j++;
        });
        if (gallery.videos) {
            gallery.videos.forEach(video => {
                const img = document.createElement('img');
                img.className = 'robo-img';
                const ext = video.split(".").pop();
                img.src = `${gallery.path.replace('images', 'images/THUMBS')}${video.replace("." + ext, "_videothumb.webp")}`;
                img.setAttribute('gallery', `${key}-${i}`);
                img.setAttribute('num', j+1);
                const id = `${key}-${i}-${j}`;
                img.id = id;
                img.onclick = () => {
                    showImageOverlay(id);
                }
                g.appendChild(img);
                j++;
            });
        }
        

        container.appendChild(g);
        i++;
    });
    return container;
}

function blobGenerator(id, className) {
    const entry = document.createElement('div');
    entry.className = `blob ${className}`;
    const realID = clean(id);
    entry.id = realID;

    const jumplist = document.getElementById('jump-list');
    const jump = jumpGenerator(id, realID)
    currentBlob = entry;
    currentJump = jump;
    jumplist.appendChild(jump);
    return entry;
}

function jumpGenerator(text, id) {
    const jump = document.createElement('a');
    jump.className = 'link jump';
    jump.textContent = text;
    jump.onclick = () => { scrollToElem(id); }
    return jump;
}

function titleGenerator(text) {
    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = text;
    return title;
}

function subheadGenerator(text) {
    const sub = document.createElement('span');
    sub.className = 'subhead';
    sub.textContent = `> ${text}`;
    return sub;
}

function pairGenerator(a, b) {
    const pair = document.createElement('span');
    pair.className = 'pair';
    const first = document.createElement('b');
    first.textContent = a;

    if (typeof b === 'string') {
        pair.textContent = b;
    } else {
        pair.textContent = b.join(', ');
    }
    pair.prepend(first);
    return pair;
}

function detailsGenerator(instance) {
    const details = document.createElement('div');
    details.className = 'details';

    if (instance.author) {
        details.appendChild(pairGenerator('Author:', instance.author));
    }

    if (instance.lang) {
        details.appendChild(pairGenerator('Language:', instance.lang));
        generateSortables('lang', instance);
    }
    
    if (instance.tags) {
        details.appendChild(pairGenerator('Tags:', instance.tags));
        generateSortables('tags', instance);
    }

    if (instance.description) {
        details.appendChild(descriptionGenerator(instance.description));
    }

    if (instance.sets) {
        const setBox = document.getElementById("sort-set");
        const [a, b] = sortableListGenerator('Required Sets:', instance.sets, setDefinitions, setBox);
        details.append(a, b);
    }

    if (instance.files) {
        const [a,b] = listGenerator('Files:', instance.files, true, instance.base, )
        details.append(a, b);
    }

    if (instance.interlink) {
        const head = document.createElement('span');
        head.className = 'sec-head';
        head.textContent = 'Related Resources:';
        details.appendChild(head);
        if (instance.interlink.programs) {
            const progBtns = document.createElement('div');
            progBtns.className = 'button-group';
            instance.interlink.programs.forEach(program => {
                const a = document.createElement('a');
                if (currentPageName != 'programs') {
                    a.href = `./programs.html?id=${program.id}`;
                } else {
                    a.onclick = () => { scrollToElem(program.id) }
                }
                const button = document.createElement('button');
                button.textContent = program.text;
                a.appendChild(button);
                progBtns.appendChild(a);
            });
            details.appendChild(progBtns);
        }

        if (instance.interlink.instructions) {
            const instBtns = document.createElement('div');
            instBtns.className = 'button-group';
            instance.interlink.instructions.forEach(inst => {
                const a = document.createElement('a');
                if (currentPageName != 'instructions') {
                    a.href = `./instructions.html?id=${inst.id}`;
                } else {
                    a.onclick = () => { scrollToElem(inst.id) }
                }
                const button = document.createElement('button');
                button.textContent = inst.text;
                a.appendChild(button);
                instBtns.appendChild(a);
            });
            details.appendChild(instBtns);
        }

        if (instance.interlink.images) {
            const imgBtns = document.createElement('div');
            imgBtns.className = 'button-group';
            instance.interlink.images.forEach(image => {
                const a = document.createElement('a');
                if (currentPageName != 'images') {
                    a.href = `./images.html?id=${image.id}`;
                } else {
                    a.onclick = () => { scrollToElem(image.id) }
                }
                const button = document.createElement('button');
                button.textContent = image.text;
                a.appendChild(button);
                imgBtns.appendChild(a);
            });
            details.appendChild(imgBtns);
        }

        
    }

    return details;
}

function descriptionGenerator(body) {
    const p = document.createElement('p');
    p.className = 'description';
    p.innerHTML = body;
    return p;
}

function generateSortables(key, instance) {
    function createLink(text) {
        const key = clean(text);
        currentBlob.classList.add(key);
        currentJump.classList.add(key);
        if (!alreadyAddedSortKeys.includes(key)) {
            alreadyAddedSortKeys.push(key);
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.value = key;
            cb.id = key;
            cb.checked = true;
            cb.onchange = () => { sort() }

            const label = document.createElement('label');
            label.textContent = text;
            label.for = key;
            label.className = 'link';
            
            label.prepend(cb);
            list.appendChild(label);
        } 
    }

    const list = document.getElementById(`sort-${key}`);

    const data = instance[key];
    if (typeof data === 'string') {
        createLink(data);
    } else {
        data.forEach(sortable => {
            createLink(sortable);
        })
    }

}

function listGenerator(listTitle, listContent, generateLinks=false, linkPrefix) {
    const header = document.createElement('span');
    header.className = 'sec-head';
    header.textContent = listTitle;
    
    const list = document.createElement('ul');
    listContent.forEach(listItem => {
        const li = document.createElement('li');
        if (generateLinks) {
            const a = document.createElement('a');
            a.className = 'link';
            a.textContent = listItem;
            a.href = `./${currentPageName}/${linkPrefix}/${listItem}`;
            li.appendChild(a);
        } else {
            li.textContent = listItem;
        }
        list.appendChild(li);
    });
    return [header, list];
}

function sortableListGenerator(listTitle, listContent, textSearch, target) {
    const header = document.createElement('span');
    header.className = 'sec-head';
    header.textContent = listTitle;
    
    const list = document.createElement('ul');

    listContent.forEach(listItem => {
        const li = document.createElement('li');
        const name = textSearch[listItem];
        li.textContent = name;
        list.appendChild(li);
        currentBlob.classList.add(listItem);
        currentJump.classList.add(listItem);

        if (!alreadyAddedSortKeys.includes(name)) {
            alreadyAddedSortKeys.push(name);
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.value = listItem;
            cb.id = listItem;
            cb.checked = true;
            cb.onchange = () => { sort() }

            const label = document.createElement('label');
            label.textContent = name;
            label.for = listItem;
            label.className = 'link';
            
            label.prepend(cb);
            target.appendChild(label);
        }
    });
    return [header, list];
}

async function fetchHelper(path) {
    const response = await fetch(path);
    return await response.json();
}

function sort() {
    const checkboxes = document.querySelectorAll('div.sort-list > label > input[type=checkbox]');
    document.querySelectorAll('div.blob').forEach(e => {e.style.display = 'flex'});
    document.querySelectorAll('a.jump').forEach(e => {e.style.display = 'block'});
    let hideClasses = [];
    checkboxes.forEach(cb => {
        if (!cb.checked) {
            hideClasses.push(cb.value);
        }
    });
    hideClasses.forEach(c => {
            document.querySelectorAll(`div.blob.${CSS.escape(c)}, a.jump.${CSS.escape(c)}`).forEach(e => {e.style.display = 'none'});
    });
}

function scrollToElem(id) {
    const elem = document.getElementById(id);
    elem.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                elem.classList.add('animated');
                setTimeout(() => {
                    elem.classList.remove('animated');
                }, 600);
                observer.disconnect();
            }
        });
    }, { threshold: 1.0 });

    observer.observe(elem);
}

function getIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const requestedId = urlParams.get('id');
    if (requestedId != null) {
        if (document.getElementById(requestedId)) {
            console.log("Scrolling to " + requestedId);
            scrollToElem(requestedId);
        } else {
            alert("Nothing for " + requestedId + "!");
        }
    }
}

function clean(str, nuke) {
    if (nuke)
        return str.replace(/[^0-9a-zA-Z:,]+/g, "");
    else
        return str.replace(/\W/g, '')
}

function navDropdownHeightCalculator() {
    const dropdowns = document.querySelectorAll('div.nav-dropdown');
    const height = parseInt(getComputedStyle(document.body).getPropertyValue('--navSecondaryHeight'));
    dropdowns.forEach(dd => {
        const children = dd.querySelectorAll('a').length;

        dd.style.setProperty('--dynamicHeight', `${height * children}px`);
    });
}

function jumplistDynamicHeightCalculator() {
    const modules = document.querySelectorAll('.sort-module:not(#jump-module)');

    let totalHeightOfOtherModules = 10;
    modules.forEach(m => {
        totalHeightOfOtherModules += m.getBoundingClientRect().height;
        totalHeightOfOtherModules += parseInt(getComputedStyle(m).marginTop);
        totalHeightOfOtherModules += parseInt(getComputedStyle(m).marginBottom);
        totalHeightOfOtherModules += parseInt(getComputedStyle(m).borderWidth)*2;
    });

    const jumplist = document.getElementById('jump-module');

    jumplist.style.setProperty('--jumpListDynamicHeight', `${window.innerHeight - totalHeightOfOtherModules}px`);
}

function showImageOverlay(imageID) {
    overlayActive = true;
    const imageOverlay = document.getElementById('image-overlay');
    const targetImage = document.getElementById(imageID);
    targetImage.classList.add('active');

    const imageSource = unthumbifySource(targetImage.src);
    const imageOverlayImg = document.getElementById('image-overlay-img');
    const imageOverlayVid = document.getElementById('image-overlay-vid');

    if (imageSource.endsWith('.mp4')) {
        imageOverlayVid.src = imageSource;
        imageOverlayVid.style.opacity = 1;
        imageOverlayImg.style.opacity = 0;
    } else {
        imageOverlayImg.src = imageSource;
        imageOverlayImg.style.opacity = 1;
        imageOverlayVid.style.opacity = 0;
    }

    document.body.style.overflowY = 'hidden';

    const targetGallery = document.getElementById(targetImage.getAttribute('gallery'));
    const overlayGallery = document.getElementById('image-overlay-gallery');
    overlayGallery.innerHTML = targetGallery.innerHTML;

    overlayGallery.childNodes.forEach(img => {
        img.onclick = () => {
            showSlides(parseInt(img.getAttribute('num')));
        };
    });

    targetImage.classList.remove('active');
    imageOverlay.classList.add('visible');

    const titleElem = imageOverlay.querySelector('.image-overlay-title');
    titleElem.textContent = targetGallery.previousElementSibling.textContent.replace('> ', '');
    slideIndex = parseInt(imageID.slice(imageID.lastIndexOf('-') + 1)) + 1;
}

function unthumbifySource(src) {
    return src.replace("THUMBS/", "").replace("_thumb", "").replace("_videothumb.webp", ".mp4");
}

function hideImageOverlay() {
    overlayActive = false;
    document.getElementById('image-overlay').classList.remove('visible');
    document.body.style.overflowY = 'scroll';
    slideIndex = 1;
}

function plusSlides(n) {
    showSlides(slideIndex += n);
}

function showSlides(n) {
    let i;
    const imageOverlayImg = document.getElementById('image-overlay-img');
    const imageOverlayVid = document.getElementById('image-overlay-vid');
    const gallery = document.getElementById('image-overlay-gallery');
    const thumbs = gallery.querySelectorAll('img');
    slideIndex = n;
    if (n > thumbs.length) { slideIndex = 1 }
    if (n < 1) { slideIndex = thumbs.length }
    for (i = 0; i < thumbs.length; i++) {
        thumbs[i].classList.remove('active');
    }

    thumbs[slideIndex - 1].classList.add('active');
    const mediaSource = unthumbifySource(thumbs[slideIndex - 1].src);
    let target;
    if (mediaSource.endsWith('.mp4')) {
        target = imageOverlayVid;
        imageOverlayImg.style.opacity = 0;
        imageOverlayVid.style.opacity = 1;
    } else {
        target = imageOverlayImg;
        imageOverlayImg.style.opacity = 1;
        imageOverlayVid.style.opacity = 0;
    }
    if (currentFade) 
        currentFade.cancel();
    currentFade = fadeOutAndChange(target, mediaSource);
    thumbs[slideIndex - 1].scrollIntoView({ behavior: 'smooth' });
}

let currentFade = null;

function fadeOutAndChange(elem, newSrc) {
  let cancelFade = false;

  const fadeOut = () => {
    return new Promise(resolve => {
    //   img.style.transition = 'opacity 0.5s ease';
    elem.style.opacity = 0;

      const onEnd = () => {
        elem.removeEventListener('transitionend', onEnd);
        resolve();
      };

      elem.addEventListener('transitionend', onEnd);

      // fallback in case transitionend fails
      setTimeout(resolve, 600);
    });
  };

  const loadImage = () => {
    return new Promise(resolve => {
        if (elem.tagName === 'IMG') {
            elem.onload = () => resolve();
        } else if (elem.tagName === 'VIDEO') {
            elem.onloadstart = () => resolve();
        }
        elem.src = newSrc;
    });
  };

  const fadeIn = () => {
    requestAnimationFrame(() => {
        elem.style.opacity = 1;
    });
  };

  (async () => {
    await fadeOut();
    if (cancelFade) return;

    await loadImage();
    if (cancelFade) return;

    fadeIn();
  })();

  return {
    cancel: () => cancelFade = true
  };
}

function setTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.replace('theme-light', 'theme-dark');
    } else {
        document.body.classList.replace('theme-dark', 'theme-light');
    }
}

window.onscroll = () => {
    if (window.pageYOffset > 100) {
        document.body.classList.add('scrolled');
    } else {
        document.body.classList.remove('scrolled');
    }
}

window.onkeydown = e => {
    if (overlayActive) {
        if (e.key === 'Escape') {
            hideImageOverlay();
        } else if (e.key === "ArrowRight") {
            plusSlides(1);
        } else if (e.key === "ArrowLeft") {
            plusSlides(-1);
        }
    }
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {setTheme();});

navDropdownHeightCalculator();
setTheme();