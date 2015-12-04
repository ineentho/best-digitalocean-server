'use strict'

const Promise = require('bluebird')
const co = require('co')
const ping = Promise.promisifyAll(require('net-ping'), { multiArgs: true })
const dns = Promise.promisifyAll(require('dns'))

const NUM_TRIES_PER_HOST = 10

const locations = [
    // New York
    'nyc1', 'nyc2', 'nyc3',
    // San Francisco
    'sfo1',
    // Amsterdam
    'ams1', 'ams2', 'ams3',
    // Singapore
    'sgp1',
    // London
    'lon1',
    // Frankfurt
    'fra1',
    // Toronto
    'tor1'
];

function* getIp(location) {
    return yield dns.lookupAsync(`speedtest-${location}.digitalocean.com`)
}

function avg(arr) {
    let total = 0
    for (const element of arr)
        total += element

    return total / arr.length
}

function *test() {
    const session = ping.createSession()

    const tests = [];

    for (const location of locations) {
        const ip = yield getIp(location)

        const times = [];
        for (let i = 0; i < NUM_TRIES_PER_HOST; i++) {
            const res = yield session.pingHostAsync(ip)
            const time = res[2] - res[1]
            times.push(time)
            console.log(`${location} (${ip}): ${time}ms`)
        }

        const time = avg(times)


        tests.push({
            location,
            ip,
            time
        })
    }

    return tests
}

co(function* () {

    let times = yield test()
    times.sort((a, b) => a.time - b.time)
    console.log('\n\nBEST SERVERS:')
    for (const time of times) {
        console.log(`${time.location} avg ${time.time}ms`)
    }


}).catch(err => {
    console.error(err.stack)
})
