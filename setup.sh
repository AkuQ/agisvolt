#!/usr/bin/env bash

echo "Creating python3.6 virtual environment..."
python36 -m venv venv > /dev/null
source venv/bin/activate > /dev/null

echo "Installing required pip packages..."
pip install --upgrade pip > /dev/null
pip install -r requirements.txt > /dev/null


echo "Stopping old service..."
systemctl stop agisvolt &> /dev/null
systemctl disable agisvolt &> /dev/null

echo "Creating systemd service file..."
app_dir=$(pwd)
echo '
[Unit]
Description=uWSGI instance to serve agisvolt

[Service]
ExecStartPre=-/usr/bin/bash -c "mkdir -p /run/agisvolt; chown nginx:nginx /run/agisvolt"
ExecStart=/usr/bin/bash -c "cd '${app_dir}'; source venv/bin/activate; uwsgi uwsgi/uwsgi.ini"

[Install]
WantedBy=multi-user.target
' > uwsgi/agisvolt.service

echo "Starting service"
systemctl enable ${app_dir}/uwsgi/agisvolt.service
systemctl start agisvolt


echo "Install NodeJS modules..."
npm install > /dev/null

echo "Compiling bundles..."
./node_modules/.bin/webpack --config webpack.config.js > /dev/null


deactivate
echo "Done!"