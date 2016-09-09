const R = require('ramda');
const methods = require('../utils/methods');
const extract = source => JSON.parse(JSON.stringify(source)); // @TODO: Remove this hack

module.exports = function UserModel(User) {
  User.validatesUniquenessOf('username', { message: 'User already exists' });
  User.validatesLengthOf('password', { min: 6, message: { min: 'Password is too short' } });
  User.validatesUniquenessOf('email', { message: 'Email is not unique' });

  methods.filter(
    [
      'logout',
      'resetPassword',
      'confirm',

      '__findById__projects',
      '__get__projects',
      '__count__projects',
    ],
    User
  );

  // /user/login
  // Custom login with returning user data, includes project list
  User.signIn = (credentials, send) => {
    const app = User.app;
    const Project = app.models.Project;
    User.login(
      credentials,
      'user',
      (uErr, usr) => {
        const userData = extract(usr);

        Project.find({
          where: { ownerId: userData.userId },
        }, (pErr, proj) => {
          const err = (uErr || pErr) ? R.merge(uErr, pErr) : null;
          send(err, {
            id: userData.id,
            ttl: userData.ttl,
            userId: userData.userId,
            username: userData.user.username,
            userpic: userData.user.userpic,
            projects: proj,
          });
        });
      }
    );
  };

  User.remoteMethod('signIn', {
    http: { path: '/login', verb: 'post' },
    accepts: { arg: 'credentials', type: 'object', http: { source: 'body' } },
    returns: [
      { arg: 'id', type: 'string', root: true },
      { arg: 'ttl', type: 'number', root: true },
      { arg: 'userId', type: 'string', root: true },
      { arg: 'username', type: 'string', root: true },
      { arg: 'userpic', type: 'string', root: true },
      { arg: 'projects', type: ['object'], root: true },
    ],
  });

  // /user/{id}
  // Returns userdata, includes project list
  User.getUserData = (id, send) => {
    User.findOne({
      where: { id },
      include: 'projects',
    }, (err, result) => {
      send(err, result);
    });
  };

  User.remoteMethod('getUserData', {
    http: { path: '/:id', verb: 'get' },
    accepts: { arg: 'id', type: 'string', required: true },
    returns: [
      { arg: 'id', type: 'string', root: true },
      { arg: 'username', type: 'string', root: true },
      { arg: 'userpic', type: 'string', root: true },
      { arg: 'projects', type: ['object'], root: true },
    ],
  });
};
