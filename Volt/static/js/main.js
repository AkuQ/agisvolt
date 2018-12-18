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

class VoltChart extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            device_id: 'TEST',
            devices: [],
            data: [],
        };
        this.last_timestamp = 0;
        this.last_poll = 0;
        this.is_polling = false;
        this.buffer = [];
        this.data_keys= {};
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
                            this.data_keys[row.label] = row.timestamp;
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

    renderLine(dataKey){
        return (
            <Line
                key={dataKey + "_line"}
                type='monotone' dataKey={dataKey} stroke='#0892d0' dot={true}
                yAxisId='Y' xAxisId='x' animationDuration={500} isAnimationActive={false}
            />
        );
    }

    render() {
        let now = PyTime();

        return <div>
            <LineChart width={750} height={250} data={[...this.state.data]}>
                 {Object.keys(this.data_keys).map(k => this.renderLine(k))}
                <XAxis xAxisId='x' dataKey='timestamp' type='number' domain={[now - PREBUFFER * 2, now - PREBUFFER]} allowDataOverflow={true}/>
                <YAxis yAxisId='Y' dataKey={'t1'} type='number' domain={[0.0, 12.0]}/>
                <Legend />
                <Tooltip />
            </LineChart>
            <input type='button' value={this.state.paused && 'Play' || 'Pause'} onClick={(ev) => {
                ev.target.value = 'Play';
                this.setState({paused: !this.state.paused});
            }}/>
            <select onChange={ev => this.setState({device_id: ev.target.value})} defaultValue={this.state.device_id}>
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