import List from 'list/list';
import HubSourceUsersGroups from 'hub-source/hub-source__users-groups';

let defaultOptions = {
  GroupsTitle: 'Groups',
  NoGroupsTitle: 'No groups',

  UsersTitle: 'Users',
  NoUsersTitle: 'No users',

  getPluralForUserCount: () => ''
};

export default class ListUsersGroupsSource extends HubSourceUsersGroups {
  constructor(auth, options) {
    super(auth, options);

    this.listSourceOptions = Object.assign({}, defaultOptions, options);
  }

  getGroupsSectionTitle(groups) {
    return groups.length ? this.listSourceOptions.GroupsTitle : this.listSourceOptions.NoGroupsTitle;
  }

  getUsersSectionTitle(users) {
    return users.length ? this.listSourceOptions.UsersTitle : this.listSourceOptions.NoUsersTitle;
  }

  getForList(query) {
    return this.getUserAndGroups(query)
      .then(([users, groups]) => {
        let groupsTitle = {
          rgItemType: List.ListProps.Type.SEPARATOR,
          key: 1,
          description: this.getGroupsSectionTitle(groups)
        };

        let groupsForList = groups.map(group => {
          return Object.assign(group, {
            key: group.id,
            label: group.name,
            description: this.listSourceOptions.getPluralForUserCount(group.userCount)
          });
        });

        let usersTitle = {
          rgItemType: List.ListProps.Type.SEPARATOR,
          key: 2,
          description: this.getUsersSectionTitle(users)
        };

        let usersForList = users.map(user => {
          return Object.assign(user, {
            key: user.id,
            label: user.name,
            icon: user.profile.avatar.url,
            description: user.login
          });
        });

        return [groupsTitle, ...groupsForList, usersTitle, ...usersForList];
      });
  }
}
