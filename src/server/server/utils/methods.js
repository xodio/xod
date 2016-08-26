const R = require('ramda');

const list = [
  { name: 'create', isStatic: true },
  { name: 'upsert', isStatic: true },
  { name: 'updateAll', isStatic: true },
  { name: 'updateAttributes', isStatic: false },
  { name: 'replaceOrCreate', isStatic: true },
  { name: 'createChangeStream', isStatic: true },

  { name: 'find', isStatic: true },
  { name: 'findById', isStatic: true },
  { name: 'findOne', isStatic: true },

  { name: 'deleteById', isStatic: true },

  { name: 'count', isStatic: true },
  { name: 'exists', isStatic: true },

  { name: 'confirm', isStatic: true },
  { name: 'login', isStatic: true },
  { name: 'logout', isStatic: true },
  { name: 'resetPassword', isStatic: true },

  { name: '__count__', isStatic: false },
  { name: '__create__', isStatic: false },
  { name: '__delete__', isStatic: false },
  { name: '__destroyById__', isStatic: false },
  { name: '__findById__', isStatic: false },
  { name: '__get__', isStatic: false },
  { name: '__updateById__', isStatic: false },
];

const disable = R.curry(
  (methods, Model) => {
    if (!R.isArrayLike(methods)) { return; }

    methods.forEach(method => {
      Model.disableRemoteMethod(method.name, method.isStatic);
    });
  }
);

// :: ['methodName', ...] -> [{name: methodName, isStatic: boolean}, ...]
const get = R.map(
  R.compose(
    R.flip(R.find)(list),
    R.propEq('name')
  )
);

const reject = R.curry(
  (methods, Model) => {
    const listToDisable = get(methods);

    return disable(listToDisable, Model);
  }
);

const filter = R.curry(
  (methodsToExpose, Model) => {
    if (Model && Model.sharedClass) {
      const publicMethods = methodsToExpose || [];

      const methods = Model.sharedClass.methods();
      const relationMethods = [];
      const hiddenMethods = [];

      Object.keys(Model.definition.settings.relations).forEach(relation => {
        relationMethods.push({ name: `__findById__${relation}`, isStatic: false });
        relationMethods.push({ name: `__destroyById__${relation}`, isStatic: false });
        relationMethods.push({ name: `__updateById__${relation}`, isStatic: false });
        relationMethods.push({ name: `__exists__${relation}`, isStatic: false });
        relationMethods.push({ name: `__link__${relation}`, isStatic: false });
        relationMethods.push({ name: `__get__${relation}`, isStatic: false });
        relationMethods.push({ name: `__create__${relation}`, isStatic: false });
        relationMethods.push({ name: `__update__${relation}`, isStatic: false });
        relationMethods.push({ name: `__destroy__${relation}`, isStatic: false });
        relationMethods.push({ name: `__unlink__${relation}`, isStatic: false });
        relationMethods.push({ name: `__count__${relation}`, isStatic: false });
        relationMethods.push({ name: `__delete__${relation}`, isStatic: false });
      });

      methods.concat(relationMethods).forEach(method => {
        const methodName = method.name;
        if (publicMethods.indexOf(methodName) < 0) {
          hiddenMethods.push(methodName);
          Model.disableRemoteMethod(methodName, method.isStatic);
        }
      });
    }
  }
);

const rejectUnauthorized = (Model) => {
  const acls = Model.definition.settings.acls || [];
  let authorizedMethods = [];

  acls.forEach((acl) => {
    if (acl.permission === 'ALLOW' && acl.property) {
      if (Array.isArray(acl.property)) {
        authorizedMethods = authorizedMethods.concat(acl.property);
      } else if (acl.property !== '*') {
        authorizedMethods.push(acl.property);
      }
    }
  });

  filter(authorizedMethods, Model);
};

module.exports = {
  list,
  reject,
  rejectUnauthorized,
  filter,
};
