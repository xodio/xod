const methods = require('../utils/methods');

module.exports = function UserModel(User) {
  methods.filter(
    [
      'findById',

      'login',
      'logout',
      'resetPassword',
      'confirm',

      '__findById__projects',
      '__get__projects',
      '__count__projects',
    ],
    User
  );
};
