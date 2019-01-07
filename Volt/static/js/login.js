const React = require('react');
const ReactDOM = require('react-dom');

class Login extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            username: '',
            password: '',
        }
    }

    login(ev) {
        ev.preventDefault();

        let conf = {
            method: 'POST',
            mode: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': CSRF_TOKEN,
            },
            credentials: 'same-origin',
            body: JSON.stringify(this.state),
        };

        fetch('/login/', conf).then((result) => {
            console.log('OK!');
        }).catch((reason) => {
            console.log('Rejected');
        });

    }

    render() {
        return <form onSubmit={(ev) => this.login(ev)} method='post'>
            <label>
                Username:
                <input type='text' value={this.state.username}
                       onChange={(ev) => this.setState({username: ev.target.value})}/>
            </label>
            <br/>
            <label>
                Password:
                <input type='text' value={this.state.password}
                       onChange={(ev) => this.setState({password: ev.target.value})}/>
            </label>
            <br/>
            <input type='submit' value='Login'/>
        </form>;
    }
}

ReactDOM.render(
    <Login />,
    document.getElementById('login')
);