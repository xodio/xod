
if (!Object.prototype.assign) {  
    Object.defineProperty( Object.prototype, "assign", {
        enumerable: false,
        value: function () {
            var args = [].slice.call(arguments),
            target = args.shift();

            return args.reduce(function(base, obj) {
                Object.keys(obj).forEach(function(prop) {
                    if (obj.hasOwnProperty(prop)) {
                        base[prop] = obj[prop];
                    }
                });
                return base;
            }, target);
        }
    });
}
