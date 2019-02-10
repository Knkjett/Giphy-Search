// ---------- HELPERS, testing
class Storage {
    constructor(key) {
        this.key = key;
    }
    getStorage() {
        const data = window.localStorage.getItem(this.key);
        if (data) {
            return JSON.parse(data);
        }
        return data;
    }
    save(data) {
        window.localStorage.setItem(this.key, JSON.stringify(data))
    }
}

const getGifs = (search, cb) => {
    if (search === "" || search.trim() === "") {
        return;
    }

    const api_key = 'siIyo4w5mg0REENX76Sr57QTgkt3BWvY';
    const url = `https://api.giphy.com/v1/gifs/search?api_key=${api_key}&q=${search}`;

    let request = new XMLHttpRequest();
    request.open("GET", url);
    request.addEventListener('load', (response) => {
        const data = JSON.parse(response.currentTarget.response);

        const gifArray = [];
        data.data.forEach(currentGif => {
            const url = currentGif.images.original.url;
            gifArray.push(url);
        });

        cb(gifArray);
    })
    request.send(null);
}

const gifToHTML = (gif, index, isFav) => {
    if (isFav) {
        return `<div class='col-4' style="position: relative;">
            <span style="position: absolute; top: 5px; right: 15px;">❤️</span>
            <img src='${gif}' class="js-gif" data-index="${index}" style='width: 100%; height: auto;'>
        </div>`;
    }

    return `<div class='col-4'>
        <img src='${gif}' class="js-gif" data-index="${index}" style='width: 100%; height: auto;'>
    </div>`;

}
const favToHTML = (gif, index) =>{
    return `<div class='col-4' style="position: relative;">
            <span button-index="${index}" style="cursor: pointer; position: absolute; top: 5px; right: 15px;">💾</span>
            <img src='${gif}' class="js-gif" data-index="${index}" style='width: 100%; height: auto;'>
        </div>`;
}

const storage = new Storage('app-state');

// ---------- STATE 
let state = {
    show: 'search',
    gifs: [],
    favorites: [],
}

const copyToClipboard = str => {
    const el = document.createElement('textarea');
    el.value = str;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };

// ---------- GLOBAL HTML OBJECTS 
const searchLink = document.querySelector('.js-navlink-search');
const favoritesLink = document.querySelector('.js-navlink-favorites');
const searchContainer = document.querySelector('.js-search-container');
const favoritesContainer = document.querySelector('.js-favorites-container');
const searchBox = document.querySelector('.js-search-box');
const searchList = document.querySelector('.js-search-list');
const favoritesList = document.querySelector('.js-favs-list')

// ---------- EVENTS
searchLink.addEventListener('click', (e) => {
    state.show = 'search';
    storage.save(state);
    render(state);

});

favoritesLink.addEventListener('click', (e) => {
    state.show = 'favorites';
    storage.save(state);
    render(state);
});

searchBox.addEventListener('keydown', (e) => {
    const {
        key,
        target
    } = e;

    if (key === 'Enter') {
        getGifs(target.value, (gifs) => {
            state.gifs = gifs;
            storage.save(state);
            render(state);
        });
    }
});

searchList.addEventListener('click', e => {
    if (e.target.matches('.js-gif')) {
        // run our logic
        // first, grab the index from DOM data-index property
        let index = e.target.getAttribute('data-index');
        // this index represents the position of the IMG URL in
        // the gifs array of our state - extract this
        const gifToAdd = state.gifs[index];
        let gifToRemove = state.favorites[index];

        if (state.favorites.includes(gifToAdd)) {
            let favIndex = state.favorites.indexOf(e.target.src)
            state.favorites.splice(favIndex, 1);
            storage.save(state);
            // render
            render(state)
            return;
        }

        // if (state.favorites.includes(gifToAdd)) {
        //     console.log("Helo");
        //state.favorites.splice(index, 1);
        // }

        // take this URL that we extracted and push it into our
        // favorites 
        state.favorites = state.favorites.concat([gifToAdd]);
        // save the updated state into localstorage
        storage.save(state);
        // render
        render(state)
    }
});


favoritesList.addEventListener('click', e => {
    let index = e.target.getAttribute('data-index');
    let gifToRemove = state.favorites[index];
    let button = e.target.getAttribute('button-index');
    if (e.target.matches('.js-gif')) {
        if (state.favorites.includes(gifToRemove)) {
            state.favorites.splice(index, 1);
        }
    }
    if (e.target.matches('span')){
        let mycopy = state.favorites[button];
        copyToClipboard(mycopy);
    }
    // save the updated state into localstorage
    storage.save(state);
    // render
    render(state)
})

// ---------- RENDER
const render = state => {
    if (state.show === 'search') {
        // Show Search & Hide Favorites
        renderGifs(state)
    } else if (state.show === 'favorites') {
        // Show Favorites & Hide Search
        renderFavs(state)
    }

}

const renderGifs = state => {
    searchContainer.classList.remove('hidden');
    favoritesContainer.classList.add('hidden');

    searchLink.classList.add('active');
    favoritesLink.classList.remove('active');

    let allGifsHTML = '';
    for (let i = 0; i < state.gifs.length; i++) {
        if (state.favorites.includes(state.gifs[i])) {
            allGifsHTML += gifToHTML(state.gifs[i], i, true);
        }
        else {
            allGifsHTML += gifToHTML(state.gifs[i], i, false);
        }
    }

    searchList.innerHTML = allGifsHTML;
}

const renderFavs = state => {
    searchContainer.classList.add('hidden');
    favoritesContainer.classList.remove('hidden');

    searchLink.classList.remove('active');
    favoritesLink.classList.add('active');

    let allGifsHTML = '';
    for (let i = 0; i < state.favorites.length; i++) {
        allGifsHTML += favToHTML(state.favorites[i], i);
    }

    favoritesList.innerHTML = allGifsHTML;
}

// Checking if there is anything in the local storage
const stored_state = storage.getStorage();
if (stored_state) {
    // If there is then apply that to my state in Memory
    state = stored_state;
}

render(state);