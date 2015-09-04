/**
 * @fileoverview Alert. Can be used to display messages, shown inline in context.
 * Can also be used to display a stack of messages. In this case
 * use {@link Alerts}.
 * @author igor.alexeenko@jetbrains.com (Igor Alekseenko)
 */

import React from 'react';
import { findDOMNode, unmountComponentAtNode } from 'react-dom';
import classNames from 'classnames';
import RingComponent from 'ring-component/ring-component';
import Global from 'global/global';
import Icon from 'icon/icon';

import './alert.scss';

/**
 * List of available types of alert.
 * @enum {string}
 */
const Type = {
  ERROR: 'error',
  MESSAGE: 'message',
  SUCCESS: 'success',
  WARNING: 'warning'
};

/**
 * Lookup table of alert type to icon modifier.
 * @type {Object.<Type, string>}
 */
const TypeToIconModifier = Global.createObject(
    Type.ERROR, 'exception',
    Type.SUCCESS, 'ok',
    Type.WARNING, 'warning');

/**
 * Lookup table of alert type to icon color.
 * @type {Object.<Type, Icon.Color>}
 */
const TypeToIconColor = Global.createObject(
    Type.ERROR, Icon.Color.RED,
    Type.SUCCESS, Icon.Color.GREEN,
    Type.WARNING, Icon.Color.ORANGE);

/**
 * @const
 * @type {string}
 */
const BASE_CLASS = 'ring-alert';

/**
 * @constructor
 * @name Alert
 * @extends {ReactComponent}
 * @example
   <example name="Alert">
     <file name="index.html">
       <div id="alert-container"></div>
     </file>

     <file name="index.js" webpack="true">
       var render = require('react-dom').render;
       var Alert = require('alert/alert');

       var alert = render(Alert.factory({
         caption: 'Sample alert',
         closeable: true,
         type: Alert.Type.SUCCESS
       }), document.querySelector('#alert-container'));
     </file>
   </example>
 */
export default class Alert extends RingComponent {
  static Type = Type;

  /** @override */
  static defaultProps = {
    /** @type {Deferred} */
    animationDeferred: null,

    /** @type {ReactComponent|string} */
    caption: null,

    /** @type {boolean} */
    closeable: false,

    /**
     * Whether component is rendered inside {@code Alerts} container
     * or separately. Sometimes alerts are used to show messages
     * contextually.
     * @type {boolean}
     */
    inline: true,

    /**
     * Click handler on close element.
     * @type {?function(SyntheticMouseEvent):undefined}
     */
    onCloseClick: null,

    /** @type {Type} */
    type: Type.MESSAGE
  };

  /** @override */
  componentDidMount() {
    if (this.props.animationDeferred) {
      if (typeof TransitionEvent === 'undefined') {
        this.props.animationDeferred.resolve(this);
      }

      findDOMNode(this).addEventListener('transitionend', this._handleTransitionEnd);
    }
  }

  /** @override */
  componentWillUnmount() {
    findDOMNode(this).removeEventListener('transitionend', this._handleTransitionEnd);
  }

  /** @override */
  render() {
    let modifiedClassName = [BASE_CLASS, this.props.type].join('_');

    let classes = classNames(
      Global.createObject(
        BASE_CLASS, true,
        modifiedClassName, true,
        'ring-alert_inline',
      this.props.inline)
    );

    return (<div className={classes}>
      {this._getIcon()}
      {this._getCaption()}
      {
        this.props.closeable ?
        <Icon className="ring-alert__close" glyph="close" size={Icon.Size.Size16} onClick={this._handleCloseClick} /> :
        ''
      }
    </div>);
  }

  /**
   * Removes component from DOM.
   * @throws {Error} Throws an error if component rendered as a part of alerts
   * stack being deleted by this method.
   */
  close() {
    if (this.props.inline) {
      unmountComponentAtNode(findDOMNode(this).parentNode);
      return;
    }

    throw new Error('Removal of Alert by itself isn\'t possible ' +
        'if it has been rendered as a part of Alerts. ' +
        'Use Alerts.prototype.remove(index:number) instead.');
  }

  /**
   * @private
   */
  _handleTransitionEnd = () => {
    if (this.props.animationDeferred) {
      findDOMNode(this).removeEventListener('transitionend', this._handleTransitionEnd);
      this.props.animationDeferred.resolve(this);
    }
  }

  /**
   * @param {SyntheticEvent} evt
   * @private
   */
  _handleCloseClick = evt => {
    if (this.props.inline) {
      this.close();
    } else {
      this.props.onCloseClick(evt);
    }
  }

  /**
   * @private
   */
  _getCaption() {
    return (<span className="ring-alert__caption">{this.props.caption}</span>);
  }

  /**
   * @private
   * @return {XML|string}
   */
  _getIcon() {
    let iconModifier = TypeToIconModifier[this.props.type];

    if (iconModifier) {
      return (<Icon
          className="ring-alert__icon"
          color={TypeToIconColor[this.props.type] || Icon.Color.DEFAULT}
          glyph={iconModifier}
          size={Icon.Size.Size16} />);
    }

    return '';
  }
}
