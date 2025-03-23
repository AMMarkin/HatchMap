initMap();

async function initMap() {
    // Промис `ymaps3.ready` будет зарезолвлен, когда загрузятся все компоненты основного модуля API
    await ymaps3.ready;

    const {
        YMap, 
        YMapDefaultSchemeLayer, 
        YMapDefaultFeaturesLayer,
        YMapControls
    } = ymaps3;

    // register in `ymaps3.import` which CDN to take the package from
    ymaps3.import.registerCdn('https://cdn.jsdelivr.net/npm/{package}', '@yandex/ymaps3-default-ui-theme@latest');

    // import package from CDN
    const {
        YMapZoomControl, 
        YMapDefaultMarker
    } = await ymaps3.import('@yandex/ymaps3-default-ui-theme');

    // Иницилиазируем карту
    const map = new YMap(
        // Передаём ссылку на HTMLElement контейнера
        document.getElementById('map'),

        // Передаём параметры инициализации карты
        {
            location: {
                // Координаты центра карты
                center: [37.588144, 55.733842],

                // Уровень масштабирования
                zoom: 15
            }
        }
    );

    // Добавляем слой для отображения схематической карты
    map.addChild(new YMapDefaultSchemeLayer());
    map.addChild(new YMapDefaultFeaturesLayer());
    map.addChild(new YMapControls({position: 'right'}).addChild(new YMapZoomControl({})));

    // Заполнение маркерами
    const hatchInfos = await fetch('/hatches')
        .then(async response => await response.json())
        .then(hatchArray => hatchArray.map(x => {
            return {
                location: [x.longitude, x.latitude],
                filename: x.filename,
                type: x.type
            }}));

    hatchInfos.forEach(hatch => map.addChild(createHatchMarker(hatch)))

    function createHatchMarker({location, type, filename}){
        let marker = null;

        const createMarkerPopup = () => {
            const markerPopup = document.createElement('div')
            markerPopup.classList.add('popup')
            
            const imageSrc = `./Photos/${type}/${filename}`;
            const imageLink = document.createElement('a')
            imageLink.target = '_blank'
            imageLink.href = imageSrc;
            imageLink.title = 'Открыть'

            const popupImage = document.createElement('img')
            popupImage.src = imageSrc
            popupImage.classList.add('popup_image')

            imageLink.appendChild(popupImage)
            markerPopup.appendChild(imageLink)

            const closeButton = document.createElement('button');
            closeButton.textContent = "Закрыть"
            closeButton.classList.add('popup_closebutton');
            closeButton.onclick = () => marker.update({ popup: { show: false }});
            markerPopup.appendChild(closeButton)
            
            return markerPopup;
        }
        
        marker = new YMapDefaultMarker({
            coordinates: location,
            color: type === 'менажницы' ? 'blue' : 'orange',
            onClick(){
                marker.update({popup: {show: !marker._props.popup.show}})
            },
            popup: {
                content: createMarkerPopup,
                position: 'right'
            }
        })
        return marker;
    }
}

