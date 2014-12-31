/**
 *
 */

(function wait() {
  if (!$('div.story').length) return setTimeout(wait, 250);
  main();
}());


/**
 *
 */

function main() {
  initializeTimers().then(initializeHarvestPlatform);
}


// ---------------------------------------------------------------------------


/**
 *
 */

var PROJECT = {};


/**
 *
 */

function initializeTimers() {
  return new Promise(function (resolve, reject) {
    var header;

    if (!PROJECT.id) {
      header        = $('header.tc_page_header');
      PROJECT.id    = parseInt(window.location.pathname.match(/projects\/(\d+)/)[1]);
      PROJECT.name  = header.find('.raw_context_name').text();
    }

    $('div.story').not('.release').each(function (k, v) {
      var $v    = $(v)
        , data  = {}
        , timer;

      if ($v.find('.harvest-timer').length) {
        return;
      }

      data.id   = parseInt($v.data('id'));
      data.name = $v.find('span.story_name').text();

      timer = $('<div class="harvest-timer" />');
      timer.attr('data-project',  JSON.stringify(PROJECT));
      timer.attr('data-item',     JSON.stringify(data));

      $v.find('span.state').append(timer);
    });

    resolve();
  });
}


/**
 *
 */

function initializeHarvestPlatform() {
  return new Promise(function (resolve, reject) {
    var entry, script, platform, ph;

    script            = document.createElement('script');
    script.type       = 'text/javascript';
    script.async      = true;
    script.innerHTML  = 'window._harvestPlatformConfig = ' + JSON.stringify({
      applicationName:  'PivotalTracker',
      permalink:        'https://www.pivotaltracker.com/story/show/%ITEM_ID%',
      skipJquery:       true
    });

    entry = document.getElementsByTagName('script')[0];
    entry.parentNode.insertBefore(script, entry);

    platform        = document.createElement('script');
    platform.src    = '//platform.harvestapp.com/assets/platform.js';
    platform.async  = true;
    
    ph = document.getElementsByTagName('script')[0];
    ph.parentNode.insertBefore(platform, ph);

    $('body').on('harvest-event:ready', function (e) {
      resolve();
    });
  });
}





