const React = require('react');
const ReactDOM = require('react-dom');

import {
  ComposableMap,
  ZoomableGroup,
  Geographies,
  Geography,
  Markers,
  Marker,
} from "react-simple-maps"


const wrapperStyles = {
    width: "38%",
    // maxWidth: 980,
    margin: "0 auto",
    border: "1px solid black",
    float: "left",
};

const countries = [
    "FIN", "SWE", "EST", "RUS", "NOR", "LTU", "LVA",
];

const markers = [
    { markerOffset: 20, name: 'Helsinki', coordinates: [ 24.945831, 60.192059]},
    { markerOffset: 20, name: 'Test_1', coordinates: [ 24.945830, 60.192058]},
    { markerOffset: 20, name: 'Test_2', coordinates: [ 24.945830, 61.192058]},
    { markerOffset: 20, name: 'Test_3', coordinates: [ 23.945830, 60.192058]},
    { markerOffset: 20, name: 'Test_4', coordinates: [ 22.945830, 64.192058]},
    { markerOffset: 20, name: 'Test_5', coordinates: [ 26.945830, 65.192058]},
    // { markerOffset: -25, name: "Buenos Aires", coordinates: [-58.3816, -34.6037] },
    // { markerOffset: -25, name: "La Paz", coordinates: [-68.1193, -16.4897] },
    // { markerOffset: 35, name: "Brasilia", coordinates: [-47.8825, -15.7942] },
    // { markerOffset: 35, name: "Santiago", coordinates: [-70.6693, -33.4489] },
    // { markerOffset: 35, name: "Bogota", coordinates: [-74.0721, 4.7110] },
    // { markerOffset: 35, name: "Quito", coordinates: [-78.4678, -0.1807] },
    // { markerOffset: -25, name: "Georgetown", coordinates: [-58.1551, 6.8013] },
    // { markerOffset: -25, name: "Asuncion", coordinates: [-57.5759, -25.2637] },
    // { markerOffset: 35, name: "Paramaribo", coordinates: [-55.2038, 5.8520] },
    // { markerOffset: 35, name: "Montevideo", coordinates: [-56.1645, -34.9011] },
    // { markerOffset: -25, name: "Caracas", coordinates: [-66.9036, 10.4806] },
];


class Devices extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            zoom: 1.0,
        };

        this.geo_style = {default: {fill: "#ECEFF1", stroke: "#607D8B", strokeWidth: 0.75, outline: "none",}};
        this.geo_style.hover = this.geo_style.default;
        this.geo_style.pressed = this.geo_style.default;

        this.marker_style = {default: { fill: "#FF5722", outline: "none" }};
        this.marker_style.hover = this.marker_style.default;
        this.marker_style.pressed = this.marker_style.default;

        this.circle_style = {stroke: "#FF5722", fill: "#FF5722", strokeWidth: 1, opacity: 0.9};

        this.text_style = {
            fontFamily: "Roboto, sans-serif",
            fill: "#607D8B",
            //
            userSelect: "none",
            MozUserSelect: "none",
            KhtmlUserSelect: "none",
            WebkitUserSelect: "none",
            msUserSelect: "none",
            WebkitTouchCallout: "none",
            //
        };
        this.markers = markers;
    }

    updateMarkers() {

    }

    zoom(ev) {
        ev.preventDefault();
        let z = this.state.zoom - ev.deltaY / 50.0 * this.state.zoom;
        this.setState({zoom: z} /*, () => console.log(this.state.zoom) */ )
    }


    render() {
        return <div style={{display: "flex"}}>
            <div style={wrapperStyles} onWheel={ev => this.zoom(ev)} >
            <ComposableMap
                projectionConfig={{ scale: 3500 }} //todo: set better projection
                width={1000} height={1000}
                style={{width: "100%", height: "auto"}}>
                <ZoomableGroup
                    center={[ 26.945830, 65.192058]}
                     zoom={this.state.zoom}>
                <Geographies geography="/static/world.json">
                    {(geographies, projection) =>
                        geographies.map((geography, i) =>
                            countries.indexOf(geography.id) !== -1 && (
                            <Geography key={i} geography={geography} projection={projection} style={this.geo_style}/>
                        )
                    )
                }
                </Geographies>
                <Markers>
                  {markers.map((marker, i) => (
                    <Marker key={i} marker={marker} style={this.marker_style}>
                      <circle cx={0} cy={0} r={5} style={this.circle_style}/>
                      <text textAnchor="middle" y={marker.markerOffset} style={this.text_style}> {marker.name} </text>
                    </Marker>
                  ))}
                </Markers>
              </ZoomableGroup>
            </ComposableMap>
            </div>
            <div style={{flexGrow: 1,}}>
                <ul style={{listStyle: "none", padding: 0,}}>
                <li>
                <svg style={{width: 20, height: 20, verticalAlign: "middle",}}>
                    <circle cx={10} cy={10} r={5} style={this.circle_style}/></svg>
                    {/*todo: automate circle box dim * 2 circle radius*/}
                <span style={{verticalAlign: "middle",}}>Item</span></li>
                </ul>

            </div></div>;
    }
}

let target;
(target = document.getElementById('devices')) && ReactDOM.render(<Devices/> , target);
