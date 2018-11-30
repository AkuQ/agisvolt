const React = require('react');
const ReactDOM = require('react-dom');
import {LineChart, Line, XAxis, YAxis, Legend, Tooltip} from 'recharts';


class VoltChart extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            // events: [new TimeEvent(Date.now() / 1000, {value: 0, value2: 0})],
            data: [{time:  Date.now(), value: 0, value2: 0}]
        };
        this.started = Date.now();
    }

    tick() {
        let data = this.state.data;

        data.length > 20 && (this.state.data = data.slice(10));
        this.state.data.push({time: Date.now(), value: Math.random(), value2: Math.random() * 10});
        !this.state.paused && this.forceUpdate();
    }


    componentDidMount() {
        let intervalID = setInterval(this.tick.bind(this), 1000);
    }

    render() {
        let now = Date.now();
        return <div>
            <LineChart width={750} height={250} data={[...this.state.data]}>
                <Line
                    type='monotone' dataKey='value' stroke='#0892d0' dot={false}
                    yAxisId={'y'} xAxisId={'x'} animationDuration={500} isAnimationActive={false}  />
                <Line
                    type='monotone' dataKey='value2' stroke='#0892d0' dot={false}
                    yAxisId={'y'} xAxisId={'x'} animationDuration={500} isAnimationActive={false} />

                <XAxis xAxisId='x' dataKey='time' type='number' domain={[now - 10000, now]} allowDataOverflow={true}/>
                <YAxis yAxisId='y' dataKey='value' type='number' domain={[0.0, 12.0]}/>
                <Legend />
                <Tooltip />
            </LineChart>
            <input type='button' value={this.state.paused && 'Play' || 'Pause'} onClick={(ev) => {
                ev.target.value = 'Play';
                this.setState({paused: !this.state.paused});
            }}/>
            <p>Sample count = {this.state.data.length}</p>
            <p>API endpoint = {API} </p>
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