# cloudflare-ddns (nodejs)

A lightweight tool written in nodejs that makes it easy to update a Cloudflare DNS record or origin address for a dynamic IP.

## How-To

### Environment variables

This tool can be used for two use cases, both use cases need some specific environment variables.
1. Cloudflare DNS record: 
```
CF_MODE=record
CF_EMAIL=
CF_KEY=
CF_ZONE=
CF_RECORD=
```
2. Cloudflare Load balancer (only works with a single origin)
```
CF_MODE=pool
CF_EMAIL=your-email
CF_KEY=your-auth-key
CF_POOL=your-pool-id
```

### Run the script

- start the script manually with pm2 for example... OR

- use docker
```
docker run --env-file=/path/to/env/file nanjoran/cf-ddns
```