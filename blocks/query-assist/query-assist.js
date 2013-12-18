define(['jquery', 'global/global__views', 'global/global__modules', 'global/global__utils', 'dropdown/dropdown', 'auth/auth', 'jquery-caret'], function ($, View, Module, utils) {
  'use strict';

  var $el,
    $query,
    dataSource,
    $global,
    timeoutHandler,
    lastPolledCaretPosition,
    lastTriggeredCaretPosition,
    lastPolledValue,
    lastTriggeredValue,
    COMPONENT_SELECTOR,
    CONTAINER_SELECTOR,
    WRAPPER_SELECTOR,
    ITEM_SELECTOR,
    ITEM_CONTENT_SELECTOR,
    ITEM_CONTENT_SELECTOR_PADDING,
    CONTAINER_TOP_PADDING,
    MIN_LEFT_PADDING,
    MIN_RIGHT_PADDING;

  var dropdown = Module.get('dropdown');

  /**
   * Config wrapper for QueryAssist
   */
  var QueryConfig = function (config) {
    if (!config) {
      throw new Error('QueryConfig: config is empty');
    }
    // default value && contants
    this.config = {
      COMPONENT_SELECTOR: '.ring-query',
      CONTAINER_SELECTOR: '.ring-dropdown',
      WRAPPER_SELECTOR: '.ring-dropdown__i',
      ITEM_SELECTOR: '.ring-query-el',
      ITEM_CONTENT_SELECTOR: '.ring-dropdown__item__content',
      ITEM_CONTENT_SELECTOR_PADDING: 8,
      MIN_LEFT_PADDING: 32,
      MIN_RIGHT_PADDING: 32,
      CONTAINER_TOP_PADDING: 21,
      global: window
    };

    for (var item in config) {
      this.config[item] = config[item];
    }
  };
  QueryConfig.prototype.get = function (name) {
    if (!this.config.hasOwnProperty(name)) {
      throw new Error('QueryConfig: prop isn\'t exist');
    }
    return this.config[name];
  };

  QueryConfig.prototype.getDom = function (name) {
    $el = $(this.get(name));
    return $el;
  };

  QueryConfig.prototype.set = function (name, prop) {
    this.config[name] = prop;
    return this.config[name];
  };

  QueryConfig.prototype.getAll = function () {
    return this.config;
  };

  /**
   * Init method
   */
  var init = function (config) {
    var queryModule = Module.get('query'),
      queryConfig = new QueryConfig(config),
      text;

    $global = queryConfig.getDom('global');
    $el = queryConfig.getDom('el');

    dataSource = queryConfig.get('dataSource');
    COMPONENT_SELECTOR = queryConfig.get('COMPONENT_SELECTOR');
    WRAPPER_SELECTOR = queryConfig.get('WRAPPER_SELECTOR');
    CONTAINER_SELECTOR = queryConfig.get('CONTAINER_SELECTOR');
    ITEM_SELECTOR = queryConfig.get('ITEM_SELECTOR');
    ITEM_CONTENT_SELECTOR = queryConfig.get('ITEM_CONTENT_SELECTOR');
    ITEM_CONTENT_SELECTOR_PADDING = queryConfig.get('ITEM_CONTENT_SELECTOR_PADDING');
    CONTAINER_TOP_PADDING = queryConfig.get('CONTAINER_TOP_PADDING');
    MIN_LEFT_PADDING = queryConfig.get('MIN_LEFT_PADDING');
    MIN_RIGHT_PADDING = queryConfig.get('MIN_RIGHT_PADDING');

    _bindEvents($el);
    queryModule.trigger('init:done');

    text = $el.text();
    if (text.length) {
      _doAssist(text, text.length, true);
    }
  };

  /**
   * Destroy query container && trigger events
   */
  var destroy = function () {
    var queryModule = Module.get('query');

    if (/*$queryContainer && */$query) {
      $query.remove();
      $query = null;
      queryModule.trigger('destroy:done');
      return true;
    } else {
      queryModule.trigger('destroy:fail');
      return false;
    }
  };

  // FIXME Workaround to prevent double binds
  var listening;

  var _startListen = function () {
    if (listening) {
      return;
    }
    listening = true;

    var queryModule = Module.get('query');

    lastTriggeredCaretPosition = undefined;
    lastPolledCaretPosition = undefined;
    timeoutHandler = setInterval(_pollCaretPosition, 250);
    queryModule.trigger('startListen:done');
  };

  var _stopListen = function () {
    if (!listening) {
      return;
    }
    listening = false;

    var queryModule = Module.get('query');

    if (timeoutHandler) {
      clearInterval(timeoutHandler);
    }
    queryModule.trigger('stopListen:done');
  };

  var _bindEvents = function ($el) {
    var queryModule = Module.get('query'),
      once = true;

    $el.bind('keypress', function (e) {
      if (e.which === 13) {
        e.preventDefault();
        queryModule.trigger('apply');
        dropdown('hide');
      }
    });

    $el.bind('focus',function () {
      _startListen();
      // Enable highlight predefined text in Angular
      if (once) {
        once = false;
        var isHighlighted = $el.find('span');
        if (!isHighlighted.length) {
          var textEl = $el.text();
          _doAssist(textEl, textEl.length, true);
        }
      }
    }).bind('blur', function () {
        _stopListen();
      });
    $global.on('click', function (ev) {
      var target = $(ev.target);
      if (!target.is($el) && !target.closest().length) {
        destroy();
      }
    });
    if ($el.is(':focus')) {
      _stopListen();
    }
    $global.resize(destroy);
    queryModule.trigger('bindEvents:done');
  };

  /**
   * polling caret position
   */
  var _pollCaretPosition = function () {
    var queryModule = Module.get('query');

    if (!$el.is(':focus')) {
      _stopListen();
    }

    var caret = $el.caret();
    var value = $el.text().replace(/\s/g, ' ');

    if (lastPolledCaretPosition !== caret || lastPolledValue !== value) {
      lastPolledCaretPosition = caret;
      lastPolledValue = value;
    } else if (value !== lastTriggeredValue) {
      lastTriggeredCaretPosition = caret;
      lastTriggeredValue = value;
      // Trigger event if value changed
      queryModule.trigger('delayedChange:done', {value: value, caret: caret});
      _doAssist(value, caret, true);
    } else if (caret !== lastTriggeredCaretPosition) {
      lastTriggeredCaretPosition = caret;
      lastTriggeredValue = value;
      // trigger event if just caret position changed
      queryModule.trigger('delayedCaretMove:done', {value: value, caret: caret});
      _doAssist(value, caret, false);
    }
  };

  /**
   * init suggest handle
   * @param {string} query Text for handle suggestion
   * @param {number} caret Caret position
   * @param {bool} requestHighlighting Is highlight required
   */
  var _doAssist = function (query, caret, requestHighlighting) {
    var queryModule = Module.get('query');
    if (query && caret) {
      dataSource(query, caret, requestHighlighting).then(function (data /* status, jqXHR*/) {
        /**
         * #{String}.replace(/\s+/g, ' ') needs for trim any whitespaces.
         */
        if (data.styleRanges && ($el.text().replace(/\s+/g, ' ') === query.replace(/\s+/g, ' '))) {
          $el.html(_getHighlightedHtml(data.styleRanges, query));
          _placeCaret($el.find('span').eq(data.caret - 1));
        }
        // if data isn't exist hide a suggest container
        if (data.suggestions) {
          var dropdownData = {
            type: ['typed', 'bound']
          };


          var dropdownTextPosition = data.caret;
          if (data.suggestions[0]) {
            dropdownTextPosition -= data.suggestions[0].matchingEnd - data.suggestions[0].matchingStart;
          }
          dropdownData.items = _getHighlightText(data);

          dropdown('hide');
          dropdown('show', dropdownData, {
            width: 'auto',
            target: $el
          });
          var coords = __getCoords(dropdownTextPosition);

          $(CONTAINER_SELECTOR).css(coords);

          queryModule.trigger('doAssist:done');
        } else {
          queryModule.trigger('hide:done');
          dropdown('hide');
        }

      });
    } else {
      dropdown('hide');
    }
  };

  /**
   * Handle caret position in nested contenteditable element
   * @param jQuery element
   */
  var _placeCaret = function (el) {
    el.focus();
    if (typeof window.getSelection !== 'undefined' && typeof document.createRange !== 'undefined') {
      var range = document.createRange();
      range.selectNodeContents(el[0]);
      range.collapse(false);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (typeof document.body.createTextRange !== 'undefined') {
      var textRange = document.body.createTextRange();
      textRange.moveToElementText(el[0]);
      textRange.collapse(false);
      textRange.select();
    }
  };
  var _getClassname = function (obj, text, pos) {
    var res = [];
    obj.forEach(function (item) {
      if (item.start <= pos && item.start + item.length > pos) {
        res.push(item.style);
      }
    });
    return res;
  };

  /**
   * Return highlighted html
   */
  var _getHighlightedHtml = function (styleRanges, text) {
    function appendItemClass(currentClasses, item) {
      if (item) {
        return (currentClasses ? currentClasses + ' ' : '') + 'ring-query-style_' + item;
      } else {
        return currentClasses;
      }
    }

    function appendLetter(currentHtml, letter, index) {
      var classes = _getClassname(styleRanges, text, index).reduce(appendItemClass, '');
      return currentHtml + '<span class="' + classes + '">' + (letter !== ' ' ? letter : '&nbsp;') + '</span>';
    }

    return text.split('').reduce(appendLetter, '');
  };

  /**
   * get caret coords in abs value
   */
  var __getCoords = function (textPos) {
    textPos = textPos || 1;

    var itemWidth = $(ITEM_CONTENT_SELECTOR).outerWidth(),
      caretPos = $el.find('span').eq(textPos - 1).offset(),
      globalWidth = $global.width(),
      wrapper = $(WRAPPER_SELECTOR),
      widthItemType = (wrapper.outerWidth() - itemWidth) + ITEM_CONTENT_SELECTOR_PADDING;

    // Omit under $el
    caretPos.top += CONTAINER_TOP_PADDING;
    // Follow caret position
    caretPos.left -= widthItemType;

    // Left edge
    if ((caretPos.left) < MIN_LEFT_PADDING) {
      caretPos.left = MIN_LEFT_PADDING;
    }
    // Right edge
    if (caretPos.left > globalWidth - (wrapper.offset().left + wrapper.outerWidth())) {
      caretPos.left = globalWidth - MIN_RIGHT_PADDING - wrapper.outerWidth() - 2;
    }
    return caretPos;
  };

  /**
   * Ajax get suggestion
   */
  var remoteDataSource = function (remoteDataSourceConfig) {
    return function (query, caret, requestHighlighting) {

      var queryModule = Module.get('query'),
        defer = $.Deferred(),
        restUrl = remoteDataSourceConfig.url || '/rest/users/queryAssist?caret=#{caret}&fields=query,caret,suggestions#{styleRanges}&query=#{query}',
        substr = ['query', 'caret', 'styleRanges'],
        suggestArgs = [encodeURI(query), caret, (requestHighlighting ? ',styleRanges' : '')];

      substr.forEach(function (item, index) {
        restUrl = restUrl.replace('#{' + item  + '}', suggestArgs[index] ? suggestArgs[index] : '');
      });

      Module.get('auth')('ajax', restUrl).then(function (data, state, jqXHR) {
        queryModule.trigger('ajax:done', data);
        defer.resolve(data, state, jqXHR);
      }).fail(function () {
          defer.reject.apply(defer, arguments);
        });
      return defer.promise();
    };
  };

  /**
   * get highlight text using suggest.matching{Start|End}
   */
  var _getHighlightText = function (assistData) {
    return $.isArray(assistData.suggestions) && assistData.suggestions.map(function (suggestion) {
      var label = [];

      if (utils.isEmptyString(suggestion.prefix)) {
        label.push(suggestion.prefix);
      } else {
        label.push({
          label: suggestion.prefix,
          type: 'service'
        });
      }

      if (suggestion.option && suggestion.matchingStart !== suggestion.matchingEnd) {
        label.push(suggestion.option.substring(0, suggestion.matchingStart));
        label.push({
          label: suggestion.option.substring(suggestion.matchingStart, suggestion.matchingEnd),
          type: 'highlight'
        });
        label.push(suggestion.option.substring(suggestion.matchingEnd));
      } else {
        label.push(suggestion.option);
      }

      if (utils.isEmptyString(suggestion.suffix)) {
        label.push(suggestion.suffix);
      } else {
        label.push({
          label: suggestion.suffix,
          type: 'service'
        });
      }

      return {
        label: label,
        type: suggestion.description,
        event: {
          name: 'dropdown:complete',
          data: {
            assistData: assistData,
            suggestion: suggestion
          }
        }
      };
    }) || [];
  };

  /**
   * autocomplete current text field
   */
  var _handleComplete = function (data) {
    var queryModule = Module.get('query'),
      input = data.assistData.query || '',
      insText = (data.suggestion.prefix || '') + data.suggestion.option + (data.suggestion.suffix || ''),
      output = input.substr(0, data.suggestion.completionStart) + insText + input.substr(data.suggestion.completionEnd);

    $el.text(output);
    _doAssist(output, data.suggestion.caret, true);
    queryModule.trigger('complete:done', data);
  };

  dropdown.on('complete', _handleComplete);

  Module.add('query', {
    init: {
      method: init,
      override: true
    },
    remoteDataSource: {
      method: remoteDataSource,
      override: true
    },
    destroy: {
      method: destroy,
      override: true
    }
  });
});