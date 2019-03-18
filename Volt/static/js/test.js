const React = require('react');
const ReactDOM = require('react-dom');

import { Map, TileLayer, ZoomControl, Marker, Popup, GeoJSON} from 'react-leaflet'

class SimpleExample extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            lng: 26.945830,
            lat:  65.192058,
            zoom: 3,
        }
    }

   render() {
    const position = [this.state.lat, this.state.lng];
    return (
      <Map center={position} zoom={this.state.zoom} style={{height: 600, width: 600}}>
        {/*<TileLayer*/}
          {/*attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'*/}
          {/*url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"*/}
        {/*/>*/}
        <GeoJSON data={require('../img/geo/nordics50m.json')}/>
        <Marker position={position}>
          <Popup>
            A pretty CSS3 popup. <br /> Easily customizable.
          </Popup>
        </Marker>
      </Map>
    )
}
}

ReactDOM.render(  <SimpleExample />,
  document.getElementById('react')
);