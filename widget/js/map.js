class MapView {
  constructor(user, strings, settings, directoryUI, widget) {
    console.log('userrrrrrrrr',user);
    this.user = user;
    this.directory = new Directory(user, strings, settings);
    this.strings = strings || new buildfire.services.Strings('en-us', stringsConfig);
    this.settings = settings;
    this.mapContainer = document.getElementById('googleMap');
    this.directoryUI = directoryUI;
    this.widget = widget;
    this.mapSettings = {
      markerClusterer: null,
      zoomLevel: { city: 14, country: 3 },
      images: {
        currentLocation: 'google_marker_blue_icon.png',
        place: 'google_marker_red_icon.png',
        selected: 'google_marker_green_icon.png'
      }
    };

    this.usa = { lat: 37.09024, lng: -95.712891 };
    this.defaultLocation = this.usa;
    // this.userLocation = this.user && this.user.location ? this.user.location : this.defaultLocation;
    this.userLocation = this.user && this.user.userProfile.address.geoLocation ? {lat:this.user.userProfile.address.geoLocation.lat,lng:this.user.userProfile.address.geoLocation.lng} : this.defaultLocation;
    this.originalHeight;
    this.mapViewFetchTimeout = null;
    this.locations = {};
    this.fetchedUserIds = [];
    this.fetchedCities = [];

    this.cloudImg = {
      domain: "https://czi3m2qn.cloudimg.io",
      operations: {
        cdn: "/cdn/n/n",
        width: "/s/width",
        crop: "/s/crop",
      }
    };

    this.state = {
      isBusy: false,
      citySkip: 0,
      userSkip: 0,
      pageSize: 50,
      markers: [],
      cities: [],
      renderedMarkerIds: [],
    };

    this.initMap();
  };

  mapViewFetchInterval() {
    if (this.mapViewFetchTimeout) clearTimeout(this.mapViewFetchTimeout);
    const proceedFetch = () => {
      if (!this.isBusy) {
        this.isBusy = true;
        this.state.page++;
        window.app.loadPage(
          window.app.state.page,
          window.app.state.pageSize,
          (err, places) => {
            this.mapViewFetchTimeout = this.setTimeout(proceedFetch, 1000);
            if (err) return;
            this.state.paginationRequestBusy = false;
            window.mapView.updateMap(places);
          }
        );
      }
    };
    proceedFetch();
  };

  initMap() {
    //Create the map first (Don't wait for location)
    this.createMap();
    // this.map.fitBounds(this.state.bounds);

    window.setTimeout(() => {
      this.map.addListener('dragend', () => {
        this.updateMarkers();
      });
      this.map.addListener('zoom_changed', () => {
        this.updateMarkers();
      });
    }, 1000); //Wait for animation to finish.

  };
  updateUserMarker() {
    let user = this.user;
    if (user && user.locationKey) {
      if (this.fetchedUserIds.indexOf(user.id) === -1) {
        if (Object.keys(this.locations).indexOf(user.locationKey) === -1) {
          this.locations[user.locationKey] = [user];
        }
        else {
          this.locations[user.locationKey].push(user);
        }
        this.fetchedUserIds.push(user.id);
        this.addMarkers();
      }
    }
  };
  updateMarkers() {
    this.state.cities = 0;
    this.state.citySkip = 0;
    this.state.userSkip = 0;
    var shouldAddMarkers = false;
    this.getCities((err, cities) => {
      if (err) return;
      else if (cities && cities.length) {
        let citiesTofetch = [];
        cities.forEach(city => {
          if (this.fetchedCities.indexOf(city.data.key) === -1) {
            citiesTofetch.push(city);
            // this.fetchedCities.push(city.data.key);
          }
        });
        this.getUsersFromCities(citiesTofetch, (err, users) => {
          if (users && users.length) {
            users.forEach(user => {
              if (this.fetchedUserIds.indexOf(user.id) === -1) {
                shouldAddMarkers = true;
                if (Object.keys(this.locations).indexOf(user.data.locationKey) === -1) {
                  this.locations[user.data.locationKey] = [user];
                }
                else {
                  this.locations[user.data.locationKey].push(user);
                }
                this.fetchedUserIds.push(user.id);
              }
            });
            if (this.fetchedUserIds.length > 0) {
              if (!this.markerClusterer) this.addMarkerCluster();
            }
            if (shouldAddMarkers) {
              this.addMarkers();
            }
          }
        });
      }
    });
  };
  getCities(callback) {
    var citySkip = this.state.citySkip || 0;
    var bounds = this.map.getBounds() || this.state.bounds;
    var NECorner = bounds.getNorthEast();
    var SWCorner = bounds.getSouthWest();
    this.state.busy = true;
    buildfire.appData.search({
      filter: {
        "_buildfire.geo": {
          $geoWithin: { $box: [[SWCorner.lng(), SWCorner.lat()], [NECorner.lng(), NECorner.lat()]] }
        },
      },
      skip: this.state.citySkip,
      limit: this.state.pageSize
    }, "$$locations", (err, res) => {
      this.state.busy = false;
      if (err) return callback(err);

      if (res) {
        this.state.cities = this.state.cities ? this.state.cities.concat(res) : res;
        if (res.length < this.state.pageSize) {
          return callback(null, this.state.cities);
        }
        else {
          this.state.citySkip = citySkip + this.state.pageSize;
          this.getCities(callback);
        }
      }
    });
  };
  getUsersFromCities(cities, callback) {
    if (cities && cities.length) {
      let cityUsers = [];
      let cityKeys = cities.map(city => city.data.key);
      this.state.userSkip = 0;
      if (this.mapViewFetchTimeout) clearTimeout(this.mapViewFetchTimeout);
      const proceedFetch = () => {
        if (!this.isBusy) {
          this.isBusy = true;
          this.directory.search(null, {
            "$and": [
              { "_buildfire.index.array1.string1": { $in: cityKeys } },
              { "$json.isActive": true },
            ]
          }, this.state.userSkip, this.state.pageSize, (err, res) => {
            this.isBusy = false;
            if (err) return callback(err);
            if (res) {
              console.log("res", res[0]);
              cityUsers = cityUsers ? cityUsers.concat(res) : res;
              if (res.length < this.state.pageSize) {
                return callback(null, cityUsers);
              }
              else {
                this.state.userSkip += 1;
                this.mapViewFetchTimeout = setTimeout(proceedFetch, 500);
              }
            }
          });
        }
      };
      proceedFetch();
    }
    else {
      return callback(null, []);
    }
  };
  addMarkerCluster() {
    const cloudImg = this.cloudImg;
    if (!this.map) return;

    let clusterOptions = {
      gridSize: 25,
      minimumClusterSize: 1,
      styles: [
        {
          textColor: 'white',
          url: `${cloudImg.domain}${cloudImg.operations.width}/25/https://app.buildfire.com/app/media/google_marker_blue_icon.png`,
          height: 25,
          width: 25
        }
      ],
      maxZoom: 15
    };

    // Add a marker clusterer to manage the markers.
    this.markerClusterer = new MarkerClusterer(this.map, this.state.markers, clusterOptions);
    google.maps.event.addListener(this.markerClusterer, 'clusterclick', (cluster) => {
      this.goToCityScreen(cluster);
    });
  };
  goToCityScreen(cluster) {
    if (cluster && cluster.markers_ && cluster.markers_.length) {
      let cityKey = cluster.markers_[0].markerData.key;
      let locationName = this.state.cities.filter(city => city.data.key == cityKey)[0].data.locationName;
      let users = this.locations[cluster.markers_[0].markerData.key];
      gridViewContainer.classList.toggle("show");
      this.mapContainer.classList.add("hide");
      // this.widget.activeFilters = {
      //   "_buildfire.index.array1.string1": cityKey,
      // };
      this.widget.currentScreen = Keys.screenNameKeys.MAPLIST.key;
      this.widget.initCityListView(locationName, users);
    }
  }
  createMap() {
    let mapTypeId = google.maps.MapTypeId.ROADMAP,
      zoomPosition = google.maps.ControlPosition.RIGHT_TOP;

    let zoomTo = (this.userLocation != this.defaultLocation) ? this.mapSettings.zoomLevel.city : this.mapSettings.zoomLevel.country,
      centerOn = (this.userLocation != this.defaultLocation) ? this.userLocation : this.defaultLocation;


    let options = {
      minZoom: 3,
      maxZoom: 22,
      gestureHandling: 'greedy',
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      zoom: zoomTo,
      center: centerOn,
      mapTypeId: mapTypeId,
      zoomControlOptions: {
        position: zoomPosition
      },
      styles: [
        {
          featureType: "poi.business",
          elementType: "labels",
          // stylers: [
          //   {
          //     visibility: pointsOfInterest
          //   }
          // ]
        }
      ],
      restriction: {
        latLngBounds: {
          east: 180,
          north: 85.050,
          south: -85.050,
          west: -180
        },
        strictBounds: true
      },
    };
    this.map = new google.maps.Map(this.mapContainer, options);
    google.maps.event.addListenerOnce(this.map, 'idle', () => {
      this.state.bounds = this.map.getBounds();
      this.updateMarkers();
    });

    // cenetr position to my location
    document.querySelector('.my-location-icon').onclick=()=>{
      console.log(' from center my location');
      window.setTimeout (()=>{
        this.userLocation = this.user && this.user.userProfile.address.geoLocation ? {lat:this.user.userProfile.address.geoLocation.lat,lng:this.user.userProfile.address.geoLocation.lng} : this.defaultLocation;
        this.updateMarkers();
      },1000)
      // this.state.bounds = this.map.getBounds();
    }
    // this.updateUserMarker();

    // let filterDiv = document.getElementById('mapFilter');
    // let centerDiv = document.getElementById('mapCenter');

    // new CenterControl(centerDiv);
    // new FilterControl(filterDiv);

    this.originalHeight = (this.mapContainer) ? this.mapContainer.getBoundingClientRect().height : 0;
  };
  addMarkers() {
    if (this.locations && Object.keys(this.locations) && Object.keys(this.locations).length) {
      Object.keys(this.locations).forEach(key => {
        if (this.locations[key] && this.locations[key].length) {
          this.locations[key].forEach(user => {
            this.addMarker({ address: this.locations[key][0].data.location, userId: user.id, key: user.data.locationKey });
          });
        }
      });
    }
  };
  addMarker(location) {
    // Prevent duplicated markers for single location in case if there is some of them to avoid marker clustering bug. (cluster showing up wrong number). Also, remove previous current user location if we are passing a new one.
    if (location && location.address && location.address.lat && location.address.lng && this.state.renderedMarkerIds.indexOf(location.userId) == -1) {
      let marker = new google.maps.Marker({
        position: location.address,
        markerData: location,
        map: this.map,
        icon: this.createMarker()
      });
      let lat = location.address.lat,
        lng = location.address.lng;

      this.state.markers.push(marker);
      this.state.renderedMarkerIds.push(location.userId);
      // this.state.bounds.extend({ lat, lng });
      if (this.markerClusterer) this.markerClusterer.addMarker(marker);

      marker.addListener('click', () => { this.markerClick(location, marker); });
    }
  };
  markerClick(location, marker) {
    console.log("location", location);
    console.log("marker", marker);
  };
  createMarker(imageType) {
    const cloudImg = this.cloudImg;
    const iconBaseUrl = 'https://app.buildfire.com/app/media/';

    return {
      url: `${cloudImg.domain}${cloudImg.operations.cdn}/${iconBaseUrl}google_marker_blue_icon.png`,
      // This marker is 20 pixels wide by 20 pixels high.
      scaledSize: new google.maps.Size(20, 20),
      // The origin for this image is (0, 0).
      origin: new google.maps.Point(0, 0),
      // The anchor for this image is at the center of the circle
      anchor: new google.maps.Point(10, 10)
    };
  };
  getUserLocation() {

  };
}

