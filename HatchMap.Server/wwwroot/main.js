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
                center: [37.628144, 55.753842],

                // Уровень масштабирования
                zoom: 12.5
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

    var menCount = hatchInfos.filter(x => x.type === 'менажницы').length
    document.getElementById('menagerieCount').textContent = menCount
    document.getElementById('cockroachCount').textContent = hatchInfos.length - menCount

    const hatchMarkers = hatchInfos.map(hatch => createHatchMarker(hatch))
    hatchMarkers.forEach(marker => map.addChild(marker))

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
            
            const mapLink = document.createElement('a')
            mapLink.classList.add('btn')
            mapLink.target = '_blank'
            const urlEncodedComma = '%2C'
            mapLink.href = `https://yandex.ru/maps/?text=${location[1]}${urlEncodedComma}${location[0]}&z=18`
            mapLink.textContent = 'Маршрутъ'
            markerPopup.appendChild(mapLink)

            const closeButton = document.createElement('button');
            closeButton.textContent = "Закрыть"
            closeButton.classList.add('btn');
            closeButton.onclick = () => marker.update({ popup: { show: false }});
            markerPopup.appendChild(closeButton)
            
            return markerPopup;
        }
        
        marker = new YMapDefaultMarker({
            coordinates: location,
            color: type === 'менажницы' ? 'red' : 'orange',
            iconName: 'landmark',
            size: 'normal',
            onClick(){
                hatchMarkers.forEach(m => {
                    if(m === marker)
                        marker.update({popup: {show: !marker._props.popup.show}})
                    else
                        m.update({popup: {show: false}})
                })
            },
            popup: {
                content: createMarkerPopup,
                position: 'right'
            }
        })
        return marker;
    }
}

