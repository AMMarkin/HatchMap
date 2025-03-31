const red = "#e63d2e"
const orange = "#ffa15e"

const hatchColors = new Map([
    ["менажницы", red],
    ["тараканчики", orange]
])

let openedMarkers = null;

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
    ymaps3.import.registerCdn('https://cdn.jsdelivr.net/npm/{package}', [
        '@yandex/ymaps3-default-ui-theme@latest', 
        '@yandex/ymaps3-clusterer@latest'
    ]);

    // import package from CDN
    const {
        YMapZoomControl, 
        YMapDefaultMarker
    } = await ymaps3.import('@yandex/ymaps3-default-ui-theme');
    
    const {
        YMapClusterer, 
        clusterByGrid
    } = await ymaps3.import('@yandex/ymaps3-clusterer');
          
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

    const createClusterMarker = (coordinates, features) =>
        new ymaps3.YMapMarker(
            {
            coordinates,
            onClick() {
                const bounds = getBounds(features.map((feature) => feature.geometry.coordinates));
                map.update({location: {bounds, easing: 'ease-in-out', duration: 1500}});
            }
            },
            circle(features.length, hatchColors.get(features[0].properties.type)).cloneNode(true)
        );

    function circle(count, color) {
        const circle = document.createElement('div');
        circle.classList.add('circle');
        circle.innerHTML = `
                <div class="circle-content" style="color: ${color}">
                    <span class="circle-text">${count}</span>
                </div>
            `;
        return circle;
    }

    map.addChild(createClusterForHatches(hatchInfos.filter(x => x.type === 'менажницы')));
    map.addChild(createClusterForHatches(hatchInfos.filter(x => x.type !== 'менажницы')));
    
    function createClusterForHatches(hatches){
        const points = hatches.map((hatchInfo, i) => ({
            type: 'Feature',
            id: i,
            geometry: {coordinates: hatchInfo.location},
            properties: {name: 'Количество люков', type: hatchInfo.type, filename: hatchInfo.filename}
          }));

         return new YMapClusterer({
            method: clusterByGrid({gridSize: 72}),
            features: points,
            marker: createHatchMarker,
            cluster: createClusterMarker
        });
    }

    function createHatchMarker({geometry, properties}){
        const location = geometry.coordinates
        const {type, filename} = properties

        let marker = null;

        function createMarkerPopup(){
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
        
        const popupProps = {
            content: createMarkerPopup,
            position: 'right'
        }
        marker = new YMapDefaultMarker({
            coordinates: location,
            color: type === 'менажницы' ? 'red' : 'orange',
            iconName: 'landmark',
            size: 'normal',
            onClick(){
                if(marker._props.popup.show){
                    openedMarkers = null;
                    marker.update({popup: {...popupProps, show: false}})
                }else{
                    if(openedMarkers)
                        openedMarkers.update({popup: {...openedMarkers._props.popup, show: false}})
                    
                    openedMarkers = marker
                    marker.update({popup: {...popupProps, show: true}})
                }
            },
            popup: popupProps
        })

        return marker;
    }

    function getBounds(coordinates){
        let minLat = Infinity,
          minLng = Infinity;
        let maxLat = -Infinity,
          maxLng = -Infinity;
      
        for (const coords of coordinates) {
          const lat = coords[1];
          const lng = coords[0];
      
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
        }
      
        return [
          [minLng - 0.00002, minLat - 0.0001],
          [maxLng + 0.00002, maxLat + 0.0001]
        ];
      }
}

