const R = require('ramda');
const methods = require('../utils/methods');

module.exports = function UserModel(User) {
  User.validatesUniquenessOf('username', { message: 'User already exists' });
  User.validatesLengthOf('password', { min: 6, message: { min: 'Password is too short' } });
  User.validatesUniquenessOf('email', { message: 'Email is not unique' });

  methods.filter(
    [
      'findById',

      'logout',
      'resetPassword',
      'confirm',

      '__findById__projects',
      '__get__projects',
      '__count__projects',
    ],
    User
  );

  User.signIn = (username, password, send) => {
    const app = User.app;
    const Project = app.models.Project;

    User.login(
      {
        username,
        password,
      },
      'user',
      (uErr, usr) => {
        Project.find({
          where: { ownerId: usr.userId },
        }, (pErr, proj) => {
          const err = (uErr || pErr) ? R.merge(uErr, pErr) : null;

          send(err, {
            id: usr.id,
            ttl: usr.ttl,
            userId: usr.userId,
            username: usr.user.username,
            userpic: usr.user.userpic,
            projects: proj,
          });
        });
      }
    );
  };

  User.remoteMethod('signIn', {
    http: { path: '/login', verb: 'post' },
    accepts: [
      { arg: 'username', type: 'string', required: true },
      { arg: 'password', type: 'string', required: true },
    ],
    returns: [
      { arg: 'id', type: 'string', root: true },
      { arg: 'ttl', type: 'number', root: true },
      { arg: 'userId', type: 'string', root: true },
      { arg: 'username', type: 'string', root: true },
      { arg: 'userpic', type: 'string', root: true },
      { arg: 'projects', type: ['object'], root: true },
    ],
  });
};
