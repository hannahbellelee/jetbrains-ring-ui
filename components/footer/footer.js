/**
 * @name Footer
 * @category Components
 * @description Displays a configurable page footer.
 *
 * A footer consists of three sections, each optional:
 * - left
 * - center
 * - right
 */

/* eslint-disable react/no-multi-comp */

import 'dom4';
import React, {PropTypes, isValidElement} from 'react';
import classNames from 'classnames';
import RingComponent from '../ring-component/ring-component';
import Link from '../link/link';
import styles from './footer.css';

/**
 * @constructor
 * @extends {ReactComponent}
 */
class FooterColumn extends RingComponent {
  static propTypes = {
    position: PropTypes.string
  };

  render() {
    const {position, children} = this.props;
    const classes = classNames({
      [styles.columnLeft]: position === 'left',
      [styles.columnCenter]: position === 'center',
      [styles.columnRight]: position === 'right'
    });
    return (
      <div className={classes}>
        <ul className={styles.columnItem}>
          {children}
        </ul>
      </div>
    );
  }
}

/**
 * Return copyright string
 * @param year {int}
 * @returns {string}
 */
export function copyright(year) {
  const currentYear = (new Date()).getUTCFullYear();
  const mdash = '—';
  let ret = '© ';

  if (year >= currentYear) {
    ret += year;
  } else {
    ret += year + mdash + currentYear;
  }

  return ret;
}

/**
 * @constructor
 * @extends {ReactComponent}
 */
class FooterLine extends RingComponent {
  static propTypes = {
    item: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.array,
      PropTypes.string
    ])
  };

  render() {
    const items = Array.isArray(this.props.item) ? this.props.item : [this.props.item];

    function renderItem(item) {
      if (isValidElement(item)) {
        return item;
      }

      const element = (item.copyright ? copyright(item.copyright) : '') + (item.label || item);

      if (item.url) {
        return (
          <Link
            href={item.url}
            key={item.url + item.title}
            title={item.title}
          >{element}</Link>
        );
      }

      return element;
    }

    return (
      <li className={styles.line}>
        {items.map(renderItem)}
      </li>
    );
  }
}

/**
 * @constructor
 * @extends {ReactComponent}
 *
 * @param {string[]} className Additional classnames to assign to the component
 * @param {Object[]} left Left column elements
 * @param {Object[]} center Center column elements
 * @param {Object[]} right Right column elements
 * @returns {React} react component
 *
 * @example
   <example name="Footer">
     <file name="index.html">
      <div>
       <div id="footer"></div>
      </div>
     </file>
     <file name="index.scss">
      body {
        margin: 0;
      }
     </file>
     <file name="index.js" webpack="true">
      import {render} from 'react-dom';
      import Footer from 'ring-ui/components/footer/footer';

      render(
      Footer.factory({
           className: 'stuff',
           left: [
             [{url: 'http://www.jetbrains.com/teamcity/?fromserver', label: 'TeamCity'}, ' by JetBrains'],
             'Enterprise 8.0.2 EAP (build 27448)'
           ],
           center: [
             [{copyright: 2000, label: ' JetBrains'}, ' · All rights reserved'],
             {url: 'http://teamcity.jetbrains.com/showagreement.html', label: 'License agreement', title: 'read me!'}
           ],
           right: [
             {url: 'http://www.jetbrains.com/teamcity/feedback?source=footer&version=8.0.3%20(build%2027531)&build=27531&mode=ent', label: 'Feedback'}
           ]
         }
      ), document.getElementById('footer'));
     </file>
   </example>
 */
export default class Footer extends RingComponent {
  /** @override */
  static propTypes = {
    className: PropTypes.string,
    floating: PropTypes.bool,
    left: PropTypes.array,
    center: PropTypes.array,
    right: PropTypes.array
  };

  render() {
    const {floating} = this.props;

    function content(elements, position) {
      if (!elements) {
        return false;
      }

      return (
        <FooterColumn
          key={position}
          position={position}
        >{elements.map((item, idx) => (
          <FooterLine
            key={idx}
            item={item}
          />
        ))}</FooterColumn>
      );
    }

    const classes = classNames(styles.footer, this.props.className, {
      [styles.footerFloating]: floating
    });

    return (
      <div
        className={classes}
        data-test="ring-footer"
      >{
        [
          content(this.props.left, 'left'),
          content(this.props.center, 'center'),
          content(this.props.right, 'right')
        ]
      }</div>
    );
  }
}
