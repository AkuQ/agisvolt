const React = require('react');
const ReactDOM = require('react-dom');

import {login, register, logout} from './api_handler';

class Login extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            email: '',
            password: '',
        }
    }

    submit(ev) {
        ev.preventDefault();
        login(this.state)
        .then((result) => {
            console.log(result);
        })
    }

    render() {
        return <form onSubmit={ev => this.submit(ev)} method='post'>
            <label>
                Email:
                <input type='text' value={this.state.email}
                       onChange={ev => this.setState({email: ev.target.value})}/>
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

class Register extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            first_name: '',
            last_name: '',
            email: '',
            password: '',
            password2: '',
        }
    }

    submit(ev) {
        ev.preventDefault();
        register(this.state)
        .then((result) => {
            console.log(result);
        })
    }

    render() {
        return <form onSubmit={ev => this.submit(ev)} method='post'>
            <label>
                Email:
                <input type='text' value={this.state.email}
                       onChange={ev => this.setState({email: ev.target.value})}/>
            </label>
            <br/>
            <label>
                Password:
                <input type='text' value={this.state.password}
                       onChange={(ev) => this.setState({password: ev.target.value})}/>
            </label>
            <br/>
            <label>
                First name:
                <input type='text' value={this.state.first_name}
                       onChange={(ev) => this.setState({first_name: ev.target.value})}/>
            </label>
            <br/>
            <label>
                Last name:
                <input type='text' value={this.state.last_name}
                       onChange={(ev) => this.setState({last_name: ev.target.value})}/>
            </label>
            <br/>
            <input type='submit' value='Register'/>
        </form>;
    }
}

class Logout extends React.Component {
    click(ev) {
        logout().then((result) => console.log(result));
    }

    render() {
        return <div>
            <input type='button' value={'Logout'} onClick={ev => this.click(ev)}/>
        </div>
    }
}



ReactDOM.render(
    <Register />,
    document.getElementById('register')
);

ReactDOM.render(
    <Login />,
    document.getElementById('login')
);

ReactDOM.render(
    <Logout />,
    document.getElementById('logout')
);