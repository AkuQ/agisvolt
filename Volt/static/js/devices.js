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

import * as API from "./api_handler";

const wrapperStyles = {
    width: "38%",
    margin: "0 auto",
    padding: 0,
    border: "1px solid black",
    float: "left",
};

const countries = [
    "FIN", "SWE", "EST", "RUS", "NOR", "LTU", "LVA", "ALD",
];


Array.prototype.remove = function(value) {
    this.splice(this.indexOf(value), 1);
    return this;
};


class MarkerMeta  {
    constructor(parent, i, width, marker) {
        this.index = parseInt(i);
        this.parent = parent;
        this.r = width / 2;
        this.name = marker.name;
        this.markerOffset = marker.markerOffset;
        this.coordinates = marker.coordinates;
        this.coordinates_orig = marker.coordinates;
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

        // noinspection JSUnusedGlobalSymbols
        this.onMap = {
            onClick: ev => this.setParent(ev, {selection: 'map', selected: [this.index]},),
            onMouseOver: ev => this.setParent(ev, {hovered: [this.index]},),
            onMouseOut: ev => this.setParent(ev, {hovered: this.parent.state.hovered.remove(this.index)},),
        };

        // noinspection JSUnusedGlobalSymbols
        this.onList = {
            onClick: ev => this.setParent(ev, {selection: 'list', selected: [this.index]},),
            onMouseOver: ev => this.setParent(ev, {hovered: [this.index]},),
            onMouseOut: ev => this.setParent(ev, {hovered: this.parent.state.hovered.remove(this.index)},),
        };
    }

    setParent(ev, state, cb=undefined) {
        this.parent.setState(state, cb);
        ev.stopPropagation();
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
            <circle cx={0} cy={0} r={hovering && this.r * 1.1 || this.r * 0.8} style={this.styles.circle}/>
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
            markers: [],
            center: [26.945830, 65.192058],
            size: [1000, 1000],
            scale: 3500,
        };

        this.geo_style = {default: {fill: "#ECEFF1", stroke: "#607D8B", strokeWidth: 0.75, outline: "none",}};
        this.geo_style.hover = this.geo_style.default;
        this.geo_style.pressed = this.geo_style.default;
        this.map = React.createRef();
        this.can_zoom = true;
        this.min_marker_dim = 30  // Max. markers on shorter edged
    }

    componentDidMount() {
        setInterval(this.fetchDevices.bind(this), 10000);
        this.fetchDevices();
    }

    fetchDevices() {
        API.fetchDevices()
            .then(result => result.devices.map(d => {
                d.coordinates = [d.lon, d.lat];
                let m = d.avg_measurements.Voltage || null;
                d.state =
                     m === null && "#888"
                    || m < 11.5 && "#F00"
                    || m < 11.9 && "#F80"
                    || m < 15.0 && "#0A0"
                    || "#000";
                return d;
            }))
            .then(devices => {
                this.state.markers = devices.map((m, i) => new MarkerMeta(this, i, this.min_marker_dim, m));
                this.positionMarkers(this.state.zoom, this.state.center);
            })
    }

    zoom(ev) {
        ev.preventDefault();
        if(this.can_zoom) {
            let z;
            z = this.state.zoom - ev.deltaY / 50.0 * this.state.zoom;
            z = Math.max( 0.5, Math.min(z, 15));
            this.positionMarkers(z, this.state.center);
        }
    }

    positionMarkers(zoom, center){
        let projection = this.map.current.projection().scale(this.state.scale * zoom).center(center);
        let inversion = projection.invert;
        // let bounds = [...inversion([0,0]), ...inversion(this.state.size)]; // todo: display out-of-bounds markers on the edge of map?
        let div = this.min_marker_dim;
        let step = Math.min(this.state.size[0] / div, this.state.size[1] / div);

        let marker_pos = {};
        this.state.markers.forEach((m, i) => {
            let xy = projection(m.coordinates_orig);
            xy[0] = Math.round(xy[0] / step);
            xy[1] = Math.round(xy[1] / step);
            if(marker_pos[xy]) { // Óutward spiral search algorithm for empty spot
                xy[0]++;
                let edge_dist = 1;
                let turns = 1;
                let dir = [0, 1];
                let steps_in_dir = 0;
                while (marker_pos[xy]) {
                    xy[0] += dir[0];
                    xy[1] += dir[1];
                    steps_in_dir++;
                    if (steps_in_dir === edge_dist) {
                        turns++;
                        steps_in_dir = 0;
                        if (turns === 2) {
                            turns = 0;
                            edge_dist++;
                        }
                        let temp = dir[0];
                        dir[0] = -dir[1];
                        dir[1] = temp;
                    }
                }
            }
            marker_pos[xy] = true;
            xy[0] *= step;
            xy[1] *= step;
            m.coordinates = inversion(xy);
        });

        this.setState({zoom: zoom, center: center});
    }

    render() {
        return (
        <div style={{display: "flex", height:'100%'}} onClick={ev => this.setState({selected: []}, )}>
            <div style={wrapperStyles} onWheel={ev => this.zoom(ev)} >
                <ComposableMap
                    ref={this.map}
                    projectionConfig={{ scale: this.state.scale }} //todo: set better projection
                    width={this.state.size[0]} height={this.state.size[1]}
                    style={{width: "100%", height: "100%"}}>
                    <ZoomableGroup
                        center={this.state.center}
                        zoom={this.state.zoom}
                        // disablePanning={true}
                        onClick={ev => this.move(ev)}
                        onMoveStart={() => this.can_zoom=false}
                        onMoveEnd={ev => {
                            this.positionMarkers(this.state.zoom, ev);
                            this.setState({center: ev}, () => this.can_zoom=true)}
                        }
                    >
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
                        {this.state.markers.map((m, i) => m.renderAsMapItem(i))}
                    </Markers>
                  </ZoomableGroup>
                </ComposableMap>
            </div>
            <div style={{flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
                <div style={{height: '50%'}}>
                    <ul style={{listStyle: "none", height: 'calc(100% - 10px)', columnCount: 4, columnFill: 'auto', overflowX: 'auto', margin: 0, padding: '10px 0 0 10px'}}>
                        {this.state.markers.map((m, i) => m.renderAsListItem(i))}
                    </ul>
                </div>
                <div style={{height: '50%', borderRadius: 10, backgroundColor: '#ECEFF1', margin: '10px 15px 0 15px'}}>
                    <div style={{padding: '5px'}}>

                    </div>
                </div>
            </div>
        </div>
        );
    }
}



let target;
(target = document.getElementById('devices')) && ReactDOM.render(<Devices/> , target);
