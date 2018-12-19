const React = require('react');
const ReactDOM = require('react-dom');
import {LineChart, Line, XAxis, YAxis, Legend, Tooltip} from 'recharts';

const POSTBUFFER = 200;
const PREBUFFER = 10;
const POLL_DELAY = 5;

/**
 * @return {number}
 */
function PyTime() {
    return Math.floor(Date.now() / 1000);
}

Array.prototype.last = function (field) {
    let ret = this[this.length - 1];
    return field !== undefined && ret !== undefined && ret[field] || ret;
};

Array.prototype.first = function (field) {
    let ret = this[0];
    return field !== undefined && ret !== undefined && ret[field] || ret;
};




/**
 * @return {string}
 */
function ParametrizeURL(url, params) {
    return url + '?' +  new URLSearchParams(params).toString();
}


const colors = [
    "#0e0e0e",
    "#e6194B",
    "#3cb44b",
    "#ffe119",
    "#4363d8",
    "#f58231",
    "#22b4c4",
    "#f032e6",
    "#266960",
    "#706565",
    "#7A5324",
    "#800000",
    "#000075",
    "#004919",
];

class VoltChart extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            device_id: 'TEST',
            devices: [],
            data: [],
            dataKeys: {},
            colorStack: [...Array(colors.length).keys()],
        };
        this.last_timestamp = 0;
        this.last_poll = 0;
        this.is_polling = false;
        this.buffer = [];
        // this.state.

    }

    fetchDevices() {
          let conf = {
                method: 'GET',
                headers: {'Content-Type': 'application/json'},
                // body: {},
                credentials: 'same-origin',
            };
            let url = '/api/devices';
            fetch(url, conf)
                .then(response => response.json())
                .then(json => this.setState({devices: json.devices}));
    }

    pollData(max_lookback){
        if(!this.is_polling && this.last_poll + POLL_DELAY <= PyTime()) {
            this.is_polling = true;
            this.last_poll = PyTime();

            let conf = {
                method: 'GET',
                headers: {'Content-Type': 'application/json'},
                // body: {},
                credentials: 'same-origin',
            };

            // console.log(this.state.device_id);
            let url = ParametrizeURL('/api/measurements', {
                device_id: this.state.device_id, from: Math.max(this.last_timestamp + 1, max_lookback)
            });

            fetch(url.toString(), conf)
                .then(response => response.json())
                .then(json => {
                    if (Array.isArray(json.measurements)) {
                        let measurements = {};

                        json.measurements.forEach(row => {
                            measurements[row.timestamp] = measurements[row.timestamp] || {timestamp: row.timestamp};
                            measurements[row.timestamp][row.label || ''] = row.value;

                            this.state.dataKeys[row.label] = this.state.dataKeys[row.label] || {
                                timestamp: undefined,
                                color: this.state.colorStack.pop(),  // todo: index error if out of colors
                            };
                            this.state.dataKeys[row.label].timestamp = row.timestamp;
                        });

                        measurements = Object.values(measurements).sort((a, b) => a.timestamp - b.timestamp);
                        this.buffer = this.buffer.concat(measurements);
                        this.last_timestamp = measurements.last('timestamp') || this.last_timestamp;
                    }
                    this.is_polling = false;
                })
                .catch(reason => console.warn(reason));
        }
    }

    tick() {
        let data = this.state.data;
        let cursor = PyTime() - PREBUFFER;
        let max_lookback = cursor - POSTBUFFER;
        this.pollData(max_lookback);

        let item;
        do item = data.pop() || {timestamp: cursor, is_fake: 1}; while(item.timestamp < max_lookback);
        !item.is_fake && data.push(item);

        let refresh = false;
        while(cursor >= this.buffer.first('timestamp') || 0) {
            data.push(this.buffer.shift());
            refresh = true;
        }
        refresh && !this.state.paused && this.forceUpdate();
    }


    componentDidMount() {
        let intervalID = setInterval(this.tick.bind(this), 1000);
        this.fetchDevices();
    }

    renderLine(dataKey, i){
        let keyStyles = this.state.dataKeys[dataKey];
        let color = colors[keyStyles.color];
        let orientation = i % 2 == 1;
        return [
            <YAxis yAxisId={dataKey+"_y"} type='number' dataKey={dataKey} domain={[0.0, 12.0]}
                   tick={{fill: "black"}} stroke={color}  orientation={orientation ?  'right' : 'left'}
                   label={{value: dataKey, position: 'top', fill: color, dx: orientation ? -25: 25, dy: -1}}
            />,
            <Line
                key={dataKey + "_line"}
                type='monotone' dataKey={dataKey} stroke={color} dot={true}
                yAxisId={dataKey+"_y"} xAxisId='x' animationDuration={500} isAnimationActive={false}
            />
        ];
    }

    render() {
        let now = PyTime();

        const timeTickFormat = t => {
            t = new Date(t*1000);
            let min = ("" + t.getMinutes()).padStart(2, "0");
            let sec = ("" + t.getSeconds()).padStart(2, "0");
            return ":" + min + ":" + sec;
        };

        const tooltipFormatter = (value, name, props) => {
            return value.toFixed(4);
        };

        const tooltipLabelFormatter = (t) => {
            return new Date(t*1000).toLocaleString();
        };

        return <div>
            <LineChart width={750} height={250} data={[...this.state.data]} margin={{top:20}}>

                 {Object.keys(this.state.dataKeys).map((k, i) => this.renderLine(k, i))}

                <XAxis xAxisId='x' dataKey='timestamp' type='number' tickFormatter={timeTickFormat}
                       domain={[now - PREBUFFER * 2, now - PREBUFFER]} allowDataOverflow={true}/>
                <Legend onClick={(...a) => console.log(a) } />
                <Tooltip formatter={tooltipFormatter} labelFormatter={tooltipLabelFormatter}/>
            </LineChart>

            <input type='button' value={this.state.paused && 'Play' || 'Pause'} onClick={(ev) => {
                ev.target.value = 'Play';
                this.setState({paused: !this.state.paused});
            }}/>
            <select value={this.state.device_id} 
                onChange={ev =>
                    this.setState({
                        device_id: ev.target.value,
                        data: [],
                        dataKeys: {},
                        colorStack: [...Array(colors.length).keys()],})
                }>

                {this.state.devices.map(d =>
                    <option key={d.device_id} value={d.device_id}>{d.device_id}</option>)}
            </select>
        </div>;
    }


}

const element = <VoltChart name="world" />;
ReactDOM.render(
  element,
  document.getElementById('react')
);