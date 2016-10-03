// Create a user
module.exports = userOptions => app =>
  new Promise(resolve => {
    const User = app.models.user;

    User.create(
      userOptions,
      (err, instance) => {
        if (err) { console.error(err); }
        console.log(`+ Add user ${instance.username}:${userOptions.password}: successfully.`);
        resolve(app);
      });
  });
