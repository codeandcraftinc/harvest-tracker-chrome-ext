
/**
 *
 */

var _DEBUG = true;

/**
 *
 */

var _PROJECT;

/**
 *
 */

function log(/* type, args... */) {
  var args = _.compact(arguments);
  var type = 'log';

  if (!_DEBUG) {
    return;
  }

  if (['log', 'warn', 'error'].indexOf(args[0]) > -1) {
    type = args[0];
    args.shift();
  }

  args.unshift('[harvest / tracker]');
  console[type].apply(console, args);
}

/**
 *
 */

function configure() {
  return new Promise(function (resolve, reject) {
    var script = document.createElement('script');
    var entry = document.getElementsByTagName('script')[0];
    var $header = $('header.tc_page_header');

    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = 'window._harvestPlatformConfig = ' + JSON.stringify({
      applicationName: 'PivotalTracker',
      permalink: 'https://www.pivotaltracker.com/story/show/%ITEM_ID%',
      skipJquery: true
    });

    entry.parentNode.insertBefore(script, entry);

    _PROJECT = {
      id: parseInt(window.location.pathname.match(/projects\/(\d+)/)[1]),
      name: $header.find('.raw_context_name').text()
    };

    resolve();
  });
}

/**
 *
 */

function importHarvestPlatform() {
  return new Promise(function (resolve, reject) {
    $.getScript('https://platform.harvestapp.com/assets/platform.js')
      .then(resolve)
      .fail(reject);
  });
}

/**
 *
 */

function setupTimers() {
  return new Promise(function (resolve, reject) {
    var $stories = $('div.story:not(.release, :has(.harvest-timer))');

    _.forEach($stories, function (el) {
      var $el = $(el);
      var data = {};
      var labels;
      var $timer;
      var evt;

      data.id = parseInt($el.data('id'));
      data.name = $el.find('span.story_name').text();

      labels = _.map($el.find('.label'), function (v) {
        return $(v).text().replace(/\,\s$/, '');
      });

      if (labels.length) {
        data.name += ' [' + _.uniq(labels).join(', ') + ']';
      }

      $timer = $el.find('.harvest-timer');

      if (!$timer.length) {
        $timer = $('<div class="harvest-timer" />')
          .attr('data-uid', _.uniqueId('timer_'))
          .appendTo($el.find('span.state'));
      }

      $timer.attr('data-project', JSON.stringify(_PROJECT));
      $timer.attr('data-item', JSON.stringify(data));
    });

    resolve($stories.find('.harvest-timer'));
  });
}

/**
 *
 */

function setupEventProxy() {
  return new Promise(function (resolve, reject) {
    var script = document.createElement('script');
    var fn = [
      '(function(){',
      '  window.addEventListener("reinitializeTimer", function (evt) {',
      '    var target = document.querySelector("#harvest-messaging");',
      '    var query = "[data-uid=\'" + evt.detail.uid + "\']";',
      '    var timer = document.querySelector(query);',
      '    var harvest = document.querySelector("#harvest-messaging");',
      '    var data = { detail: { element: timer } };',
      '    harvest.dispatchEvent(new CustomEvent("harvest-event:timers:add", data));',
      '  });',
      '}());'
    ].join('\n');
new CustomEvent("harvest-event:timers:add", {
  detail: { element: document.querySelector("#newly-added-timer") }
});
    script.textContent = fn;
    (document.head||document.documentElement).appendChild(script);
    resolve();
  });
}

/**
 *
 */

function reinitializeTimer(el) {
  window.dispatchEvent(new CustomEvent('reinitializeTimer', {
    detail: {
      uid: $(el).data('uid')
    }
  }));
}

/**
 *
 */

function reinitializeTimers() {
  return setupTimers().then(function ($timers) {
    _.forEach($timers.get(), reinitializeTimer);
    log('reinitialized (' + $timers.length + ') timers', $timers);
  });
}

// ---------------------------------------------------------------------------

/**
 *
 */

$(document).ready(function () {
  (function waitForStoriesThenInitialize(){
    var $stories = $('div.story');

    if (!$stories.length) {
      return setTimeout(waitForStoriesThenInitialize, 500);
    }

    configure()
      .tap(log.bind(null, 'configuration loaded'))
      .then(setupTimers)
      .tap(log.bind(null, 'timers ready'))
      .then(importHarvestPlatform)
      .tap(log.bind(null, 'platform imported'))
      .then(setupEventProxy)
      .tap(log.bind(null, 'event proxy ready'))
      .then(function () {
        setInterval(reinitializeTimers, 5000);
      })['catch'](log.bind(null, 'error'));

  }());
});
