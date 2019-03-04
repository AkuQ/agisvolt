# agisvolt

### Example nginx.conf:
```
upstream django {
    server unix:///your_app_dir/agisvolt/uwsgi/socket;
    #server 127.0.0.1:8000; # for a web port socket
}


server {
    listen 80;
    server_name volt.your-domain.fi;
    charset utf-8;
    client_max_body_size 75M;

    location /static {
        alias /your_app_dir/agisvolt/Volt/static;
    }

    location /media {
        alias /your_app_dir/agisvolt/Volt/media;
    }

    location / {
        uwsgi_pass django;
        include /your_app_dir/agisvolt/uwsgi/uwsgi_params;
    }
}

```