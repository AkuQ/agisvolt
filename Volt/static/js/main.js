const React = require('react');
const ReactDOM = require('react-dom');
import {LineChart, Line, XAxis, YAxis, Legend, Tooltip, ReferenceLine, CartesianGrid} from 'recharts';

import {pyTime, parametrizeURL, ArrayExt} from './utils';

const POSTBUFFER = 200;
const PREBUFFER = 10;
const POLL_DELAY = 5;


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
            graphKeys: {},
            colorStack: [...Array(colors.length).keys()],
            labelColors: {},
        };
        this.last_timestamp = 0;
        this.last_poll = 0;
        this.is_polling = false;
        this.buffer = [];
        this.now = pyTime();
        this.timeDomain = () => [this.now - PREBUFFER * 2, this.now - PREBUFFER]
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
        if(!this.is_polling && this.last_poll + POLL_DELAY <= this.now) {
            this.is_polling = true;
            this.last_poll = this.now;

            let conf = {
                method: 'GET',
                headers: {'Content-Type': 'application/json'},
                credentials: 'same-origin',
            };

            // console.log(this.state.device_id);
            let url = parametrizeURL('/api/measurements', {
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


                            let label = row.label.split('|')[0];
                            let graphKey = row.label.split('|')[1] || '';
                            this.state.graphKeys[graphKey] = true;
                            this.state.labelColors[label] = this.state.labelColors[label] || this.state.colorStack.pop();

                            this.state.dataKeys[row.label] = this.state.dataKeys[row.label] || {
                                color: this.state.labelColors[label],  // todo: index error if out of colors
                                hidden: false,
                            };

                            this.state.dataKeys[row.label].timestamp = row.timestamp;
                            row.value < 0 && (this.state.dataKeys[row.label].neg = true);
                        });

                        measurements = Object.values(measurements).sort((a, b) => a.timestamp - b.timestamp);
                        this.buffer = this.buffer.concat(measurements);
                        this.last_timestamp = ArrayExt(measurements).last('timestamp') || this.last_timestamp;
                    }
                    this.is_polling = false;
                })
                .catch(reason => console.warn(reason));
        }
    }

    componentDidMount() {
        setInterval(this.tick.bind(this), 1000);
        this.fetchDevices();
    }

    resetState() {
        this.setState({
                device_id: ev.target.value,
                data: [],
                dataKeys: {},
                colorStack: [...Array(colors.length).keys()],})
    }

    tick() {
        this.now = pyTime();

        let data = this.state.data;
        let cursor = this.now - PREBUFFER;
        let max_lookback = cursor - POSTBUFFER;
        this.pollData(max_lookback);

        let item;
        do item = data.pop() || {timestamp: cursor, is_fake: 1}; while(item.timestamp < max_lookback);
        !item.is_fake && data.push(item);

        let refresh = false;
        while(cursor >= ArrayExt(this.buffer).first('timestamp') || 0) {
            data.push(this.buffer.shift());
            refresh = true;
        }
        refresh && !this.state.paused && this.forceUpdate();
    }

    renderLine(dataKey, i){
        let keyStyles = this.state.dataKeys[dataKey];
        let color = keyStyles.hidden ? "#a09292" : colors[keyStyles.color];

        return <Line
                key={dataKey + "_line"} name={dataKey.split('|')[0]}
                type='monotone' dataKey={dataKey} stroke={color} dot={true}
                yAxisId='y' xAxisId='x' animationDuration={500} isAnimationActive={false}
                hide={keyStyles.hidden} />;
    }

    renderGraph(graphKey) {
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

        let max = 0.0;
        this.state.data.forEach(row => {
            Object.keys(row).forEach(key => {
                let value = row[key];
                let lineGraph = key.split('|')[1] || '';
                key !== 'timestamp' && lineGraph === graphKey && Math.abs(value) > max
                && ( max = Math.abs(value) );
            });
        });
        max = Math.ceil(max) + Math.ceil(max / 10);
        let yticks = [-max, -max / 2, 0, max / 2, max ];
        let xticks = [];
        let xdomain = this.timeDomain();
        for(let i = xdomain[0]; i <= xdomain[1]; i+=2)
            xticks.push(i);

        return <div key={graphKey+'_graph'}>
            {graphKey ? <h1>{graphKey}</h1> : undefined}
            <LineChart width={750} height={250} data={[...this.state.data]} margin={{top:20}}>

                 {
                     Object.keys(this.state.dataKeys)
                     .filter(k => (k.split('|')[1] || '') === graphKey)
                     .map((k, i) => this.renderLine(k, i))
                 }

                <XAxis xAxisId='x' dataKey='timestamp' type='number' tickFormatter={timeTickFormat}
                       domain={xdomain} allowDataOverflow={true} ticks={xticks} />
                <YAxis yAxisId='y' type='number' domain={[-max, max]} allowDataOverflow={true} ticks={yticks}/>

                <Legend onClick={line => {
                    this.state.dataKeys[line.dataKey].hidden = !this.state.dataKeys[line.dataKey].hidden;
                    this.forceUpdate();
                }} />
                <Tooltip formatter={tooltipFormatter} labelFormatter={tooltipLabelFormatter}/>
                <CartesianGrid strokeDasharray="2 2"/>
            </LineChart>
        </div>;
    }

    render(){
        return <div>
            {Object.keys(this.state.graphKeys).map(k => this.renderGraph(k))}

             <input type='button' value={this.state.paused && 'Play' || 'Pause'} onClick={ev => {
                ev.target.value = 'Play';
                this.setState({paused: !this.state.paused});
            }}/>
            <select value={this.state.device_id}
                onChange={ev =>
                    this.setState({
                        device_id: ev.target.value,
                        data: [],
                        dataKeys: {},
                        graphKeys: {},
                        colorStack: [...Array(colors.length).keys()],
                        labelColors: {},
                    })
                }>

                {this.state.devices.map(d =>
                    <option key={d.device_id} value={d.device_id}>{d.device_id}</option>)}
            </select>
        </div>
    }

}

const element = <VoltChart name="world" />;
ReactDOM.render(
  element,
  document.getElementById('react')
);