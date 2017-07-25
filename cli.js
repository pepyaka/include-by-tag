#!/usr/bin/env node

const path = require('path');
const os = require('os');

const configuration = require('./lib/config');
const ES = require('./lib/es');

const defaultConfig = process.argv[2] || path.join(os.homedir(), '.config', 'esclumon.yml');

configuration.get(defaultConfig).then(config => {
    const es = new ES(config.url);
    const getAllMetrics = config.metrics.map(metric => {
        const { pathname, search } = metric.get;
        return es.getMetric(pathname, search);
    });
    return Promise.all(getAllMetrics).then(metricDataList => {
        const delay = Math.random() * config.maxDelay;
        const metricList = metricDataList.map((data, i) => {
            return {
                data: data,
                conf: config.metrics[i]
            };
        });
        const validMetrics = metricList.filter(({ data: { error }}) => (!error));
        const metricsWithTimestamp = validMetrics.map(metric => {
            return addTimestampToMetric(metric, config.timestampFieldName, config.indexName);
        });
        console.log(`Delay: ${delay} ms`);
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(metricsWithTimestamp);
            }, delay);
        });
    }).then(metrics => {
        const docs = metrics.map(({ conf: { put }}) => put);
        return es.checkIfMetricsExists(docs)
            .then(({ docs }) => {
                const mayBeUpdated = metric => {
                    const docForMetric = docs.find(doc => {
                        return metric.conf.put._type === doc._type &&
                            metric.conf.put._id === doc._id;
                    });
                    return docForMetric && (!docForMetric.found);
                };
                return metrics.filter(mayBeUpdated);
            });
    }).then(metrics => {
        if (metrics.length > 0) {
            return es.bulkCreate(metrics);
        } else {
            return "No data updated!";
        }
    });
}).then(console.log).catch(console.error);

function addTimestampToMetric(metric, tsFieldName, indexName) {
    const { data, conf } = metric;
    const now = new Date();
    // Recieved arrays must be converted as object field
    const newData = Array.isArray(data) ? { list: data } : data;
    // Add date suffix to index
    const dateSuffix = now.toLocaleDateString('null', {
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/-/g, '.');
    conf.put._index = `${indexName}-${dateSuffix}`;
    // Add document ID as time: HH:mm
    conf.put._id = now.toLocaleTimeString('null', {
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit'
    });
    // Add timestamp field
    newData[tsFieldName] = now.toISOString();
    return {
        data: newData,
        conf: conf
    };
}
