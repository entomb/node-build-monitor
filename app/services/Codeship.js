var request = require('request'),
    async = require('async');

module.exports = function () {

    var self = this,
        requestBuilds = function (callback) {
            request({
                'url': 'https://codeship.com/api/v1/projects/' + self.configuration.project + '.json?api_key=' + self.configuration.token,
                'json' : true
                },
                function(error, response, body) {
			callback(body.builds);
            });
        },
        queryBuilds = function (callback) {
            requestBuilds(function (body) {
                if (!body) {
                    callback([]);
                } else {
                    async.map(body, requestBuild, function (err, results) {
                        callback(results);
                    });
                }
            });
        },
        requestBuild = function (build, callback) {
            request({
                'url': 'https://codeship.com/api/v1/builds/' + build.id + '.json?api_key=' + self.configuration.token,
                'json' : true
                },
                function(error, response, body) {
                    callback(error, simplifyBuild(body));
            });
        },
        parseDate = function (dateAsString) {
            return new Date(dateAsString);
        },
        getStatus = function (result, state) {
            if (state === 'success') return "Green";
            if (state === 'error') return "Red";
            if (state === 'testing') return "Blue";
            if (state === 'stoped') return "Gray";
	    return "Gray";
            return null;
        },
        simplifyBuild = function (res) {
            return {
                id: res.uuid,
                project: res.project_id,
                number: res.commit_id.toString().substring(0,7),
                isRunning: res.state === 'running',
                startedAt: parseDate(res.started_at),
                finishedAt: parseDate(res.finished_at),
                requestedFor: res.github_username,
                status: getStatus(res.result, res.status),
                statusText: res.status,
                reason: res.message,
                hasErrors: false,
                hasWarnings: false,
                url: 'https://codeship.com/projects/'+res.project_id+'/builds/' + res.id
            };
        };

    self.configure = function (config) {
        self.configuration = config;

      	self.configuration.project = self.configuration.project || '';
        self.configuration.token = self.configuration.token || '';
    };

    self.check = function (callback) {
        queryBuilds(callback);
    };
};
