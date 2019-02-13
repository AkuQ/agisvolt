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
    "FIN", "SWE", "EST", "RUS", "NOR", "LTU", "LVA", "ALD",
];

const markers = [
    { markerOffset: 20, name: 'Helsinki', coordinates: [ 24.945831, 60.192059], state: "green"},
    { markerOffset: 20, name: 'Test_1', coordinates: [ 24.945830, 60.192058], state: "green"},
    { markerOffset: 20, name: 'Test_2', coordinates: [ 24.945830, 61.192058], state: "orange"},
    { markerOffset: 20, name: 'Test_3', coordinates: [ 23.945830, 60.192058], state: "green"},
    { markerOffset: 20, name: 'Test_4', coordinates: [ 22.945830, 64.192058], state: "orange"},
    { markerOffset: 20, name: 'Test_5', coordinates: [ 26.945830, 65.192058], state: "red"},
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

Array.prototype.remove = function(value) {
    this.splice(this.indexOf(value), 1);
    return this;
};

class MarkerMeta  {
    constructor(parent, i, marker) {
        this.index = parseInt(i);
        this.parent = parent;
        this.name = marker.name;
        this.markerOffset = marker.markerOffset;
        this.coordinates = marker.coordinates;
        this.color = marker.state;
        this.styles = {
            rect: {fill: "transparent"},
            circle: {stroke: this.color, fill: this.color, strokeWidth: 1, opacity: 1,},
            svg: {width: 20, height: 20, verticalAlign: "middle",}, //todo: container svg dim = x2 max cirle radius
            Marker: {default: { fill: "#FF5722", outline: "none" }},
            text: {
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
            },
            span: {verticalAlign: "middle",}
        };
        this.styles.Marker.hover = this.styles.Marker.default;
        this.styles.Marker.pressed = this.styles.Marker.default;

        this.onMap = {
            // onClick: ev => this.selectMarker(i, e),
            onClick: ev => this.parent.setState({selection: 'map', selected: [this.index]},),
            onMouseOver: ev => this.parent.setState({hovered: [this.index]},),
            onMouseOut: ev => this.parent.setState({hovered: this.parent.state.hovered.remove(this.index)},),
        };

        this.onList = {
            onClick: ev => this.parent.setState({selection: 'list', selected: [this.index]},),
            onMouseOver: ev => this.parent.setState({hovered: [this.index]},),
            onMouseOut: ev => this.parent.setState({hovered: this.parent.state.hovered.remove(this.index)},),
        };
    }

    isSelected() {
        return this.parent.state.selected.includes(this.index);
    }

    spanStyle() {
        let style = {verticalAlign: "middle",};
        this.isSelected() && (style["textDecorationLine"] = ["underline"]);
        return style;
    }

    renderAsMapItem(key) {
        let hovering = this.parent.state.hovered.includes(this.index);

        return <Marker key={key} marker={this} style={this.styles.Marker}>
            <circle cx={0} cy={0} r={hovering && 12 || 8} style={this.styles.circle}/>
            <rect width={16} height={16} x={-8} y={-8} style={this.styles.rect} {...this.onMap} />
        </Marker>;
    }

    renderAsListItem(key) {
        let hovering = this.parent.state.hovered.includes(this.index);

        return <li key={key} {...this.onList}>
            <svg style={this.styles.svg} >
                <circle cx={10} cy={10} r={hovering && 7.5 || 5} style={this.styles.circle}/>
            </svg>
            <span style={this.spanStyle()}>{ this.name }</span>
        </li>;

    }
}

class Devices extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            zoom: 1.0,
            selection: null,
            selected: [],
            hovered: [],
        };

        this.geo_style = {default: {fill: "#ECEFF1", stroke: "#607D8B", strokeWidth: 0.75, outline: "none",}};
        this.geo_style.hover = this.geo_style.default;
        this.geo_style.pressed = this.geo_style.default;
        this.markers = markers.map((m, i) => new MarkerMeta(this, i, m));
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
                <ZoomableGroup center={[ 26.945830, 65.192058 ]} zoom={this.state.zoom}>
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
                    {this.markers.map((m, i) => m.renderAsMapItem(i))}
                </Markers>
              </ZoomableGroup>
            </ComposableMap>
            </div>
            <div style={{flexGrow: 1,}} >
                <ul style={{listStyle: "none", padding: 0,}}>
                    {this.markers.map((m, i) => m.renderAsListItem(i))}
                </ul>
            </div>
        </div>;
    }
}

let target;
(target = document.getElementById('devices')) && ReactDOM.render(<Devices/> , target);
