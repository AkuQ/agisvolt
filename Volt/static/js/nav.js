const React = require('react');
const ReactDOM = require('react-dom');


class Nav extends React.Component {
    constructor(props) {
        super(props);
        this.li_style = {display: 'inline',  padding: 5};
    }

    render() {
        return(
            <ul style={{listStyleType: 'none', margin: 0, padding: 0}}>
                <li style={ this.li_style }><a href={'/'}>Main</a></li>
                <li style={ this.li_style }><a href={django.perms.monitor_device && '/devices'}>Devices</a></li>
                <li style={ this.li_style } ><a href={django.perms.monitor_user && '/users'}>Users</a></li> {/* todo - can verify users*/}
                {!django.user.is_authenticated && <li style={ this.li_style }><a  href={'/login'}>Login</a></li>}
                { django.user.is_authenticated && <li style={ this.li_style }><a href={'/logout'}>Logout</a></li>}
            </ul>
        );
    }
}


ReactDOM.render(<Nav/>, document.getElementById('nav'));