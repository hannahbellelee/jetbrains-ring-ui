import React, {PureComponent} from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import Theme from '../global/theme';
import dataTests from '../global/data-tests';

import styles from './loader-inline.css';
import injectStyles from './inject-styles';

/**
 * @name Loader Inline
 * @category Components
 * @tags Ring UI Language
 * @constructor
 * @description Displays a small animated loader, shown inline with text. Use case: contextual loading animation.
 * @extends {ReactComponent}
 * @example-file ./loader-inline.examples.html
 */

export default class LoaderInline extends PureComponent {
  static Theme = Theme;
  static propTypes = {
    theme: PropTypes.oneOf(Object.values(Theme)),
    className: PropTypes.string,
    'data-test': PropTypes.string
  };

  static defaultProps = {
    theme: Theme.LIGHT
  };

  componentDidMount() {
    injectStyles();
  }

  render() {
    const {className, theme, 'data-test': dataTest, ...restProps} = this.props;

    const classes = classNames(
      styles.loader,
      className,
      `${styles.loader}_${theme}`
    );

    return (
      <div
        {...restProps}
        data-test={dataTests('ring-loader-inline', dataTest)}
        className={classes}
      />
    );
  }
}
