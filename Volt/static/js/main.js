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
            device_id: 100,
            data: []
        };
        this.last_timestamp = 0;
        this.last_poll = 0;
        this.is_polling = false;
        this.buffer = [];
    }

    pollData(max_lookback){
        if(!this.is_polling && this.last_poll + POLL_DELAY <= PyTime()) {
            this.last_poll = PyTime();
            this.is_polling = true;

            let conf = {
                method: 'GET',
                headers: {'Content-Type': 'application/json'},
                // body: {},
                credentials: 'same-origin',
            };

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
    }

    render() {
        let now = PyTime();
        return <div>
            <LineChart width={750} height={250} data={[...this.state.data]}>
                <Line
                    type='monotone' dataKey='mean' stroke='#0892d0' dot={false}
                    yAxisId='y' xAxisId='x' animationDuration={500} isAnimationActive={false}  />
                <Line
                    type='monotone' dataKey='max_error' stroke='#0892d0' dot={false}
                    yAxisId='y' xAxisId='x' animationDuration={500} isAnimationActive={false} />

                <XAxis xAxisId='x' dataKey='timestamp' type='number' domain={[now - PREBUFFER * 2, now - PREBUFFER]} allowDataOverflow={true}/>
                <YAxis yAxisId='y' dataKey='mean' type='number' domain={[0.0, 12.0]}/>
                <Legend />
                <Tooltip />
            </LineChart>
            <input type='button' value={this.state.paused && 'Play' || 'Pause'} onClick={(ev) => {
                ev.target.value = 'Play';
                this.setState({paused: !this.state.paused});
            }}/>
        </div>;

        // return <AnyChart title="test" type="line" data={this.state.data}/>;
        // let series = new TimeSeries({events: this.state.events});
        // return <ChartContainer width={800} timeRange={series.timerange()}>
        //     <ChartRow height="200">
        //         <YAxis id="axis1" label="Voltage" min={0.0} max={1.0} width="60" type="linear" format=".2f"/>
        //         <Charts>
        //             <LineChart axis="axis1" series={series} column={["value"]}/>
        //             <LineChart axis="axis2" series={series} column={["value2"]}/>
        //         </Charts>
        //         <YAxis id="axis2" label="Value * 10" min={0.0} max={10.0} width="80" type="linear" format=".2f"/>
        //     </ChartRow>
        // </ChartContainer>
    }
}

const element = <VoltChart name="world" />;
ReactDOM.render(
  element,
  document.getElementById('react')
);