// Declaración de variables
const inputXml = document.getElementById("file-input");
const displayArea = document.getElementById("display-area");

// Crear la base de datos
let db;
const request = indexedDB.open("albums", 1);

request.onupgradeneeded = (event) => {
  db = event.target.result;
  const objectStore = db.createObjectStore("albums", {
    keyPath: "id",
    autoIncrement: true,
  });
  objectStore.createIndex("artist", "artist", { unique: false });
  objectStore.createIndex("title", "title", { unique: false });
  objectStore.createIndex("songs", "songs", { unique: false });
  objectStore.createIndex("year", "year", { unique: false });
  objectStore.createIndex("genre", "genre", { unique: false });
};

request.onsuccess = (event) => {
  db = event.target.result;
  displayAlbums();
};

request.onerror = (event) => {
  console.error("Error abriendo IndexedDB:", event.target.errorCode);
};

/**
 * Maneja el evento de cambio de archivo y lee el archivo seleccionado
 * @param {Event} event - El evento de cambio de archivo
 */
function getFile(event) {
  const files = event.target.files;
  const file = files[0];
  const reader = new FileReader();

  reader.addEventListener("load", () => {
    xmlToJson(reader.result);
  });
  reader.readAsText(file);
}

/**
 * Convierte un archivo XML a un objeto JSON
 * @param {string} xmlFile - El contenido del archivo XML
 */
function xmlToJson(xmlFile) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlFile, "text/xml");
  let albumsObj = [];

  const albums = xmlDoc.getElementsByTagName("album");

  for (const album of albums) {
    const artist = album.getElementsByTagName("artist")[0].textContent;
    const title = album.getElementsByTagName("title")[0].textContent;
    const songs = album.getElementsByTagName("songs")[0].textContent;
    const year = album.getElementsByTagName("year")[0].textContent;
    const genre = album.getElementsByTagName("genre")[0].textContent;

    albumsObj.push({
      artist,
      title,
      songs,
      year,
      genre,
    });
  }

  storeInIndexedDB(albumsObj);
}

/**
 * Almacena los objetos de álbum en IndexedDB
 * @param {Array<Object>} albumsObj - La lista de objetos de álbum
 */
function storeInIndexedDB(albumsObj) {
  const transaction = db.transaction(["albums"], "readwrite");
  const objectStore = transaction.objectStore("albums");

  albumsObj.forEach((albumObj) => {
    const request = objectStore.add(albumObj);

    request.onsuccess = () => {
      console.log("Álbum agregado:", albumObj);
    };

    request.onerror = (event) => {
      console.error("Error al añadir el álbum:", event.target.errorCode);
    };
  });

  transaction.oncomplete = () => {
    displayAlbums();
  };
}

/**
 * Muestra los álbumes almacenados en IndexedDB.
 */
function displayAlbums() {
  const transaction = db.transaction(["albums"], "readonly");
  const objectStore = transaction.objectStore("albums");
  const request = objectStore.openCursor();
  displayArea.innerHTML = "";

  request.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const album = cursor.value;

      // Crear el contenedor principal del álbum
      const albumElement = document.createElement("div");
      albumElement.className = "album";

      // Crear el disco
      const discElement = document.createElement("div");
      discElement.className = "disc";
      const interiorElement = document.createElement("div");
      interiorElement.className = "interior";
      const holeElement = document.createElement("div");
      holeElement.className = "hole";
      interiorElement.appendChild(holeElement);
      discElement.appendChild(interiorElement);

      // Crear la caja
      const boxElement = document.createElement("div");
      boxElement.className = "box";

      // Crear el contenedor principal
      const mainContainer = document.createElement("div");
      mainContainer.className = "main-container";
      const artistElement = document.createElement("span");
      artistElement.className = "artist";
      artistElement.textContent = album.artist;
      const titleElement = document.createElement("span");
      titleElement.className = "title";
      titleElement.textContent = album.title;
      const genreElement = document.createElement("span");
      genreElement.className = "genre";
      genreElement.textContent = album.genre;
      mainContainer.appendChild(artistElement);
      mainContainer.appendChild(titleElement);
      mainContainer.appendChild(genreElement);

      // Crear el footer del álbum
      const footerContainer = document.createElement("div");
      footerContainer.className = "footer-container";
      const songsElement = document.createElement("span");
      songsElement.className = "songs";
      songsElement.textContent = `${album.songs} canciones`;
      const yearElement = document.createElement("span");
      yearElement.className = "year";
      yearElement.textContent = album.year;
      footerContainer.appendChild(songsElement);
      footerContainer.appendChild(yearElement);

      // Añadir los contenedores a la caja
      boxElement.appendChild(mainContainer);
      boxElement.appendChild(footerContainer);

      // Añadir el disco y la caja al contenedor principal del álbum
      albumElement.appendChild(discElement);
      albumElement.appendChild(boxElement);

      // Añadir el álbum al área de visualización
      displayArea.appendChild(albumElement);

      cursor.continue();
    }
  };

  request.onerror = (event) => {
    console.error("Error al recuperar los álbums:", event.target.errorCode);
  };
}

// Escuchar el evento de cambio en el input
inputXml.addEventListener("change", getFile);
