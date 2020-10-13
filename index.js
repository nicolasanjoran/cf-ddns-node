const { execSync } = require('child_process');


var ip = null
var ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/

const mode = process.env.CF_MODE
const email = process.env.CF_EMAIL
const key = process.env.CF_KEY
const zoneId = process.env.CF_ZONE
const recordId = process.env.CF_RECORD
const poolId = process.env.CF_POOL
const period = process.env.CF_PERIOD || 60


if (!email || !key || !mode) {
    console.log("Missing CF_EMAIL or CF_KEY or CF_MODE environment variables")
    process.exit(1)
}

if (mode == "record" && (!zoneId || !recordId)) {
    console.log("An environment variable is missing.")
    process.exit(2)
}

if (mode == "pool" && (!poolId)) {
    console.log("An environment variable is missing.")
    process.exit(3)
}

var axios = require('axios');

function pushToCloudflareLoadBalancerPool(newIp) {
    axios({
        method: 'get',
        url: `https://api.cloudflare.com/client/v4/user/load_balancers/pools/${poolId}`,
        headers: {
            'X-Auth-Email': email,
            'X-Auth-Key': key,
            'Content-Type': 'application/json'
        }
    })
        .then(function (response) {
            let poolData = response.data.result
            let origin = poolData.origins[0]

            if (origin) {
                delete (origin["healthy"])
                delete (origin["failure_reason"])
                origin.address = newIp
            }

            poolData = {
                name: poolData.name,
                enabled: poolData.enabled,
                id: poolData.id,
                monitor: poolData.monitor,
                check_regions: poolData.check_regions,
                notification_email: poolData.notification_email,
                origins: [origin]
            }

            return axios({
                method: 'put',
                url: `https://api.cloudflare.com/client/v4/user/load_balancers/pools/${poolId}`,
                headers: {
                    'X-Auth-Email': email,
                    'X-Auth-Key': key,
                    'Content-Type': 'application/json'
                },
                data: poolData
            })
        })
        .then(res => {
            if (res.data.success) {
                ip = newIp
                console.log("Cloudflare: successfully updated origin address for pool", poolId)
            }
        })
        .catch(function (error) {
            console.log(error);
        });
}

function pushToCloudflareRecord(newIp) {

    axios({
        method: 'get',
        url: `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`,
        headers: {
            'X-Auth-Email': email,
            'X-Auth-Key': key,
            'Content-Type': 'application/json'
        }
    })
        .then(res => {
            return axios({
                method: 'put',
                url: `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`,
                headers: {
                    'X-Auth-Email': email,
                    'X-Auth-Key': key,
                    'Content-Type': 'application/json'
                },
                data: { "type": "A", "name": res.data.result.name, "content": newIp, "ttl": res.data.result.ttl, "proxied": true }
            })
        })

        .then(function (response) {
            if (response.data && response.data.success) {
                ip = newIp
                console.log("Cloudflare records successfully updated.")
            }
        })
        .catch(function (error) {
            console.log("An error occured while updated CF records.", error);
        });
}


async function check() {
    let newIp = execSync("dig TXT +short o-o.myaddr.l.google.com @ns1.google.com").toString()
    newIp = newIp.replace(/"/g, "")
    newIp = newIp.replace('\n', "")
    console.log("New IP =", newIp, "--- Old IP =", ip)

    if (ipRegex.test(newIp) && ip != newIp) {
        console.log("IP has changed, will contact cloudflare.")
        if (mode == "record") {
            pushToCloudflareRecord(newIp)
        } else if (mode == "pool") {
            pushToCloudflareLoadBalancerPool(newIp)
        }
    }
}


check()
setInterval(check, period * 1000)